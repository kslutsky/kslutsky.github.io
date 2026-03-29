import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

// Anti-flash script: reads theme preference from localStorage before first paint.
// This is a static string (not user input), so dangerouslySetInnerHTML is safe here.
const themeScript = `(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}})();`;

export const metadata: Metadata = {
  title: "Konstantin Slutsky",
  description: "Academic homepage of Konstantin Slutsky",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
