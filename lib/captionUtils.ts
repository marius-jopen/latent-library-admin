/**
 * Extract clean text from caption JSON structure
 * Handles various caption formats and returns just the text content
 */
export function extractCaptionText(caption: string): string {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(caption);
    
    // Look for common caption keys
    if (parsed['<MORE_DETAILED_CAPTION>']) {
      return parsed['<MORE_DETAILED_CAPTION>'];
    }
    if (parsed.caption) {
      return parsed.caption;
    }
    if (parsed.description) {
      return parsed.description;
    }
    
    // If it's an object, try to find the first string value
    const values = Object.values(parsed);
    const firstString = values.find(v => typeof v === 'string');
    if (firstString) {
      return firstString;
    }
    
    // If parsing failed or no string found, return original
    return caption;
  } catch {
    // If not JSON, return as-is
    return caption;
  }
}
