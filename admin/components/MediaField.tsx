"use client";
import { useState } from "react";
import { call } from "../lib/api";
export default function MediaField({
  url,
  alt,
  onChange,
}: {
  url: string;
  alt: string;
  onChange: (url: string, alt: string) => void;
}) {
  const [uploading, setUploading] = useState(false),
    [error, setError] = useState("");
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 7 * 1024 * 1024) {
      setError("Image must be under 7 MB");
      return;
    }
    setUploading(true);
    setError("");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const d = await call("/media/upload", {
          method: "POST",
          body: JSON.stringify({
            dataUri: reader.result,
            folder: "kraviona/posts",
          }),
        });
        onChange(d.url, alt);
      } catch (e: any) {
        setError(`${e.message}. You can still paste an image URL.`);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }
  return (
    <div className="media-field">
      <div className="media-preview">
        {url ? (
          <img src={url} alt={alt || "Featured image preview"} />
        ) : (
          <div>
            <b>No image selected</b>
            <span>Recommended: 1600 × 900, landscape</span>
          </div>
        )}
      </div>
      <div className="media-controls">
        <label>
          Featured image URL
          <input
            value={url}
            onChange={(e) => onChange(e.target.value, alt)}
            placeholder="https://…"
          />
        </label>
        <label>
          Accessible alt text
          <input
            value={alt}
            onChange={(e) => onChange(url, e.target.value)}
            placeholder="Describe what the image shows"
          />
        </label>
        <label className="upload-button">
          {uploading ? "Uploading…" : "Upload to Cloudinary"}
          <input
            hidden
            disabled={uploading}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </label>
        {error && <p className="field-error">{error}</p>}
      </div>
    </div>
  );
}
