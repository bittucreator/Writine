import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Azure AI FLUX.1-Kontext-pro endpoint
const AZURE_ENDPOINT = process.env.AZURE_IMAGE_ENDPOINT || 'https://unosend.services.ai.azure.com/openai/deployments/FLUX.1-Kontext-pro/images/generations?api-version=2025-04-01-preview';
const AZURE_API_KEY = process.env.AZURE_IMAGE_API_KEY;

// Lazy-load Supabase client for storage
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, size = '1024x1024' } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!AZURE_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Image generation not configured' },
        { status: 500 }
      );
    }

    // Call Azure AI FLUX endpoint
    const response = await fetch(AZURE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_API_KEY,
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1,
        size: size,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure Image API error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `Image generation failed: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    // Azure returns the image in data[0].url or data[0].b64_json
    let imageUrl = data.data?.[0]?.url || null;
    const imageBase64 = data.data?.[0]?.b64_json || null;

    if (!imageUrl && !imageBase64) {
      return NextResponse.json(
        { success: false, error: 'No image generated' },
        { status: 500 }
      );
    }

    // If we got base64, upload to Supabase storage
    if (!imageUrl && imageBase64) {
      try {
        // Convert base64 to buffer
        const buffer = Buffer.from(imageBase64, 'base64');
        const fileName = `ai-generated-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
        
        const supabase = getSupabaseClient();
        
        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, buffer, {
            contentType: 'image/png',
            upsert: false,
          });

        if (uploadError) {
          console.error('Supabase upload error:', uploadError);
          // Fall back to base64 data URL
          imageUrl = `data:image/png;base64,${imageBase64}`;
        } else {
          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('media')
            .getPublicUrl(fileName);
          imageUrl = publicUrlData.publicUrl;
        }
      } catch (uploadErr) {
        console.error('Upload error:', uploadErr);
        // Fall back to base64 data URL
        imageUrl = `data:image/png;base64,${imageBase64}`;
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
