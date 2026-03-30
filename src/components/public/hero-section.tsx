import Image from "next/image";
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { VoronoiCanvas } from "./voronoi-canvas";

const DEFAULT_BIO =
  "My research lies at the intersection of descriptive set theory and ergodic theory, with a focus on Borel dynamics of flows — including orbit equivalence, cross sections, and full groups. I am also interested in applications of formal methods and planning algorithms to autonomous systems.";

const getHeroBio = unstable_cache(
  async () => {
    const [row] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, "hero_bio"));
    return row?.value || DEFAULT_BIO;
  },
  ["hero-bio"],
  { tags: ["settings"], revalidate: 3600 }
);

export async function HeroSection() {
  const bio = await getHeroBio();

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden bg-[var(--bg-secondary)]"
         style={{ minHeight: "max(calc(100svh - 3.5rem), 500px)", height: "calc(100svh - 3.5rem)" }}>
      {/* Animated Voronoi background */}
      <VoronoiCanvas
        pointCount={28}
        className="absolute inset-0 w-full h-full z-0"
      />

      {/* Hero content */}
      <div className="relative z-[2] w-full max-w-3xl mx-auto px-4 sm:px-6 py-24">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-12 gap-6">
            <div className="w-36 h-44 sm:w-44 sm:h-56 shrink-0 self-center sm:self-auto bg-[var(--bg-primary)] rounded-2xl">
              <Image
                src="/pencil-photo.png"
                alt="Konstantin Slutsky"
                width={176}
                height={224}
                priority
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
                Konstantin Slutsky
              </h1>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed mt-2">
                Assistant Professor, <a href="https://math.iastate.edu/" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline underline-offset-2 decoration-[var(--accent-border)] hover:decoration-[var(--accent)] transition-colors">Dept. of Mathematics</a>, <a href="https://www.iastate.edu/" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline underline-offset-2 decoration-[var(--accent-border)] hover:decoration-[var(--accent)] transition-colors">Iowa State University</a>
              </p>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed mt-1">
                Senior Adviser, <a href="https://www.ventitechnologies.com/" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline underline-offset-2 decoration-[var(--accent-border)] hover:decoration-[var(--accent)] transition-colors">Venti Technologies</a>
              </p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-4 max-w-prose">
                {bio}
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}
