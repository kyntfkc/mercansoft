import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "../theme/ThemeProvider";
import { Toaster } from 'react-hot-toast';

// Outfit font
const outfit = Outfit({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: "--font-outfit",
  display: 'swap',
});

// Inter font
const inter = Inter({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "indigo | Taş Hesap",
  description: "Takı modelleri için profesyonel taş ağırlığı hesaplama sistemi",
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/logo-indigo.png', type: 'image/png' },
    ],
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${outfit.variable} ${inter.variable}`}>
      <head>
        <meta name="theme-color" content="#225C73" />
        <meta name="apple-mobile-web-app-status-bar-style" content="#225C73" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster position="top-right" toastOptions={{
            style: {
              background: '#225C73',
              color: 'white',
              padding: '16px',
              borderRadius: '8px',
            },
            success: {
              duration: 3000,
            },
            error: {
              duration: 4000,
            }
          }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
