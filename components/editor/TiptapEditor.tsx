"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback, useState } from "react";

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
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
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
      }
    }
  }, [editor, initialContent]);

  // Handle save callback (can be triggered by parent component)
  useEffect(() => {
    if (editor && onSave) {
      // Parent component can call editor.commands to trigger save
      // This is a placeholder for save functionality
    }
  }, [editor, onSave]);

  if (!editor) {
    return (
      <div className="border border-gray-300 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg">
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
        <div className="border-b border-gray-300 p-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive("bold")
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
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
                : "bg-gray-100 hover:bg-gray-200"
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
                : "bg-gray-100 hover:bg-gray-200"
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
                : "bg-gray-100 hover:bg-gray-200"
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
                : "bg-gray-100 hover:bg-gray-200"
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
                : "bg-gray-100 hover:bg-gray-200"
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
                : "bg-gray-100 hover:bg-gray-200"
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
                : "bg-gray-100 hover:bg-gray-200"
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
                : "bg-gray-100 hover:bg-gray-200"
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
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Link
          </button>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}

