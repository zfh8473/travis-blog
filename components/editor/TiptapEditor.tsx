"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback, useState, useRef } from "react";
import { htmlToMarkdown, markdownToHtml } from "@/lib/utils/markdown-converter";

/**
 * Props for the TiptapEditor component.
 * 
 * @interface TiptapEditorProps
 */
export interface TiptapEditorProps {
  /**
   * Initial HTML content to load into the editor.
   * Used when editing existing articles.
   */
  initialContent?: string;

  /**
   * Callback function called when editor content changes.
   * 
   * @param content - The current HTML content of the editor
   */
  onChange?: (content: string) => void;

  /**
   * Callback function called when user requests to save.
   * Optional - can be handled by parent component.
   * 
   * @param content - The current HTML content of the editor
   */
  onSave?: (content: string) => void;

  /**
   * Placeholder text shown when editor is empty.
   */
  placeholder?: string;

  /**
   * Whether the editor is read-only.
   * When true, users cannot edit the content.
   */
  readOnly?: boolean;
}

/**
 * Tiptap rich text editor component.
 * 
 * Provides a rich text editing experience with formatting options including
 * bold, italic, headings, lists, links, blockquotes, code blocks, and image uploads.
 * 
 * @component
 * @param props - Component props
 * @param props.initialContent - Initial HTML content (for edit mode)
 * @param props.onChange - Callback when content changes
 * @param props.onSave - Optional save callback
 * @param props.placeholder - Placeholder text
 * @param props.readOnly - Whether editor is read-only
 * 
 * @example
 * ```tsx
 * <TiptapEditor
 *   initialContent="<p>Initial content</p>"
 *   onChange={(content) => console.log(content)}
 *   placeholder="Start writing..."
 * />
 * ```
 */
export default function TiptapEditor({
  initialContent,
  onChange,
  onSave,
  placeholder = "Start writing...",
  readOnly = false,
}: TiptapEditorProps) {
  // Error state for user-friendly error messages
  const [error, setError] = useState<string | null>(null);
  
  // Markdown mode states
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const [markdownContent, setMarkdownContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const isMarkdownModeRef = useRef(isMarkdownMode);
  
  // Keep ref in sync with state
  useEffect(() => {
    isMarkdownModeRef.current = isMarkdownMode;
  }, [isMarkdownMode]);

  /**
   * Handles image upload from drag-and-drop or paste.
   * 
   * @param file - Image file to upload
   * @returns Promise resolving to image URL
   */
  const handleImageUpload = useCallback(
    async (file: File): Promise<string> => {
      try {
        setError(null); // Clear previous errors
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage =
            errorData.error?.message || "图片上传失败，请重试";
          throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.data.url;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "图片上传失败，请重试";
        console.error("Image upload error:", error);
        setError(errorMessage);
        throw error;
      }
    },
    []
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure StarterKit extensions
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      Placeholder.configure({
        placeholder: placeholder,
      }),
    ],
    content: initialContent || "",
    editable: !readOnly,
    immediatelyRender: false, // Prevent SSR hydration mismatches
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
      // Sync markdown content when in visual mode
      if (!isMarkdownModeRef.current) {
        const markdown = htmlToMarkdown(html);
        setMarkdownContent(markdown);
      }
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4",
        "data-placeholder": placeholder,
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files) {
          const files = Array.from(event.dataTransfer.files);
          const imageFiles = files.filter((file) =>
            file.type.startsWith("image/")
          );

          if (imageFiles.length > 0) {
            event.preventDefault();

            // Upload first image
            handleImageUpload(imageFiles[0])
              .then((url) => {
                const { schema } = view.state;
                const coordinates = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });

                if (coordinates) {
                  const node = schema.nodes.image.create({
                    src: url,
                  });
                  const transaction = view.state.tr.insert(
                    coordinates.pos,
                    node
                  );
                  view.dispatch(transaction);
                }
              })
              .catch((error) => {
                console.error("Failed to upload image:", error);
                // Error is already handled in handleImageUpload and set in error state
              });

            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.startsWith("image/"));

        if (imageItem) {
          event.preventDefault();
          const file = imageItem.getAsFile();

          if (file) {
            handleImageUpload(file)
              .then((url) => {
                const { schema } = view.state;
                const node = schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              })
              .catch((error) => {
                console.error("Failed to upload pasted image:", error);
                // Error is already handled in handleImageUpload and set in error state
              });

            return true;
          }
        }
        return false;
      },
    },
  });

  // Update editor content when initialContent changes
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const currentContent = editor.getHTML();
      if (currentContent !== initialContent) {
        editor.commands.setContent(initialContent);
        // Sync markdown content
        if (isMarkdownMode) {
          setMarkdownContent(htmlToMarkdown(initialContent));
        }
      }
    }
  }, [editor, initialContent, isMarkdownMode]);

  // Initialize markdown content from initial HTML
  useEffect(() => {
    if (editor && initialContent) {
      const markdown = htmlToMarkdown(initialContent);
      setMarkdownContent(markdown);
    }
  }, [editor, initialContent]);

  /**
   * Handles switching between visual and markdown mode.
   */
  const handleModeSwitch = () => {
    if (!editor) return;

    if (isMarkdownMode) {
      // Switching from Markdown to Visual: convert Markdown to HTML
      const html = markdownToHtml(markdownContent);
      editor.commands.setContent(html);
      onChange?.(html);
    } else {
      // Switching from Visual to Markdown: convert HTML to Markdown
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      setMarkdownContent(markdown);
    }
    setIsMarkdownMode(!isMarkdownMode);
  };

  /**
   * Handles Markdown content change in source mode.
   */
  const handleMarkdownChange = (value: string) => {
    setMarkdownContent(value);
    // Convert to HTML and notify parent
    const html = markdownToHtml(value);
    onChange?.(html);
  };

  /**
   * Exports current content as Markdown file.
   */
  const handleExportMarkdown = () => {
    if (!editor) return;

    const markdown = isMarkdownMode 
      ? markdownContent 
      : htmlToMarkdown(editor.getHTML());

    // Create download link
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `article-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle save callback (can be triggered by parent component)
  useEffect(() => {
    if (editor && onSave) {
      // Parent component can call editor.commands to trigger save
      // This is a placeholder for save functionality
    }
  }, [editor, onSave]);

  if (!editor) {
    return (
      <div className="border border-slate-300 rounded-lg p-4 min-h-[300px] flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <p className="text-slate-500">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 text-red-800 px-4 py-3 rounded-t-lg">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 font-bold"
              aria-label="关闭错误消息"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {!readOnly && (
        <div className="border-b border-slate-300 p-2 flex flex-wrap gap-2 items-center bg-white/50">
          {/* Markdown Mode Toggle */}
          <button
            type="button"
            onClick={handleModeSwitch}
            className={`px-3 py-1 rounded text-sm transition-all ${
              isMarkdownMode
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
            title={isMarkdownMode ? "切换到可视化编辑" : "切换到 Markdown 源码"}
          >
            {isMarkdownMode ? "可视化" : "Markdown"}
          </button>

          {/* Preview Toggle (only in visual mode) */}
          {!isMarkdownMode && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 py-1 rounded text-sm transition-all ${
                showPreview
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
              title="切换预览"
            >
              {showPreview ? "隐藏预览" : "显示预览"}
            </button>
          )}

          {/* Export Markdown */}
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="px-3 py-1 rounded text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            title="导出为 Markdown 文件"
          >
            导出 MD
          </button>

          <div className="flex-1" /> {/* Spacer */}

          {/* Formatting Buttons (only in visual mode) */}
          {!isMarkdownMode && (
            <>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive("bold")
                ? "bg-blue-500 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            }`}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive("italic")
                ? "bg-blue-500 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            }`}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`px-3 py-1 rounded ${
              editor.isActive("heading", { level: 1 })
                ? "bg-blue-500 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            }`}
          >
            H1
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`px-3 py-1 rounded ${
              editor.isActive("heading", { level: 2 })
                ? "bg-blue-500 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            }`}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`px-3 py-1 rounded ${
              editor.isActive("heading", { level: 3 })
                ? "bg-blue-500 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            }`}
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive("bulletList")
                ? "bg-blue-500 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            }`}
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive("orderedList")
                ? "bg-blue-500 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            }`}
          >
            1. List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive("blockquote")
                ? "bg-blue-500 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            }`}
          >
            "
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive("codeBlock")
                ? "bg-blue-500 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            }`}
          >
            {"</>"}
          </button>
          <button
            type="button"
            onClick={() => {
              const currentUrl = editor.getAttributes("link").href || "";
              const url = prompt("输入链接 URL:", currentUrl);
              if (url !== null) {
                // Basic URL validation
                if (url.trim() === "") {
                  // Remove link if empty
                  editor.chain().focus().unsetLink().run();
                } else {
                  // Validate URL format
                  try {
                    new URL(url);
                    editor.chain().focus().setLink({ href: url }).run();
                  } catch {
                    // Invalid URL, show error
                    setError("无效的 URL 格式，请检查后重试");
                    setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
                  }
                }
              }
            }}
            className={`px-3 py-1 rounded ${
              editor.isActive("link")
                ? "bg-blue-500 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            }`}
          >
            Link
          </button>
            </>
          )}
        </div>
      )}

      {/* Editor Content Area */}
      <div className={showPreview && !isMarkdownMode ? "grid grid-cols-2 gap-0" : ""}>
        {/* Visual Editor or Markdown Source */}
        {isMarkdownMode ? (
          <div className="p-4">
            <textarea
              value={markdownContent}
              onChange={(e) => handleMarkdownChange(e.target.value)}
              placeholder={placeholder}
              className="w-full h-[500px] p-4 border border-slate-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white/80 backdrop-blur-sm transition-all"
              spellCheck={false}
            />
            <p className="mt-2 text-xs text-slate-500">
              提示：在此处直接编辑 Markdown 源码，切换回可视化模式查看效果
            </p>
          </div>
        ) : (
          <div className={showPreview ? "border-r border-slate-300" : ""}>
            <EditorContent editor={editor} />
          </div>
        )}

        {/* Preview Panel (only in visual mode with preview enabled) */}
        {showPreview && !isMarkdownMode && editor && (
          <div className="p-4 overflow-auto max-h-[600px] bg-slate-50/80 backdrop-blur-sm">
            <div className="mb-3 text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2">
              预览
            </div>
            <div
              className="prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none"
              dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

