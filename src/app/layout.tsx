import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Helm · Founder morning brief",
    template: "%s · Helm",
  },
  description: "Evidence-backed morning actions for solo B2B SaaS founders.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0c1110",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
