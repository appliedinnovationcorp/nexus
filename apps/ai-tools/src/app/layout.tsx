import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexus AI Tools - Comprehensive AI-Powered SaaS Platform",
  description: "Access a suite of AI-powered tools for content generation, data analysis, automation, and more. Built for businesses and developers.",
  keywords: [
    "AI tools",
    "artificial intelligence",
    "SaaS platform",
    "content generation",
    "data analysis",
    "automation",
    "machine learning",
    "business intelligence"
  ],
  authors: [{ name: "Nexus Team" }],
  creator: "Nexus",
  publisher: "Nexus",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ai-tools.nexus.com',
    title: 'Nexus AI Tools - AI-Powered SaaS Platform',
    description: 'Access a comprehensive suite of AI-powered tools for your business needs.',
    siteName: 'Nexus AI Tools',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexus AI Tools - AI-Powered SaaS Platform',
    description: 'Access a comprehensive suite of AI-powered tools for your business needs.',
    creator: '@nexusai',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
