"use client";

import { useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

/**
 * Profile form component.
 * 
 * Client component for updating user profile information.
 * Handles form submission, file upload, and UI updates.
 * 
 * @param initialData - Initial profile data from server
 */
export function ProfileForm({
  initialData,
}: {
  initialData: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    role: string;
  } | null;
}) {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    bio: initialData?.bio || "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialData?.image ? `/${initialData.image}` : null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    bio?: string;
    avatar?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Handle file selection for avatar upload.
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setErrors({
        avatar: "文件必须是图片格式（jpg、jpeg、png、gif 或 webp）",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({
        avatar: "文件大小必须小于 5MB",
      });
      return;
    }

    // Clear errors
    setErrors({});

    // Set selected file
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handle avatar upload.
   */
  const handleAvatarUpload = async () => {
    if (!selectedFile) return;

    setIsUploadingAvatar(true);
    setErrors({});
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors({
          avatar: result.error?.message || "头像上传失败",
        });
        return;
      }

      // Update avatar preview with new URL
      if (result.data?.url) {
        setAvatarPreview(result.data.url);
      }

      // Update session to reflect new avatar
      await updateSession();

      // Clear selected file
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSuccessMessage("头像上传成功！");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setErrors({
        avatar: "头像上传失败，请重试。",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  /**
   * Handle form submission.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccessMessage(null);

    try {
      // First, upload avatar if a new file is selected
      if (selectedFile) {
        await handleAvatarUpload();
      }

      // Then update profile
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name || null,
          bio: formData.bio || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.details) {
          // Handle validation errors
          const validationErrors: Record<string, string> = {};
          result.error.details.forEach((issue: any) => {
            if (issue.path) {
              validationErrors[issue.path[0]] = issue.message;
            }
          });
          setErrors(validationErrors);
        } else {
          setErrors({
            general: result.error?.message || "更新资料失败",
          });
        }
        return;
      }

      // Update session to reflect changes
      await updateSession();

      // Refresh page to show updated data
      router.refresh();

      setSuccessMessage("资料更新成功！");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrors({
        general: "更新资料失败，请重试。",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* General Error Message */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {errors.general}
        </div>
      )}

      {/* Avatar Card */}
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6 shadow-sm article-card-hover">
        <label className="block text-sm font-semibold text-slate-600 mb-4">
          头像
        </label>
        <div className="flex items-center space-x-4">
          {avatarPreview ? (
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-slate-300 shadow-sm">
              <Image
                src={avatarPreview}
                alt="头像预览"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center border-2 border-slate-300 shadow-sm">
              <span className="text-slate-400 text-xs text-center px-2">
                暂无头像
              </span>
            </div>
          )}
          <div className="flex-1">
            <label className="block cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-all btn-hover">
                  选择文件
                </span>
                <span className="text-sm text-slate-500">
                  {selectedFile ? selectedFile.name : "未选择文件"}
                </span>
              </div>
            </label>
            {errors.avatar && (
              <p className="mt-1 text-sm text-red-600">{errors.avatar}</p>
            )}
            {selectedFile && (
              <button
                type="button"
                onClick={handleAvatarUpload}
                disabled={isUploadingAvatar}
                className="mt-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:bg-slate-400 disabled:text-white disabled:cursor-not-allowed btn-hover transition-all"
              >
                {isUploadingAvatar ? "上传中..." : "上传头像"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Basic Info Card */}
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6 shadow-sm article-card-hover">
        <div className="space-y-6">
          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              邮箱
            </label>
            <input
              type="email"
              value={initialData?.email || ""}
              disabled
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 transition-all"
            />
            <p className="mt-1 text-sm text-slate-500">
              邮箱无法修改
            </p>
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-slate-600 mb-2"
            >
              姓名
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              maxLength={100}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
            <p className="mt-1 text-sm text-slate-500">
              {formData.name.length}/100 字符
            </p>
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-semibold text-slate-600 mb-2"
            >
              简介
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              maxLength={500}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="介绍一下你自己..."
            />
            {errors.bio && (
              <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
            )}
            <p className="mt-1 text-sm text-slate-500">
              {formData.bio.length}/500 字符
            </p>
          </div>
        </div>
      </div>

      {/* Actions Card */}
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6 shadow-sm article-card-hover">
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={async () => {
              await signOut({ callbackUrl: "/" });
            }}
            className="px-6 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 btn-hover transition-all"
          >
            退出登录
          </button>
          <button
            type="submit"
            disabled={isLoading || isUploadingAvatar}
            className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed btn-hover transition-all"
          >
            {isLoading ? "保存中..." : "保存更改"}
          </button>
        </div>
      </div>
    </form>
  );
}

