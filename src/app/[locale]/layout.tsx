import type { Metadata } from "next";
import { Roboto, Geist_Mono } from "next/font/google";
import "../globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import ReduxWrapper from "@/components/wrapper/ReduxWrapper";
import { Toaster } from "sonner";

const roboto = Roboto({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "y-pos",
  description: "y-pos is a pos management system for restaurants.",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  // Providing all messages to the client
  // side is the easiest way to get started

  return (
    <html
      lang={locale}
      className={`${roboto.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${roboto.className} min-h-screen flex flex-col bg-background text-foreground`}>
        <ReduxWrapper>
          <NextIntlClientProvider messages={messages}>
            <TooltipProvider>
              {children}
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </NextIntlClientProvider>
        </ReduxWrapper>
      </body>
    </html>
  );
}
