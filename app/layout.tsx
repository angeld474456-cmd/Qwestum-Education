import type { Metadata } from "next";
import "./globals.css";

import { Geist } from "next/font/google";

import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Questum Education",
  description: "Платформа образовательных квестов",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={cn("font-sans", geist.variable)}
    >
      <body className="min-h-screen bg-[#070B14] text-white antialiased">

        <TooltipProvider
          delayDuration={150}
          skipDelayDuration={300}
        >
          {children}

          <Toaster
            position="top-right"
            richColors
            closeButton
            expand
          />
        </TooltipProvider>

      </body>
    </html>
  );
}