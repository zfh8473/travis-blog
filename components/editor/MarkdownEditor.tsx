"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { markdownToHtml, htmlToMarkdown } from "@/lib/utils/markdown-converter";

// 动态导入 MDEditor 以避免 SSR 问题
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="border border-slate-300 rounded-lg p-4 min-h-[500px] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <p className="text-slate-500">加载编辑器...</p>
    </div>
  ),
});

/**
 * Props for the MarkdownEditor component.
 * 
 * @interface MarkdownEditorProps
 */
export interface MarkdownEditorProps {
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
 * Markdown editor component using @uiw/react-md-editor.
 * 
 * Provides a native Markdown editing experience with live preview,
 * syntax highlighting, and toolbar support.
 * 
 * @component
 * @param props - Component props
 * @param props.initialContent - Initial HTML content (for edit mode, will be converted to Markdown)
 * @param props.onChange - Callback when content changes (returns HTML)
 * @param props.placeholder - Placeholder text
 * @param props.readOnly - Whether editor is read-only
 * 
 * @example
 * ```tsx
 * <MarkdownEditor
 *   initialContent="<h1>Title</h1><p>Content</p>"
 *   onChange={(html) => console.log(html)}
 *   placeholder="开始写作..."
 * />
 * ```
 */
export default function MarkdownEditor({
  initialContent,
  onChange,
  placeholder = "开始写作...",
  readOnly = false,
}: MarkdownEditorProps) {
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Handles image upload from drag-and-drop or paste.
   * 
   * @param file - Image file to upload
   * @returns Promise resolving to image URL
   */
  const handleImageUpload = useCallback(
    async (file: File): Promise<string> => {
      try {
        setError(null);
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
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

  // Initialize markdown content from initial HTML
  useEffect(() => {
    if (initialContent !== undefined && !isInitialized) {
      try {
        // Convert HTML to Markdown
        const markdownContent = htmlToMarkdown(initialContent || "");
        setMarkdown(markdownContent);
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing markdown:", error);
        setError("初始化编辑器内容失败");
      }
    }
  }, [initialContent, isInitialized]);

  // Handle markdown content change
  const handleChange = useCallback(
    (value?: string) => {
      const markdownContent = value || "";
      setMarkdown(markdownContent);

      // Convert Markdown to HTML and notify parent
      try {
        const html = markdownToHtml(markdownContent);
        onChange?.(html);
      } catch (error) {
        console.error("Error converting markdown to HTML:", error);
        setError("内容转换失败");
      }
    },
    [onChange]
  );

  return (
    <div className="border border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm overflow-hidden">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 text-red-800 px-4 py-3">
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

      {/* Markdown Editor */}
      <div 
        data-color-mode="light"
        onDragOver={(event) => {
          // Prevent default browser behavior (opening file in new tab)
          event.preventDefault();
          event.stopPropagation();
        }}
        onDrop={async (event) => {
          event.preventDefault();
          event.stopPropagation();
          const files = Array.from(event.dataTransfer?.files || []);
          const imageFiles = files.filter((file) =>
            file.type.startsWith("image/")
          );

          if (imageFiles.length > 0) {
            try {
              const url = await handleImageUpload(imageFiles[0]);
              const imageMarkdown = `![${imageFiles[0].name}](${url})`;
              const currentValue = markdown || "";
              const newValue = `${currentValue}\n\n${imageMarkdown}\n\n`;
              handleChange(newValue);
            } catch (error) {
              console.error("Failed to upload dropped image:", error);
            }
          }
        }}
        onPaste={async (event) => {
          const items = Array.from(event.clipboardData?.items || []);
          const imageItem = items.find((item) =>
            item.type.startsWith("image/")
          );

          if (imageItem) {
            event.preventDefault();
            event.stopPropagation();
            const file = imageItem.getAsFile();

            if (file) {
              try {
                const url = await handleImageUpload(file);
                const imageMarkdown = `![${file.name}](${url})`;
                const currentValue = markdown || "";
                const newValue = `${currentValue}\n\n${imageMarkdown}\n\n`;
                handleChange(newValue);
              } catch (error) {
                console.error("Failed to upload pasted image:", error);
              }
            }
          }
        }}
      >
        <MDEditor
          value={markdown}
          onChange={handleChange}
          preview="edit"
          hideToolbar={readOnly}
          visibleDragbar={false}
          textareaProps={{
            placeholder: placeholder,
            disabled: readOnly,
          }}
          height={500}
        />
      </div>
    </div>
  );
}

