// Convert markdown to HTML (fallback for AI-generated markdown)
function markdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Convert headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Convert bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Convert bullet lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Convert numbered lists  
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // Convert line breaks to paragraphs
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs.map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<li') || p.startsWith('<blockquote')) {
      return p;
    }
    // Wrap plain text in <p> tags
    if (!p.startsWith('<')) {
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }
    return p;
  }).join('\n');
  
  return html;
}

export async function generateBlogContent(prompt: string, tone: string = 'professional'): Promise<string> {
  try {
    const response = await fetch('/api/generate-ai-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'blog',
        prompt,
        tone,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API error:', error);
      throw new Error('Failed to generate content');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate content');
    }

    let content = result.data.content[0].text;
    
    // If content contains markdown syntax, convert to HTML
    if (content.includes('##') || content.includes('**') || /^- /m.test(content)) {
      content = markdownToHtml(content);
    }
    
    return content;
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}

// Streaming version for live AI writing effect
export async function streamBlogContent(
  prompt: string, 
  tone: string = 'professional',
  onChunk: (text: string) => void
): Promise<string> {
  try {
    const response = await fetch('/api/generate-ai-content/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        tone,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate content');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullContent += chunk;
      onChunk(fullContent);
    }

    // Convert markdown to HTML if needed
    if (fullContent.includes('##') || fullContent.includes('**') || /^- /m.test(fullContent)) {
      fullContent = markdownToHtml(fullContent);
    }

    return fullContent;
  } catch (error) {
    console.error('Streaming error:', error);
    throw error;
  }
}

export async function generateOutline(topic: string, keywords: string = ''): Promise<string[]> {
  try {
    const response = await fetch('/api/generate-ai-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'outline',
        topic,
        keywords,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Outline API error:', error);
      throw new Error('Failed to generate outline');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate outline');
    }

    const responseText = result.data.content[0].text;
    
    // Parse the outline - expecting numbered list or JSON array
    const lines = responseText.split('\n').filter((line: string) => line.trim());
    const outline = lines.map((line: string) => line.replace(/^\d+\.\s*/, '').trim()).filter((line: string) => line);
    
    return outline.length > 0 ? outline : ['Introduction', 'Main Content', 'Conclusion'];
  } catch (error) {
    console.error('Outline generation error:', error);
    throw error;
  }
}

export async function generateSEOMetadata(content: string, title: string): Promise<{
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
}> {
  try {
    const response = await fetch('/api/generate-ai-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'seo',
        title,
        content,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SEO API error:', error);
      throw new Error('Failed to generate SEO metadata');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate SEO metadata');
    }

    const responseText = result.data.content[0].text;
    
    try {
      const parsed = JSON.parse(responseText);
      return {
        seoTitle: parsed.seoTitle || title,
        seoDescription: parsed.seoDescription || '',
        keywords: parsed.keywords || [],
      };
    } catch {
      return {
        seoTitle: title,
        seoDescription: content.slice(0, 160),
        keywords: [],
      };
    }
  } catch (error) {
    console.error('SEO generation error:', error);
    throw error;
  }
}
