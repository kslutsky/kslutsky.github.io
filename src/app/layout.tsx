import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "katex/dist/katex.min.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://kslutsky.com"),
  title: "Konstantin Slutsky",
  description: "Assistant Professor at Iowa State University. Research in descriptive set theory, ergodic theory, and autonomous systems.",
  openGraph: {
    title: "Konstantin Slutsky",
    description: "Assistant Professor at Iowa State University. Research in descriptive set theory, ergodic theory, and autonomous systems.",
    url: "https://kslutsky.com",
    siteName: "Konstantin Slutsky",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}})()`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
