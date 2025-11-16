/**
 * Markdown conversion utilities.
 * 
 * Provides functions to convert between HTML and Markdown formats.
 */

import TurndownService from "turndown";
import MarkdownIt from "markdown-it";

// Import markdown-it types if available

/**
 * Turndown service instance for HTML to Markdown conversion.
 * Configured with custom rules for better Markdown output.
 */
const turndownService = new TurndownService({
  headingStyle: "atx", // Use # for headings
  codeBlockStyle: "fenced", // Use ``` for code blocks
  bulletListMarker: "-", // Use - for bullet lists
  emDelimiter: "*", // Use * for emphasis
  strongDelimiter: "**", // Use ** for strong
  linkStyle: "inlined", // Use [text](url) for links
  linkReferenceStyle: "full", // Use full reference style
});

// Configure Turndown to preserve images
turndownService.addRule("image", {
  filter: "img",
  replacement: (content, node) => {
    const img = node as HTMLImageElement;
    const alt = img.alt || "";
    const src = img.src || "";
    return `![${alt}](${src})`;
  },
});

/**
 * MarkdownIt instance for Markdown to HTML conversion.
 */
const markdownIt = new MarkdownIt({
  html: true, // Enable HTML tags in Markdown
  linkify: true, // Automatically convert URLs to links
  typographer: true, // Enable typographic replacements
});

/**
 * Converts HTML content to Markdown format.
 * 
 * @param html - HTML content to convert
 * @returns Markdown formatted string
 * 
 * @example
 * ```typescript
 * const markdown = htmlToMarkdown("<h1>Title</h1><p>Content</p>");
 * // Returns: "# Title\n\nContent"
 * ```
 */
export function htmlToMarkdown(html: string): string {
  if (!html || html.trim() === "") {
    return "";
  }

  try {
    return turndownService.turndown(html);
  } catch (error) {
    console.error("Error converting HTML to Markdown:", error);
    return "";
  }
}

/**
 * Converts Markdown content to HTML format.
 * 
 * @param markdown - Markdown content to convert
 * @returns HTML formatted string
 * 
 * @example
 * ```typescript
 * const html = markdownToHtml("# Title\n\nContent");
 * // Returns: "<h1>Title</h1><p>Content</p>"
 * ```
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown || markdown.trim() === "") {
    return "";
  }

  try {
    return markdownIt.render(markdown);
  } catch (error) {
    console.error("Error converting Markdown to HTML:", error);
    return "";
  }
}

/**
 * Validates if a string is valid Markdown.
 * 
 * @param markdown - Markdown content to validate
 * @returns true if valid, false otherwise
 */
export function isValidMarkdown(markdown: string): boolean {
  if (!markdown || markdown.trim() === "") {
    return true; // Empty is valid
  }

  try {
    markdownIt.render(markdown);
    return true;
  } catch (error) {
    return false;
  }
}

