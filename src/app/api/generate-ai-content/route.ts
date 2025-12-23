import { NextRequest, NextResponse } from 'next/server';

const AZURE_ENDPOINT = process.env.AZURE_AI_ENDPOINT;
const AZURE_API_KEY = process.env.AZURE_AI_API_KEY;
const AZURE_DEPLOYMENT = process.env.AZURE_AI_DEPLOYMENT_NAME || 'claude-opus-4-5';
const AZURE_IMAGE_ENDPOINT = process.env.AZURE_IMAGE_ENDPOINT;
const AZURE_IMAGE_API_KEY = process.env.AZURE_IMAGE_API_KEY;

// Helper function to generate image from prompt
async function generateImage(prompt: string, size: string = '1792x1024'): Promise<string | null> {
  if (!AZURE_IMAGE_ENDPOINT || !AZURE_IMAGE_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(AZURE_IMAGE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_IMAGE_API_KEY,
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1,
        size: size,
      }),
    });

    if (!response.ok) {
      console.error('Image generation failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.url || null;
  } catch (error) {
    console.error('Image generation error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, prompt, tone, topic, keywords, title, content } = body;

    if (!AZURE_ENDPOINT || !AZURE_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Azure AI not configured' },
        { status: 500 }
      );
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'blog':
        systemPrompt = `You are a professional blog writer. Write engaging, SEO-optimized content in a ${tone} tone.
        
CRITICAL: Output ONLY valid HTML. Do NOT use markdown syntax.

Use these HTML tags:
- <h2> for main section headings
- <h3> for sub-section headings
- <p> for paragraphs
- <ul> and <li> for bullet lists
- <ol> and <li> for numbered lists
- <strong> for bold text
- <em> for italic text
- <blockquote> for quotes

Example format:
<h2>Introduction</h2>
<p>This is the first paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
<h3>Key Points</h3>
<ul>
<li>First point</li>
<li>Second point</li>
</ul>

Make the content informative, well-structured, and easy to read. Do NOT include markdown symbols like #, ##, **, or -.`;
        userPrompt = prompt;
        break;

      case 'outline':
        systemPrompt = `You are a content strategist. Generate a structured blog outline.
        Return a numbered list of 5-8 main sections that would make a comprehensive blog post.
        Each section should be a clear, concise heading.`;
        userPrompt = `Create an outline for a blog post about: ${topic}
        ${keywords ? `Include these keywords naturally: ${keywords}` : ''}`;
        break;

      case 'seo':
        systemPrompt = `You are an SEO expert. Analyze the content and generate SEO metadata.
        Return a JSON object with these exact fields:
        {
          "seoTitle": "SEO-optimized title (50-60 chars)",
          "seoDescription": "Meta description (120-160 chars)",
          "keywords": ["keyword1", "keyword2", "keyword3"]
        }
        Return ONLY the JSON object, no other text.`;
        userPrompt = `Title: ${title}\n\nContent: ${content?.slice(0, 2000)}`;
        break;

      case 'improve':
        systemPrompt = `You are a helpful AI assistant. Follow the user's instructions precisely and return only the requested output, no explanations.`;
        userPrompt = prompt;
        break;

      case 'image-prompts':
        systemPrompt = `You are an expert at creating image generation prompts. Based on the blog content, suggest 2-3 detailed image prompts that would enhance the article.
        
Return a JSON array of image prompts. Each prompt should be:
- Detailed and descriptive (50-100 words)
- Include artistic style, mood, lighting, composition
- Relevant to the section of the blog

Return ONLY a JSON array like this:
[
  {"section": "Introduction", "prompt": "A detailed image prompt here..."},
  {"section": "Main Content", "prompt": "Another detailed image prompt..."}
]`;
        userPrompt = `Generate image prompts for this blog:\n\n${content?.slice(0, 3000)}`;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type' },
          { status: 400 }
        );
    }

    // Use Anthropic API format for Azure AI Services
    const response = await fetch(`${AZURE_ENDPOINT}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AZURE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AZURE_DEPLOYMENT,
        max_tokens: type === 'blog' ? 4000 : 1000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Azure AI error:', error);
      return NextResponse.json(
        { success: false, error: 'AI generation failed' },
        { status: 500 }
      );
    }

    const result = await response.json();
    // Anthropic API returns content as array of blocks
    const generatedText = result.content?.[0]?.text || '';

    // For blog generation with images, generate AI images based on content
    if (type === 'blog' && body.generateImages) {
      try {
        // First, get image prompts for the blog content
        const imagePromptsResponse = await fetch(`${AZURE_ENDPOINT}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': AZURE_API_KEY!,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: AZURE_DEPLOYMENT,
            max_tokens: 1000,
            system: `You are an expert at creating image generation prompts. Based on the blog content, suggest 2-3 detailed image prompts that would enhance the article.
            
Return ONLY a JSON array like this (no other text):
[
  {"section": "Introduction", "prompt": "A detailed image prompt here with artistic style, mood, lighting..."},
  {"section": "Main Point", "prompt": "Another detailed image prompt..."}
]`,
            messages: [
              { role: 'user', content: `Generate image prompts for this blog:\n\n${generatedText.slice(0, 3000)}` },
            ],
          }),
        });

        if (imagePromptsResponse.ok) {
          const promptsResult = await imagePromptsResponse.json();
          const promptsText = promptsResult.content?.[0]?.text || '';
          
          // Parse JSON from response
          const jsonMatch = promptsText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const imagePrompts = JSON.parse(jsonMatch[0]);
            
            // Generate images in parallel
            const imageResults = await Promise.all(
              imagePrompts.slice(0, 3).map(async (item: { section: string; prompt: string }) => {
                const imageUrl = await generateImage(item.prompt);
                return {
                  section: item.section,
                  prompt: item.prompt,
                  url: imageUrl,
                };
              })
            );

            return NextResponse.json({
              success: true,
              data: {
                content: [{ text: generatedText }],
                images: imageResults.filter(img => img.url !== null),
              },
            });
          }
        }
      } catch (imageError) {
        console.error('Image generation error:', imageError);
        // Continue without images
      }
    }

    // Handle image-prompts type - parse and return as prompts array
    if (type === 'image-prompts') {
      try {
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const imagePrompts = JSON.parse(jsonMatch[0]);
          const prompts = imagePrompts.map((item: { prompt: string }) => item.prompt);
          return NextResponse.json({
            success: true,
            prompts,
          });
        }
      } catch (parseError) {
        console.error('Failed to parse image prompts:', parseError);
      }
      return NextResponse.json({
        success: true,
        prompts: [],
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        content: [{ text: generatedText }],
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
