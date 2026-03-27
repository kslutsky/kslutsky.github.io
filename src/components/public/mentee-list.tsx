import type { InferSelectModel } from "drizzle-orm";
import type { mentees } from "@/lib/db/schema";

type Mentee = InferSelectModel<typeof mentees>;

const CATEGORY_LABELS: Record<string, string> = {
  phd: "PhD Students",
  postdoc: "Postdocs",
  masters: "Master's Students",
  undergraduate: "Undergraduate Research",
};

const CATEGORY_ORDER = ["phd", "postdoc", "masters", "undergraduate"];

export function MenteeList({ mentees }: { mentees: Mentee[] }) {
  if (mentees.length === 0) {
    return <p className="mt-6 text-sm text-stone-500">No students listed yet.</p>;
  }

  const groups = new Map<string, Mentee[]>();
  for (const m of mentees) {
    const group = groups.get(m.category);
    if (group) group.push(m);
    else groups.set(m.category, [m]);
  }

  return (
    <div className="mt-8 space-y-8">
      {CATEGORY_ORDER.filter((cat) => groups.has(cat)).map((cat) => (
        <div key={cat}>
          <h3 className="text-lg font-semibold text-stone-800 mb-3">
            {CATEGORY_LABELS[cat]}
          </h3>
          <div className="space-y-3">
            {groups.get(cat)!.map((m) => (
              <div key={m.id}>
                <div className="flex items-baseline gap-3">
                  {m.homepage ? (
                    <a
                      href={m.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2 decoration-indigo-300 hover:decoration-indigo-600 transition-colors"
                    >
                      {m.name}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-stone-800">{m.name}</span>
                  )}
                  <span className="text-xs text-stone-400">
                    {m.institution}, {m.startYear}&ndash;{m.endYear ?? "present"}
                  </span>
                </div>
                {m.thesisTitle && (
                  <p className="mt-0.5 ml-0 text-xs text-stone-500 italic">
                    Thesis: &ldquo;{m.thesisTitle}&rdquo;
                  </p>
                )}
                {m.firstPosition && (
                  <p className="mt-0.5 ml-0 text-xs text-stone-500">
                    Now: {m.firstPosition}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
