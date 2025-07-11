"use client";

import type React from "react";
import { useState, useRef } from "react";
import Image from "next/image";
// import addGroupComment from "@/api/groups/addGroupComment";
import { useGlobalAPIHelper } from "@/helpers/GlobalAPIHelper";
import { uploadFile } from "@/helpers/uploadFile";
import Popup from "@/components/popup";
// import { group } from "console";

interface GroupCommentFormProps {
  postId: number;
  onCommentAdded: () => void;
  disabled?: boolean;
  groupId: number;
}

export default function GroupCommentForm({
  postId,
  onCommentAdded,
  disabled,
  groupId,
}: GroupCommentFormProps) {
  const [newComment, setNewComment] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [popup, setPopup] = useState<{
    message: string;
    status: "success" | "failure";
  } | null>(null);
  const { apiCall } = useGlobalAPIHelper();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setPopup({ message: "Please select an image file", status: "failure" });

        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setPopup({
          message: "Image size must be less than 10MB",
          status: "failure",
        });

        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newComment.trim() === "" && !selectedImage) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      let filename = "";

      // Upload image if selected using your existing uploadFile function
      if (selectedImage) {
        const formData = new FormData();
        formData.append("file", selectedImage);

        // Use your existing uploadFile function
        filename = await uploadFile(formData, "group-post-comments");
      }

      // Add comment
      // const result = await addGroupComment(postId, newComment.trim(), filename);
      const result = await apiCall(
        {
          type: "add-group-comment",
          data: {
            PostId: postId,
            Text: newComment.trim(),
            Image: filename,
            groupId,
          },
        },
        "POST",
        "addGroupComment"
      );

      if (result.error) {
        // setPopup({
        //   message: `Failed to add comment: ${result.error}`,
        //   status: "failure",
        // });

        return;
      }

      // Reset form
      setNewComment("");
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Notify parent component
      onCommentAdded();
    } catch (error) {
      console.error("Error adding group comment:", error);
      // setPopup({ message: `Failed to add comment`, status: "failure" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {imagePreview && (
        <div className="image-preview-container">
          <div className="image-preview">
            <Image
              src={imagePreview || "/placeholder.svg"}
              alt="Preview"
              className="preview-image"
              width={40}
              height={40}
            />
            <button
              type="button"
              className="remove-image-btn"
              onClick={removeImage}
              aria-label="Remove image"
            >
              <Image src="/icons/x.svg" alt="remove" width={16} height={16} />
            </button>
          </div>
        </div>
      )}

      <div className="comment-input-container">
        <input
          type="text"
          className="comment-input"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={disabled || isSubmitting}
        />

        <div className="comment-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: "none" }}
            disabled={disabled || isSubmitting}
          />

          <button
            type="button"
            className="image-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isSubmitting}
            aria-label="Add image"
          >
            <Image
              src="/icons/attachment.svg"
              alt="camera"
              width={20}
              height={20}
            />
          </button>

          <button
            type="submit"
            className="comment-submit-btn"
            disabled={
              disabled ||
              isSubmitting ||
              (newComment.trim() === "" && !selectedImage)
            }
          >
            <Image src="/icons/send.svg" alt="send" width={16} height={16} />
            <span style={{ marginLeft: "5px" }}>
              {isSubmitting ? "Sending..." : "Send"}
            </span>
          </button>
        </div>
      </div>
      {popup && (
        <Popup
          message={popup.message}
          status={popup.status}
          onClose={() => setPopup(null)}
        />
      )}
    </form>
  );
}
