"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

type Tab = "research" | "academic";

const RESEARCH_HASHES = ["#preprints", "#publications", "#lecture-notes"];
const ACADEMIC_HASHES = ["#teaching", "#students"];

function tabFromHash(hash: string): Tab {
  if (ACADEMIC_HASHES.includes(hash)) return "academic";
  return "research";
}

const TabContext = createContext<{
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}>({ activeTab: "research", setActiveTab: () => {} });

export function useTab() {
  return useContext(TabContext);
}

// Provider — wraps the entire public layout so Navbar can also consume context
export function TabProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<Tab>("research");

  useEffect(() => {
    setActiveTab(tabFromHash(window.location.hash));
    const handler = () => setActiveTab(tabFromHash(window.location.hash));
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const switchTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    window.location.hash = tab === "academic" ? "#teaching" : "#preprints";
  }, []);

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab: switchTab }}>
      {children}
    </TabContext.Provider>
  );
}

// Tab bar — rendered in page.tsx between hero and content
export function TabBar() {
  const { activeTab, setActiveTab } = useTab();
  const tabClass = (tab: Tab) =>
    `pb-2 text-sm font-medium transition-colors duration-150 cursor-pointer ${
      activeTab === tab
        ? "border-b-2 border-indigo-600 text-indigo-700"
        : "text-stone-500 hover:text-stone-800"
    }`;

  return (
    <div className="sticky top-14 z-30 bg-stone-50/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 flex gap-6 pt-2">
        <button onClick={() => setActiveTab("research")} className={tabClass("research")}>Research</button>
        <button onClick={() => setActiveTab("academic")} className={tabClass("academic")}>Academic</button>
      </div>
    </div>
  );
}

// Tab content — shows active tab's content, hides inactive
export function TabContent({
  researchContent,
  academicContent,
}: {
  researchContent: React.ReactNode;
  academicContent: React.ReactNode;
}) {
  const { activeTab } = useTab();
  return (
    <>
      <div className={activeTab === "research" ? "" : "hidden"}>{researchContent}</div>
      <div className={activeTab === "academic" ? "" : "hidden"}>{academicContent}</div>
    </>
  );
}
