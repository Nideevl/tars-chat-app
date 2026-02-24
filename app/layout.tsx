import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { BlobBackground } from "@/components/BlobBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "TarsChat",
  description: "Real-time messaging for teams",
};

const clerkDarkAppearance = {
  variables: {
    colorBackground: "#0d0d0d",
    colorInputBackground: "#111111",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "#888888",
    colorPrimary: "#8b5cf6",
    colorDanger: "#ff6b6b",
    colorNeutral: "#333333",
    borderRadius: "0.75rem",
    fontFamily: "inherit",
    fontSize: "0.875rem",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
        <head>
        <link rel="icon" href="/favicon.png" />
      </head>
      <body className="h-full antialiased">
        <ClerkProvider appearance={clerkDarkAppearance}>
          <ConvexClientProvider>
            <ThemeProvider>
              <BlobBackground />
              {children}
            </ThemeProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}