import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecruitAI — Plain-English Candidate Search",
  description: "Find candidates in plain English",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}