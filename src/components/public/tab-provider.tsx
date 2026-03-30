"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from "react";

// ---------------------------------------------------------------------------
// Section definitions
// ---------------------------------------------------------------------------

export type SectionId =
  | "preprints"
  | "publications"
  | "lecture-notes"
  | "teaching"
  | "students";

interface SectionDef {
  id: SectionId;
  label: string;
  group: "research" | "academic";
}

const sections: SectionDef[] = [
  { id: "preprints", label: "Preprints", group: "research" },
  { id: "publications", label: "Publications", group: "research" },
  { id: "lecture-notes", label: "Notes", group: "research" },
  { id: "teaching", label: "Teaching", group: "academic" },
  { id: "students", label: "Students", group: "academic" },
];

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const TabContext = createContext<{
  activeSection: SectionId;
  setActiveSection: (id: SectionId) => void;
}>({
  activeSection: "preprints",
  setActiveSection: () => {},
});

export function useTab() {
  return useContext(TabContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function TabProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSectionState] = useState<SectionId>("preprints");

  const setActiveSection = useCallback((id: SectionId) => {
    setActiveSectionState(id);
    history.replaceState(null, "", `#${id}`);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as SectionId;
    if (sections.some((s) => s.id === hash)) {
      setActiveSectionState(hash);
    }
  }, []);

  return (
    <TabContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </TabContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Tab bar
// ---------------------------------------------------------------------------

export function SectionTabs() {
  const { activeSection, setActiveSection } = useTab();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const currentIdx = sections.findIndex((s) => s.id === activeSection);
    let nextIdx = currentIdx;

    if (e.key === "ArrowRight") {
      nextIdx = (currentIdx + 1) % sections.length;
    } else if (e.key === "ArrowLeft") {
      nextIdx = (currentIdx - 1 + sections.length) % sections.length;
    } else if (e.key === "Home") {
      nextIdx = 0;
    } else if (e.key === "End") {
      nextIdx = sections.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    setActiveSection(sections[nextIdx].id);
    tabRefs.current[nextIdx]?.focus();
  }

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center">
        <a
          href="/"
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-indigo-600 text-white text-xs font-bold tracking-wide"
          aria-label="Konstantin Slutsky — Home"
        >
          KS
        </a>
        <div
          role="tablist"
          aria-label="Page sections"
          onKeyDown={handleKeyDown}
          className="flex-1 flex items-center justify-center overflow-x-auto scrollbar-none"
        >
        {sections.map((section, i) => {
          const prevGroup = i > 0 ? sections[i - 1].group : null;
          const showSeparator = prevGroup !== null && prevGroup !== section.group;
          const isActive = activeSection === section.id;
          const isResearch = section.group === "research";

          return (
            <div key={section.id} className="flex items-center shrink-0">
              {showSeparator && (
                <div className="mx-2 h-4 w-px bg-stone-300 shrink-0" aria-hidden="true" />
              )}
              <button
                ref={(el) => { tabRefs.current[i] = el; }}
                role="tab"
                id={`tab-${section.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${section.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveSection(section.id)}
                className={`relative px-3 py-3 text-sm font-medium transition-colors duration-150 whitespace-nowrap ${
                  isActive
                    ? isResearch
                      ? "text-indigo-700"
                      : "text-stone-800"
                    : "text-stone-400 hover:text-stone-600"
                } ${
                  isActive
                    ? isResearch
                      ? "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:rounded-full after:bg-gradient-to-r after:from-indigo-500 after:to-indigo-500/0"
                      : "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:rounded-full after:bg-gradient-to-r after:from-stone-500 after:to-stone-500/0"
                    : ""
                }`}
              >
                {section.label}
              </button>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab panel with fade transition
// ---------------------------------------------------------------------------

export function TabPanel({
  sectionId,
  children,
}: {
  sectionId: SectionId;
  children: ReactNode;
}) {
  const { activeSection } = useTab();
  const isActive = activeSection === sectionId;
  const [visible, setVisible] = useState(isActive);
  const [opacity, setOpacity] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      // Show: make visible first, then fade in on next frame
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setOpacity(true));
      });
    } else {
      // Hide: fade out, then remove from layout after transition
      setOpacity(false);
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!visible) return null;

  return (
    <div
      id={`panel-${sectionId}`}
      role="tabpanel"
      aria-labelledby={`tab-${sectionId}`}
      className={`transition-opacity duration-200 ${
        opacity ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </div>
  );
}
