import Image from "next/image";

const areaTags = [
  "Descriptive set theory",
  "Ergodic theory",
  "Topological dynamics",
  "Motion planning",
];

export function HeroSection() {
  return (
    <section className="py-16 sm:py-20 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-8 sm:gap-12 items-start">
      <Image
        src="/kslutsky.jpg"
        alt="Konstantin Slutsky"
        width={176}
        height={224}
        priority
        className="w-36 h-44 sm:w-44 sm:h-56 rounded-2xl object-cover object-top ring-1 ring-stone-200 shadow-md"
      />
      <div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-stone-900 font-sans">
          Konstantin Slutsky
        </h1>
        <p className="text-base text-stone-500 leading-relaxed mt-2">
          Assistant Professor at Iowa State University
        </p>
        <p className="text-sm text-stone-600 leading-relaxed mt-4">
          My research focuses on descriptive set theory and its interactions with
          ergodic theory and topological dynamics. I am also interested in
          applications of topology to motion planning in robotics.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {areaTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
