"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
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
        avatar: "File must be an image (jpg, jpeg, png, gif, or webp)",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({
        avatar: "File size must be less than 5MB",
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
          avatar: result.error?.message || "Failed to upload avatar",
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

      setSuccessMessage("Avatar uploaded successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setErrors({
        avatar: "Failed to upload avatar. Please try again.",
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
            general: result.error?.message || "Failed to update profile",
          });
        }
        return;
      }

      // Update session to reflect changes
      await updateSession();

      // Refresh page to show updated data
      router.refresh();

      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrors({
        general: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* General Error Message */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {errors.general}
        </div>
      )}

      {/* Email (Read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={initialData?.email || ""}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Email cannot be changed
        </p>
      </div>

      {/* Avatar Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Avatar
        </label>
        <div className="flex items-center space-x-4">
          {avatarPreview ? (
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300">
              <Image
                src={avatarPreview}
                alt="Avatar preview"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-2xl">
                {initialData?.name?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
          )}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {errors.avatar && (
              <p className="mt-1 text-sm text-red-600">{errors.avatar}</p>
            )}
            {selectedFile && (
              <button
                type="button"
                onClick={handleAvatarUpload}
                disabled={isUploadingAvatar}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isUploadingAvatar ? "Uploading..." : "Upload Avatar"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          maxLength={100}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {formData.name.length}/100 characters
        </p>
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Bio
        </label>
        <textarea
          id="bio"
          value={formData.bio}
          onChange={(e) =>
            setFormData({ ...formData, bio: e.target.value })
          }
          maxLength={500}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tell us about yourself..."
        />
        {errors.bio && (
          <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {formData.bio.length}/500 characters
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || isUploadingAvatar}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

