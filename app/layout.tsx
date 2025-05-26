import "./globals.css";
import React from 'react';
import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Analytics />
      <body>
        {children}
      </body>
    </html>
  );
}
