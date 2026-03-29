import Image from "next/image";
import { VoronoiCanvas } from "./voronoi-canvas";

const areaTags = [
  "Descriptive set theory",
  "Ergodic theory",
  "Topological dynamics",
  "Motion planning",
];

export function HeroSection() {
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
            <Image
              src="/pencil-photo.png"
              alt="Konstantin Slutsky"
              width={176}
              height={224}
              priority
              className="w-36 h-44 sm:w-44 sm:h-56 object-cover object-top shrink-0 self-center sm:self-auto"
            />
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
                Konstantin Slutsky
              </h1>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed mt-2">
                Assistant Professor at Iowa State University
              </p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-4 max-w-prose">
                My research focuses on descriptive set theory and its interactions
                with ergodic theory and topological dynamics. I am also interested
                in applications of topology to motion planning in robotics.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {areaTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
