import Header from "@/components/layout/Header";
import Hero from "@/components/home/Hero";
import Statistics from "@/components/home/Statistics";
import Features from "@/components/home/Features";

export default function Home() {
  return (
    <main className="bg-[#070B14] text-white min-h-screen">
      <Header />
      <Hero />
      <Statistics />
      <Features />
    </main>
  );
}