import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/Providers";
import { SessionProvider } from "next-auth/react";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CU Student Council Portal",
  description: "Covenant University Student Council Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          bricolage.variable,
          instrumentSans.variable,
          "font-sans antialiased",
        )}
      >
        <Providers>
          <SessionProvider>{children}</SessionProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
