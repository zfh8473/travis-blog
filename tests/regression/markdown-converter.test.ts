/**
 * Regression test for Markdown converter utilities.
 * 
 * Tests HTML to Markdown and Markdown to HTML conversion
 * to ensure compatibility after editor change.
 */

import { htmlToMarkdown, markdownToHtml, isValidMarkdown } from "@/lib/utils/markdown-converter";

describe("Markdown Converter Regression Tests", () => {
  describe("HTML to Markdown Conversion", () => {
    it("should convert simple HTML to Markdown", () => {
      const html = "<h1>Title</h1><p>Content</p>";
      const markdown = htmlToMarkdown(html);
      expect(markdown).toContain("# Title");
      expect(markdown).toContain("Content");
    });

    it("should convert headings correctly", () => {
      const html = "<h1>H1</h1><h2>H2</h2><h3>H3</h3>";
      const markdown = htmlToMarkdown(html);
      expect(markdown).toContain("# H1");
      expect(markdown).toContain("## H2");
      expect(markdown).toContain("### H3");
    });

    it("should convert bold and italic correctly", () => {
      const html = "<p><strong>Bold</strong> and <em>Italic</em></p>";
      const markdown = htmlToMarkdown(html);
      expect(markdown).toContain("**Bold**");
      expect(markdown).toContain("*Italic*");
    });

    it("should convert lists correctly", () => {
      const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
      const markdown = htmlToMarkdown(html);
      // Turndown generates "-   Item" format (with spaces)
      expect(markdown).toMatch(/-.*Item 1/);
      expect(markdown).toMatch(/-.*Item 2/);
    });

    it("should convert images correctly", () => {
      const html = '<img src="https://example.com/image.jpg" alt="Test Image" />';
      const markdown = htmlToMarkdown(html);
      expect(markdown).toContain("![Test Image](https://example.com/image.jpg)");
    });

    it("should handle empty HTML", () => {
      const markdown = htmlToMarkdown("");
      expect(markdown).toBe("");
    });

    it("should handle complex HTML content", () => {
      const html = `
        <h1>Article Title</h1>
        <p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
        </ul>
        <img src="https://example.com/image.jpg" alt="Image" />
      `;
      const markdown = htmlToMarkdown(html);
      expect(markdown).toContain("# Article Title");
      expect(markdown).toContain("**bold**");
      expect(markdown).toContain("*italic*");
      // Turndown generates "-   List item" format (with spaces)
      expect(markdown).toMatch(/-.*List item 1/);
      expect(markdown).toContain("![Image]");
    });
  });

  describe("Markdown to HTML Conversion", () => {
    it("should convert simple Markdown to HTML", () => {
      const markdown = "# Title\n\nContent";
      const html = markdownToHtml(markdown);
      expect(html).toContain("<h1>Title</h1>");
      expect(html).toContain("Content");
    });

    it("should convert headings correctly", () => {
      const markdown = "# H1\n## H2\n### H3";
      const html = markdownToHtml(markdown);
      expect(html).toContain("<h1>H1</h1>");
      expect(html).toContain("<h2>H2</h2>");
      expect(html).toContain("<h3>H3</h3>");
    });

    it("should convert bold and italic correctly", () => {
      const markdown = "**Bold** and *Italic*";
      const html = markdownToHtml(markdown);
      expect(html).toContain("<strong>Bold</strong>");
      expect(html).toContain("<em>Italic</em>");
    });

    it("should convert lists correctly", () => {
      const markdown = "- Item 1\n- Item 2";
      const html = markdownToHtml(markdown);
      expect(html).toContain("<li>Item 1</li>");
      expect(html).toContain("<li>Item 2</li>");
    });

    it("should convert images correctly", () => {
      const markdown = "![Test Image](https://example.com/image.jpg)";
      const html = markdownToHtml(markdown);
      expect(html).toContain("<img");
      expect(html).toContain('src="https://example.com/image.jpg"');
      expect(html).toContain('alt="Test Image"');
    });

    it("should handle empty Markdown", () => {
      const html = markdownToHtml("");
      expect(html).toBe("");
    });

    it("should handle code blocks", () => {
      const markdown = "```javascript\nconst x = 1;\n```";
      const html = markdownToHtml(markdown);
      expect(html).toContain("<pre");
      expect(html).toContain("<code");
    });
  });

  describe("Round-trip Conversion", () => {
    it("should preserve content through HTML -> Markdown -> HTML", () => {
      const originalHtml = "<h1>Title</h1><p>Content</p>";
      const markdown = htmlToMarkdown(originalHtml);
      const convertedHtml = markdownToHtml(markdown);
      
      // The HTML structure might differ, but content should be preserved
      expect(convertedHtml).toContain("Title");
      expect(convertedHtml).toContain("Content");
    });

    it("should preserve content through Markdown -> HTML -> Markdown", () => {
      const originalMarkdown = "# Title\n\nContent";
      const html = markdownToHtml(originalMarkdown);
      const convertedMarkdown = htmlToMarkdown(html);
      
      // The Markdown structure might differ, but content should be preserved
      expect(convertedMarkdown).toContain("Title");
      expect(convertedMarkdown).toContain("Content");
    });
  });

  describe("Markdown Validation", () => {
    it("should validate valid Markdown", () => {
      expect(isValidMarkdown("# Title\n\nContent")).toBe(true);
      expect(isValidMarkdown("**Bold** text")).toBe(true);
      expect(isValidMarkdown("- List item")).toBe(true);
    });

    it("should validate empty Markdown as valid", () => {
      expect(isValidMarkdown("")).toBe(true);
      expect(isValidMarkdown("   ")).toBe(true);
    });

    it("should handle edge cases", () => {
      // MarkdownIt is quite permissive, so most content should be valid
      expect(isValidMarkdown("Plain text")).toBe(true);
    });
  });

  describe("Real-world Scenarios", () => {
    it("should handle article content with mixed elements", () => {
      const html = `
        <h1>Article Title</h1>
        <p>Introduction paragraph with <strong>important</strong> information.</p>
        <h2>Section 1</h2>
        <p>Content for section 1.</p>
        <ul>
          <li>Point 1</li>
          <li>Point 2</li>
        </ul>
        <img src="https://example.com/image.jpg" alt="Example Image" />
        <p>Conclusion paragraph.</p>
      `;
      
      const markdown = htmlToMarkdown(html);
      const convertedHtml = markdownToHtml(markdown);
      
      // Verify key elements are preserved
      expect(markdown).toContain("# Article Title");
      expect(markdown).toContain("**important**");
      expect(markdown).toContain("## Section 1");
      // Turndown generates "-   Point" format (with spaces)
      expect(markdown).toMatch(/-.*Point 1/);
      expect(markdown).toContain("![Example Image]");
      
      expect(convertedHtml).toContain("Article Title");
      expect(convertedHtml).toContain("important");
      expect(convertedHtml).toContain("Section 1");
    });

    it("should handle special characters", () => {
      const markdown = "# Title with < > & \" ' characters\n\nContent";
      const html = markdownToHtml(markdown);
      expect(html).toContain("Title with");
      expect(html).toContain("Content");
    });
  });
});

