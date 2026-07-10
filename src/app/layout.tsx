import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASP — Freelancer & Indie Creator Agent Service Provider",
  description:
    "AI-powered co-pilot connecting freelancers with clients through verifiable profiles, multi-agent orchestration, and trustless stablecoin escrow on X Layer. Built for the OKX.AI marketplace.",
  keywords: [
    "freelancer",
    "agent service provider",
    "OKX.AI",
    "X Layer",
    "blockchain",
    "AI agents",
    "crypto escrow",
    "verifiable reputation",
  ],
  openGraph: {
    title: "ASP — Freelancer & Indie Creator Agent Service Provider",
    description:
      "Next-generation AI co-pilot for freelancers and clients on OKX.AI. Verifiable profiles, smart escrow, and multi-agent orchestration.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ASP — Freelancer & Indie Creator Agent Service Provider",
    description:
      "AI-powered freelancer marketplace on OKX.AI with verifiable reputation and trustless crypto escrow.",
  },
};

import { Providers } from "@/components/providers";
import Header from "@/components/Header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Providers>
          <Header />
          <main style={{ minHeight: 'calc(100vh - 70px)' }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
