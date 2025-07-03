import React from "react";
import { Button } from "@/components/ui/button";

interface WelcomeBannerProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
}

const defaultWelcomeBannerProps: WelcomeBannerProps = {
  title: "Welcome to ChronoChat!",
  subtitle: "Dive into your timeline of conversations.",
  ctaLabel: "Start a New Chat",
  ctaUrl: "/chat/-1",
};

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  title = defaultWelcomeBannerProps.title,
  subtitle = defaultWelcomeBannerProps.subtitle,
  ctaLabel = defaultWelcomeBannerProps.ctaLabel,
  ctaUrl = defaultWelcomeBannerProps.ctaUrl,
}) => (
  // bg-gradient-to-r from-indigo-500 to-purple-600
  <section className="min-h-screen flex flex-col text-black text-center items-center justify-center rounded-lg p-4 -mt-12">
    <h1 className="text-4xl font-bold">{title}</h1>
    <p className="text-xl mt-4">{subtitle}</p>
    <a
      href={ctaUrl}
      className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-gray-800 transition-colors"
    >
      {ctaLabel}
    </a>
    <span className="mt-10 text-xs text-gray-500 opacity-80">
      Scroll down to see more ↓
    </span>
  </section>
);
