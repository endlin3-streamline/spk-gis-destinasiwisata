import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
// @ts-ignore Next.js handles global CSS imports during compilation.
import "./globals.css";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SIPETA | Dashboard",
  description:
    "Sistem Pendukung Keputusan berbasis Sistem Informasi Geografis (Web GIS) untuk penilaian potensi destinasi wisata di Provinsi Bali menggunakan metode AHP-TOPSIS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${font.className} min-h-screen antialiased bg-slate-50 text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
