import "./globals.css";
import { AuthBootstrap } from "@/components/auth/AuthBootstrap";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <AuthBootstrap />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
