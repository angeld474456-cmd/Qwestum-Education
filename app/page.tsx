import Catalog from "@/components/catalog/Catalog";
import Footer from "@/components/layout/Footer";
import HowItWorks from "@/components/home/HowItWorks";
import Pricing from "@/components/home/Pricing";
import Reviews from "@/components/home/Reviews";
import Schools from "@/components/home/Schools";
import AISection from "@/components/home/AISection";
import Subjects from "@/components/home/Subjects";import Header from "@/components/layout/Header";
import Hero from "@/components/home/Hero";
import Statistics from "@/components/home/Statistics";
import Features from "@/components/home/Features";

export default function Home() {
  return (
    <main className="bg-[#070B14] text-white">
      <Header />

      <Hero />

      <Statistics />

      <Features />
      <Subjects />
      <Catalog />
      <AISection />
      <HowItWorks />
      <Schools />
      <Reviews />
      <Pricing />
    </main>

  );
}
<Footer />