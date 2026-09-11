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
  title: "Re_action | لوحة إدارة أكاديمية الكاراتيه",
  description: "نظام رقمي متقدم لإدارة حضور واشتراكات لاعبي أكاديمية الكاراتيه",
  icons: {
    icon: "/favicon.ico",
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
      className={`${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-cairo bg-[#f8fafc] text-slate-900 selection:bg-red-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

