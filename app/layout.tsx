import type { Metadata } from "next";
import { Schibsted_Grotesk, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const display = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://combienjevaux.fr"),
  title: {
    default: "Combien je vaux ? Votre bilan financier, en clair.",
    template: "%s · Combien je vaux",
  },
  description:
    "Salaire, immobilier, retraite, investissement : obtenez une vision claire de votre situation financière et de votre avenir, sans jargon.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Combien je vaux",
    title: "Combien je vaux ? Votre bilan financier, en clair.",
    description:
      "Comprendre, comparer et décider — votre situation financière en quelques minutes.",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
