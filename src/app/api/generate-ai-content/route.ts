import { NextRequest, NextResponse } from 'next/server';

const AZURE_ENDPOINT = process.env.AZURE_AI_ENDPOINT;
const AZURE_API_KEY = process.env.AZURE_AI_API_KEY;
const AZURE_DEPLOYMENT = process.env.AZURE_AI_DEPLOYMENT_NAME || 'claude-opus-4-5';

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
