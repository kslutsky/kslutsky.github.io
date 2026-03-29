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
    <div className="space-y-10">
      {Array.from(groups.entries()).map(([institution, items]) => (
        <div key={institution}>
          <h3 className="text-lg font-semibold text-stone-800 border-b border-stone-200 pb-2 mb-4">
            {institution}
          </h3>

          <div className="flex flex-col gap-6">
            {items.map((c) => (
              <div key={c.id}>
                {/* Mobile */}
                <div className="sm:hidden">
                  <p className="text-xs text-stone-300 font-semibold mb-1">
                    {c.semester} {c.year}
                  </p>
                  <p className="text-base font-semibold leading-snug text-stone-900">
                    {c.courseTitle}
                  </p>
                  <p className="mt-1 text-xs text-stone-400 italic">
                    {c.courseNumber}
                  </p>
                </div>

                {/* Desktop: semester+year left column, title + number right */}
                <div className="hidden sm:flex gap-8 md:gap-12">
                  <div className="w-12 shrink-0 pt-0.5">
                    <span className="text-sm font-semibold tabular-nums text-stone-300 whitespace-nowrap">
                      {c.semester.slice(0, 2)}&nbsp;{c.year}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold leading-snug text-stone-900">
                      {c.courseTitle}
                    </p>
                    <p className="mt-1 text-xs text-stone-400 italic">
                      {c.courseNumber}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
