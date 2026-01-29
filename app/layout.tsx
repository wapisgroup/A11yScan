import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StrictMode } from "react";
import { FirebaseProvider } from "@/utils/firebase";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ablelytics - Website accessibility tool",
  description: "Ablelytics - Website accessibility tool",
};


import { ConfirmProvider, WindowProvider } from "@/components/providers/window-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StrictMode>
          <FirebaseProvider><WindowProvider>{children}</WindowProvider></FirebaseProvider>
        </StrictMode>
      </body>
    </html>
  );
}
