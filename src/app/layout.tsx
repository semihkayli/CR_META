import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Clash Royale Meta Deck Finder",
  description: "Akıllı simülasyon filtresiyle kişisel profilinize en uygun Clash Royale meta destelerini bulun.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        {/* Temayı localStorage'dan okuyup anında uygulamak için inline script (Flash of Unstyled Content önlemek için) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
