import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Speech To Text App",
  description: "Speech To Text Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}