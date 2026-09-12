import type { Metadata } from "next";
import { Barlow, DM_Sans } from "next/font/google";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "LifeQuest — Your real life is the game",
    template: "%s | LifeQuest",
  },
  description:
    "Turn your real-world responsibilities into an RPG-style progression system. Complete quests, earn XP and Gold, level up your life.",
};

const barlow = Barlow({
  variable: "--font-barlow",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${barlow.variable} ${dmSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
