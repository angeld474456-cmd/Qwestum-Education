import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";

const geist = localFont({
  src: "./fonts/GeistVF.woff2",
  display: "swap",
  variable: "--font-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Qwestum-Education - интерактивные учебные квесты",
  description:
    "Интерактивные учебные квесты для преподавателей и учеников: создавайте, проходите и делитесь заданиями.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );
}
