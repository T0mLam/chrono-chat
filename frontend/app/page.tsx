import { WelcomeBanner } from "@/components/about/WelcomeBanner";
import { Features } from "@/components/about/Features";
import { HowItWorks } from "@/components/about/HowItWorks";
import { FAQAccordion } from "@/components/about/FAQAccordion";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home - ChronoChat",
};

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full overflow-x-hidden">
      <WelcomeBanner
        title="Welcome to ChronoChat!"
        subtitle="Dive into your timeline of conversations."
        ctaLabel="Start a New Chat"
        ctaUrl="/chat/-1"
      />
      <Features />
      <HowItWorks />
      <FAQAccordion />
    </div>
  );
}
