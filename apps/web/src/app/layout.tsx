import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexus - Project Management Made Simple",
  description: "Streamline your workflow, collaborate seamlessly, and deliver projects on time. The all-in-one platform that grows with your team.",
  keywords: ["project management", "team collaboration", "workflow", "productivity", "task management"],
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
    url: 'https://nexus.com',
    title: 'Nexus - Project Management Made Simple',
    description: 'Streamline your workflow, collaborate seamlessly, and deliver projects on time.',
    siteName: 'Nexus',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexus - Project Management Made Simple',
    description: 'Streamline your workflow, collaborate seamlessly, and deliver projects on time.',
    creator: '@nexusapp',
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
