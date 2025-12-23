import { NextRequest } from 'next/server';

const AZURE_ENDPOINT = process.env.AZURE_AI_ENDPOINT;
const AZURE_API_KEY = process.env.AZURE_AI_API_KEY;
const AZURE_DEPLOYMENT = process.env.AZURE_AI_DEPLOYMENT_NAME || 'claude-opus-4-5';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, tone } = body;

    if (!AZURE_ENDPOINT || !AZURE_API_KEY) {
      return new Response('Azure AI not configured', { status: 500 });
    }

    const systemPrompt = `You are a professional blog writer. Write engaging, SEO-optimized content in a ${tone || 'professional'} tone.
        
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

Make the content informative, well-structured, and easy to read. Do NOT include markdown symbols like #, ##, **, or -.`;

    // Use Anthropic API format with streaming
    const response = await fetch(`${AZURE_ENDPOINT}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AZURE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AZURE_DEPLOYMENT,
        max_tokens: 4000,
        stream: true,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Azure AI error:', error);
      return new Response('AI generation failed', { status: 500 });
    }

    // Stream the response back to the client
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  // Handle Anthropic streaming format
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    controller.enqueue(encoder.encode(parsed.delta.text));
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Stream error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
