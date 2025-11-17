/**
 * Markdown conversion utilities.
 * 
 * Provides functions to convert between HTML and Markdown formats.
 * Includes syntax highlighting for code blocks using Shiki.
 */

import TurndownService from "turndown";
import MarkdownIt from "markdown-it";
import { createHighlighter, type Highlighter } from "shiki";

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
 * Shiki highlighter instance (lazy-loaded).
 * Initialized asynchronously on first use.
 */
let shikiHighlighter: Highlighter | null = null;
let shikiInitializing: Promise<Highlighter> | null = null;

/**
 * Initializes Shiki highlighter.
 * Uses lazy loading to avoid blocking module initialization.
 * 
 * @returns Promise resolving to the Shiki highlighter instance
 */
async function getShikiHighlighter(): Promise<Highlighter> {
  // If already initialized, return it
  if (shikiHighlighter) {
    return shikiHighlighter;
  }

  // If currently initializing, wait for it
  if (shikiInitializing) {
    return shikiInitializing;
  }

  // Start initialization
  shikiInitializing = createHighlighter({
    themes: ["github-dark"], // Use GitHub dark theme (matches our prose-pre:bg-gray-900)
    langs: [
      "javascript",
      "typescript",
      "jsx",
      "tsx",
      "json",
      "html",
      "css",
      "markdown",
      "bash",
      "shell",
      "python",
      "java",
      "c",
      "cpp",
      "csharp",
      "go",
      "rust",
      "php",
      "ruby",
      "swift",
      "kotlin",
      "sql",
      "yaml",
      "xml",
      "dockerfile",
      "diff",
      "plaintext",
    ],
  }).then((highlighter) => {
    shikiHighlighter = highlighter;
    shikiInitializing = null;
    return highlighter;
  });

  return shikiInitializing;
}

/**
 * Renders a code block with syntax highlighting using Shiki.
 * Falls back to plain code block if Shiki is not available.
 * 
 * @param code - Code content
 * @param language - Programming language (optional)
 * @returns HTML string with highlighted code
 */
function renderCodeBlock(code: string, language?: string): string {
  // If no language specified, render as plain code
  if (!language) {
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  }

  // Try to use Shiki if available (synchronous fallback for now)
  // In a production environment, we'd want to make this async,
  // but for compatibility with existing sync API, we'll use a hybrid approach
  if (shikiHighlighter) {
    try {
      const highlighted = shikiHighlighter.codeToHtml(code, {
        lang: language,
        theme: "github-dark",
      });
      return highlighted;
    } catch (error) {
      // If language is not supported, fall back to plain code
      console.warn(`Shiki: Language "${language}" not supported, using plain code`);
      return `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
    }
  }

  // Fallback: plain code block with language class
  return `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
}

/**
 * Escapes HTML special characters.
 * 
 * @param text - Text to escape
 * @returns Escaped HTML string
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * MarkdownIt instance for Markdown to HTML conversion.
 * Configured with custom code block renderer for syntax highlighting.
 */
const markdownIt = new MarkdownIt({
  html: true, // Enable HTML tags in Markdown
  linkify: true, // Automatically convert URLs to links
  typographer: true, // Enable typographic replacements
  highlight: (str, lang) => {
    // Use custom code block renderer
    return renderCodeBlock(str, lang || undefined);
  },
});

// Start initializing Shiki in the background (non-blocking)
// This will make it available for future renders
if (typeof window === "undefined") {
  // Only initialize on server side
  getShikiHighlighter().catch((error) => {
    console.error("Failed to initialize Shiki highlighter:", error);
  });
}

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
 * Converts Markdown content to HTML format with syntax highlighting.
 * 
 * This is a synchronous function that uses Shiki if available.
 * For best results, ensure Shiki is initialized before calling this function
 * (it will be initialized automatically on server side).
 * 
 * @param markdown - Markdown content to convert
 * @returns HTML formatted string with syntax-highlighted code blocks
 * 
 * @example
 * ```typescript
 * const html = markdownToHtml("# Title\n\n```javascript\nconsole.log('Hello');\n```");
 * // Returns HTML with highlighted code block
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
 * Converts Markdown content to HTML format with syntax highlighting (async version).
 * 
 * This function ensures Shiki is initialized before rendering,
 * providing guaranteed syntax highlighting for code blocks.
 * Use this in Server Components for best results.
 * 
 * @param markdown - Markdown content to convert
 * @returns Promise resolving to HTML formatted string with syntax-highlighted code blocks
 * 
 * @example
 * ```typescript
 * const html = await markdownToHtmlAsync("# Title\n\n```javascript\nconsole.log('Hello');\n```");
 * // Returns HTML with highlighted code block
 * ```
 */
export async function markdownToHtmlAsync(markdown: string): Promise<string> {
  if (!markdown || markdown.trim() === "") {
    return "";
  }

  try {
    // Ensure Shiki is initialized
    await getShikiHighlighter();
    
    // Now render with syntax highlighting
    return markdownIt.render(markdown);
  } catch (error) {
    console.error("Error converting Markdown to HTML:", error);
    // Fallback to synchronous version
    return markdownToHtml(markdown);
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

/**
 * Enhances HTML content by applying syntax highlighting to code blocks.
 * 
 * This function finds all `<pre><code>` blocks in HTML and re-renders them
 * with Shiki syntax highlighting. This is useful for articles that were
 * saved before syntax highlighting was implemented.
 * 
 * @param html - HTML content that may contain code blocks
 * @returns Promise resolving to HTML with syntax-highlighted code blocks
 * 
 * @example
 * ```typescript
 * const enhancedHtml = await enhanceHtmlWithSyntaxHighlighting(htmlContent);
 * ```
 */
export async function enhanceHtmlWithSyntaxHighlighting(html: string): Promise<string> {
  if (!html || html.trim() === "") {
    return html;
  }

  try {
    // Ensure Shiki is initialized
    await getShikiHighlighter();

    // If Shiki is not available, return original HTML
    if (!shikiHighlighter) {
      return html;
    }

    // Use a simple regex to find code blocks
    // Pattern: <pre><code class="language-xxx">...</code></pre> or <pre><code>...</code></pre>
    // Note: Using [\s\S] instead of . with 's' flag for better compatibility
    const codeBlockRegex = /<pre><code(?:\s+class=["']language-([^"']+)["'])?[^>]*>([\s\S]*?)<\/code><\/pre>/g;
    
    let enhancedHtml = html;
    const matches: RegExpMatchArray[] = [];
    let match;
    while ((match = codeBlockRegex.exec(html)) !== null) {
      matches.push(match);
    }

    // Process each code block
    for (const match of matches) {
      const fullMatch = match[0];
      const language = match[1] || undefined;
      const code = match[2];

      // Decode HTML entities in code
      const decodedCode = code
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");

      try {
        // Use Shiki to highlight the code
        const highlighted = shikiHighlighter.codeToHtml(decodedCode, {
          lang: language || "plaintext",
          theme: "github-dark",
        });

        // Replace the original code block with highlighted version
        enhancedHtml = enhancedHtml.replace(fullMatch, highlighted);
      } catch (error) {
        // If highlighting fails, keep the original code block
        console.warn(`Failed to highlight code block with language "${language}":`, error);
      }
    }

    return enhancedHtml;
  } catch (error) {
    console.error("Error enhancing HTML with syntax highlighting:", error);
    // Return original HTML on error
    return html;
  }
}

