import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claude Chat Archive Viewer",
  description: "Local-first AI conversation archive browser"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}

