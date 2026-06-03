import type { Metadata } from "next";
import "../styles/globals.css";
import "../styles/theme.css";

export const metadata: Metadata = {
  title: "Clash Royale Meta Deck Matcher & Finder",
  description: "Sahip olduğunuz kart seviyeleri, evrimler ve kahramanlara göre Clash Royale metasındaki en iyi desteleri bulun ve akıllı simülasyon filtresiyle pro destelerini keşfedin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <div className="bg-glow-orb bg-glow-orb-elixir"></div>
        <div className="bg-glow-orb bg-glow-orb-gold"></div>
        {children}
      </body>
    </html>
  );
}
