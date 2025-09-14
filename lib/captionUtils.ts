/**
 * Extract clean text from caption JSON structure
 * Handles various caption formats and returns just the text content
 */
export function extractCaptionText(caption: string): string {
  if (!caption) return '';
  
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
    // If not JSON, try to clean up common patterns
    // Remove JSON-like structures that might be displayed as strings
    let cleaned = caption;
    
    // Remove patterns like {'<MORE_DETAILED_CAPTION>': "..."}
    cleaned = cleaned.replace(/^\s*\{\s*['"`]?<MORE_DETAILED_CAPTION>['"`]?\s*:\s*['"`]([^'"]*)['"`]\s*\}\s*$/, '$1');
    
    // Remove other common JSON patterns
    cleaned = cleaned.replace(/^\s*\{\s*['"`]?caption['"`]?\s*:\s*['"`]([^'"]*)['"`]\s*\}\s*$/, '$1');
    cleaned = cleaned.replace(/^\s*\{\s*['"`]?description['"`]?\s*:\s*['"`]([^'"]*)['"`]\s*\}\s*$/, '$1');
    
    return cleaned;
  }
}
