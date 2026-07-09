import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ToastProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { GlobalPortalProvider } from "@/components/GlobalPortalContainer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexivo",
  description: "متجر حسابات الألعاب وخدمات الشحن",
  icons: [{ rel: "icon", url: "https://aisndkhxmhgtnfu9.public.blob.vercel-storage.com/WhatsApp%20Image%202026-07-04%20at%2011.25.00%20AM.jpeg" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GlobalPortalProvider>
          <div className="flex min-h-screen flex-col">
            <Header />

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-4 pt-6 md:pb-8 md:pt-10"><ToastProvider><PageTransition>{children}</PageTransition></ToastProvider></main>

            <Footer />
          </div>
        </GlobalPortalProvider>
      </body>
    </html>
  );
}
