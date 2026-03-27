import { TabProvider } from "@/components/public/tab-provider";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <TabProvider>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8">{children}</main>
      <Footer />
    </TabProvider>
  );
}
