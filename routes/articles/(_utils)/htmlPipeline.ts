export function htmlPipeline(html: string) {
    // Remove inline styles for cleaner output
    const withoutStyles = html.replace(/<style[\s\S]*?<\/style>/g, "");
    
    // Remove unnecessary elements
    const withoutHead = withoutStyles.replace(/\<head\>.+\<\/head\>/s, "");
    const withoutH1 = withoutHead.replace(/\<h1\>.+\<\/h1\>/s, "");
    
    // Remove any Google Fonts imports (now in CSS)
    const processed = withoutH1.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>/g, "");
    
    // Process markdown links - convert [text](url) to <a href="url">text</a>
    // Split the content by HTML tags and only process text nodes
    let result = '';
    const parts = processed.split(/(<[^>]*>)/);
    
    for (let i = 0; i < parts.length; i++) {
        // If this is a text node (not inside an HTML tag), process markdown links
        if (i % 2 === 0) {
            // Handle markdown links with more complex text content
            // This regex handles links with text that might contain formatting but not other links
            parts[i] = parts[i].replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
                // Ensure URL is properly formatted
                const formattedUrl = url.trim();
                // Return the HTML link
                return `<a href="${formattedUrl}" class="markdown-link">${text}</a>`;
            });
            
            // Convert placeholder quiz text (more than two consecutive underscores) to input fields
            parts[i] = parts[i].replace(/_{3,}/g, (match) => {
                const width = Math.min(Math.max(match.length * 8, 60), 200);
                return `<input type="text" class="quiz-input" style="width: ${width}px; display: inline-block;" />`;
            });
        }
        result += parts[i];
    }
    
    return result;
}