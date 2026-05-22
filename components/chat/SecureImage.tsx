"use client";

import { useState, useEffect, useRef } from "react";
import { authAPI } from "@/lib/api/auth";
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
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const revokeObjectUrl = () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };

    const fetchImage = async (token: string) => {
      return fetch(src, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    };

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        revokeObjectUrl();

        console.log("SecureImage - 이미지 로드 시도:", src);
        const currentToken = useAuthStore.getState().accessToken;
        console.log("SecureImage - Access token:", currentToken ? "있음" : "없음");

        let token = currentToken;

        if (!token) {
          token = await authAPI.refreshAccessToken();
        }

        if (!token) {
          throw new Error("Access token이 없습니다. 로그인이 필요합니다.");
        }

        let response = await fetchImage(token);

        if (response.status === 401) {
          const refreshedToken = await authAPI.refreshAccessToken();
          if (refreshedToken) {
            response = await fetchImage(refreshedToken);
          }
        }

        console.log("SecureImage - 응답 상태:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("SecureImage - 응답 오류:", errorText);
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setImageSrc(objectUrl);
      } catch (err) {
        console.error("Failed to load image:", src, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    return revokeObjectUrl;
  }, [src]);

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

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={imageSrc || ""} alt={alt} className={className} />;
}
