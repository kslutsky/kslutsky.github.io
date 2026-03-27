import { HeroSection } from "@/components/public/hero-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <section id="publications" className="mt-16">
        <h2 className="text-2xl font-semibold text-stone-900">Publications</h2>
        <div className="mt-2 h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
        <p className="mt-6 text-sm text-stone-500">Coming soon...</p>
      </section>
      <section id="lecture-notes" className="mt-16">
        <h2 className="text-2xl font-semibold text-stone-900">Lecture Notes</h2>
        <div className="mt-2 h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
        <p className="mt-6 text-sm text-stone-500">Coming soon...</p>
      </section>
    </>
  );
}
