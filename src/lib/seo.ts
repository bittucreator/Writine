export interface SEOAnalysis {
  score: number;
  issues: string[];
  suggestions: string[];
  readabilityScore: number;
}

export function analyzeSEO(
  title: string,
  content: string,
  seoTitle?: string,
  seoDescription?: string,
  keywords?: string[]
): SEOAnalysis {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (!title || title.length < 10) {
    issues.push('Title is too short');
    score -= 10;
  } else if (title.length > 70) {
    issues.push('Title is too long (max 70 characters recommended)');
    score -= 5;
  } else {
    suggestions.push('Title length is optimal');
  }

  if (!seoTitle || seoTitle.length < 30) {
    issues.push('SEO title is missing or too short');
    score -= 10;
  } else if (seoTitle.length > 60) {
    issues.push('SEO title is too long (max 60 characters)');
    score -= 5;
  }

  if (!seoDescription || seoDescription.length < 50) {
    issues.push('Meta description is missing or too short');
    score -= 15;
  } else if (seoDescription.length > 160) {
    issues.push('Meta description is too long (max 160 characters)');
    score -= 10;
  }

  if (!keywords || keywords.length === 0) {
    issues.push('No keywords defined');
    score -= 10;
  } else if (keywords.length < 3) {
    issues.push('Add more keywords (3-10 recommended)');
    score -= 5;
  }

  const wordCount = content.split(/\s+/).length;
  if (wordCount < 300) {
    issues.push('Content is too short (minimum 300 words recommended)');
    score -= 15;
  } else if (wordCount > 2000) {
    suggestions.push('Consider breaking this into multiple posts');
  } else {
    suggestions.push(`Good content length (${wordCount} words)`);
  }

  const headingMatches = content.match(/^#{1,6}\s.+$/gm);
  if (!headingMatches || headingMatches.length < 2) {
    issues.push('Add more headings for better structure');
    score -= 10;
  } else {
    suggestions.push(`Good heading structure (${headingMatches.length} headings)`);
  }

  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
  const avgParagraphLength = paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0) / paragraphs.length;
  if (avgParagraphLength > 100) {
    issues.push('Paragraphs are too long (break them up for readability)');
    score -= 5;
  }

  const hasImages = content.includes('![') || content.includes('<img');
  if (!hasImages) {
    suggestions.push('Consider adding images to enhance engagement');
  }

  const readabilityScore = calculateReadability(content);

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    suggestions,
    readabilityScore,
  };
}

function calculateReadability(content: string): number {
  const text = content.replace(/[#*`\[\]()]/g, '').trim();
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease formula
  const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  
  return Math.max(0, Math.min(100, Math.round(fleschScore)));
}

function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
