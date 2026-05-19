import type { ReactNode } from "react";

import "./globals.css";

export const metadata = {
  title: "ItemFlow Web",
  description: "Frontend application for ItemFlow."
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}

