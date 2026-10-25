import type { Metadata } from "next";
import { Archivo, Jacquard_24, Martian_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const jacquard24 = Jacquard_24({
  variable: "--font-jacquard",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const martianMono = Martian_Mono({
  variable: "--font-martian",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GestureDeck — SonicHUD Hand Controller",
  description:
    "Zero-cloud local vision media controller with MediaPipe tracking, safety clutch gating, procedural audio feedback, and custom gesture ML.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${jacquard24.variable} ${martianMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[var(--paper)] text-[var(--ink)]">
        {children}
      </body>
    </html>
  );
}
