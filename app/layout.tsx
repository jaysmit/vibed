import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { NavigationProgress } from "@/components/ui";
import "./globals.css";

// Lazy load FeedbackWidget - only needed when user clicks the feedback button
const FeedbackWidget = dynamic(
  () => import("@/components/ui/FeedbackWidget").then(mod => mod.FeedbackWidget),
  {
    loading: () => null, // Don't show anything while loading
  }
);

// Fonts with display: "swap" for faster text rendering (show fallback immediately)
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK"],
  display: "swap",
  fallback: ['Georgia', 'serif'],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600"], // Reduced from 4 weights - only body (400) and bold (600)
  display: "swap",
  fallback: ['system-ui', 'sans-serif'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
  fallback: ['Consolas', 'monospace'],
});

export const metadata: Metadata = {
  title: "Vibed — the story, from the person who lived it",
  description: "Follow founders from week one. The overnight success, filmed daily.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        {/* Speculation Rules: Browser prerenders pages user is likely to visit */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [{
                where: {
                  href_matches: ["/v/*", "/discover", "/founder/*"]
                },
                eagerness: "moderate"
              }],
              prefetch: [{
                where: {
                  href_matches: ["/*"]
                },
                eagerness: "conservative"
              }]
            })
          }}
        />
      </head>
      <body>
        <NavigationProgress />
        {children}
        <FeedbackWidget />
      </body>
    </html>
  );
}
