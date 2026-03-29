"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

interface SecureImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function SecureImage({ src, alt, className }: SecureImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);

        console.log("SecureImage - 이미지 로드 시도:", src);
        console.log("SecureImage - Access token:", accessToken ? "있음" : "없음");

        if (!accessToken) {
          throw new Error("Access token이 없습니다. 로그인이 필요합니다.");
        }

        const response = await fetch(src, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        console.log("SecureImage - 응답 상태:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("SecureImage - 응답 오류:", errorText);
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
      } catch (err) {
        console.error("Failed to load image:", src, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup function
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src, accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground">
        <p className="text-sm">이미지를 불러올 수 없습니다</p>
      </div>
    );
  }

  return <img src={imageSrc || ""} alt={alt} className={className} />;
}