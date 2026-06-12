import type { Metadata, Viewport } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";

import "katex/dist/katex.min.css";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://liam-krivacic.vercel.app"),
  title: {
    default: "Liam Krivacic | EE + CS Portfolio",
    template: "%s | Liam Krivacic",
  },
  description:
    "Electrical Engineering and Computer Science portfolio: RF systems, robotics, infrastructure, and software.",
  openGraph: { type: "website", siteName: "Liam Krivacic", locale: "en_AU" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#030405" };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Liam Krivacic",
  affiliation: { "@type": "Organization", name: "UNSW Sydney" },
  sameAs: [
    "https://www.linkedin.com/in/liam-krivacic-475157358/",
    "https://github.com/liamkrivacic",
  ],
  email: "mailto:liam.krivacic@gmail.com",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="grain-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
