import { Cairo } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata = {
  title: "CoatchMaster | لوحة إدارة أكاديمية الكاراتيه",
  description: "نظام CoatchMaster الرقمي المتقدم لإدارة حضور واشتراكات لاعبي أكاديمية الكاراتيه",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CoatchMaster",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${cairo.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col font-cairo bg-[#f8fafc] text-slate-900 selection:bg-red-500 selection:text-white overflow-x-hidden w-full max-w-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

