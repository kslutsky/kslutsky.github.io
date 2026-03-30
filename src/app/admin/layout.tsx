import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import ViewportWarning from "@/components/admin/viewport-warning";
import Sidebar from "@/components/admin/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth().catch(() => null);
  if (!session) {
    redirect("/auth/signout");
  }

  return (
    <div className="flex h-screen">
      <ViewportWarning />
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-zinc-50 p-6">{children}</main>
    </div>
  );
}
