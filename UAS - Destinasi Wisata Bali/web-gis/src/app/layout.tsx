import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIPETA BALI — Web GIS SPK Potensi Destinasi Wisata (AHP-TOPSIS)",
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
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
