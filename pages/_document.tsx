import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Primary Meta Tags */}
        <title>FeastFit — Macro-Aware Restaurant Search Powered by AI</title>
        <meta
          name="title"
          content="FeastFit — Macro-Aware Restaurant Search Powered by AI"
        />
        <meta
          name="description"
          content="Find macro-friendly meals at real restaurants. Hit your protein, calories, and diet goals anywhere — instantly with FeastFit."
        />
        <meta
          name="keywords"
          content="macro tracking, restaurant search, protein, diet, AI, Yelp, fitness, nutrition"
        />
        <meta name="generator" content="Next.js" />

        {/* Icons */}
        <link
          rel="icon"
          href="/icon-light-32x32.png"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href="/icon-dark-32x32.png"
          media="(prefers-color-scheme: dark)"
        />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme & Mobile */}
        <meta name="theme-color" content="#00C27A" />
        <meta name="viewport" content="width=device-width, initialScale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="FeastFit" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
