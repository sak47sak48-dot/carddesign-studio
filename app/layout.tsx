import type { Metadata } from "next";
import "./globals.css";
import SiteChrome from "../components/SiteChrome";

export const metadata: Metadata = {
  title: {
    default: "carddesign.studio",
    template: "%s | carddesign.studio",
  },

  description:
    "Premium wedding invitation cards, customization and printing for Indian celebrations.",

  icons: {
    icon: [
      {
        url: "/carddesign-icon.png",
        type: "image/png",
      },
    ],
    shortcut: "/carddesign-icon.png",
    apple: "/carddesign-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}