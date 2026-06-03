import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Continue? — approval reflex test",
  description: "Can you tell the safe commands from the traps? Approve or deny AI agent bash commands before the timer runs out.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
