import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Liam Krivacic | Portfolio",
  description:
    "Electrical Engineering and Computer Science portfolio exploring RF systems, robotics, infrastructure, and software projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
