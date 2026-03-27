import type { InferSelectModel } from "drizzle-orm";
import type { courses } from "@/lib/db/schema";

type Course = InferSelectModel<typeof courses>;

export function TeachingList({ courses }: { courses: Course[] }) {
  if (courses.length === 0) {
    return <p className="mt-6 text-sm text-stone-500">No courses listed yet.</p>;
  }

  // Group by institution (preserving query order within groups)
  const groups = new Map<string, Course[]>();
  for (const c of courses) {
    const group = groups.get(c.institution);
    if (group) group.push(c);
    else groups.set(c.institution, [c]);
  }

  return (
    <div className="mt-8 space-y-8">
      {Array.from(groups.entries()).map(([institution, items]) => (
        <div key={institution}>
          <h3 className="text-lg font-semibold text-stone-800 border-b border-stone-200 pb-2 mb-3">
            {institution}
          </h3>
          <div className="space-y-0">
            {items.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-[5rem_1fr_auto] sm:grid items-baseline gap-x-3 py-1.5 max-sm:flex max-sm:flex-col max-sm:gap-0.5"
              >
                <span className="font-mono text-sm font-semibold text-indigo-600">{c.courseNumber}</span>
                <span className="text-sm text-stone-800">{c.courseTitle}</span>
                <span className="text-xs text-stone-400 whitespace-nowrap">{c.semester} {c.year}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
