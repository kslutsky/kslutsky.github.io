import { getSetting } from "@/lib/actions/settings";
import { SettingsForm } from "@/components/admin/settings-form";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function SettingsPage() {
  const heroBio = (await getSetting("hero_bio")) ?? "";

  const recentLogins = await db
    .select()
    .from(auditLog)
    .where(eq(auditLog.action, "login"))
    .orderBy(desc(auditLog.createdAt))
    .limit(10);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Settings</h1>
      <SettingsForm heroBio={heroBio} />

      <div className="mt-10 max-w-xl">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">
          Recent Logins
        </h2>
        {recentLogins.length === 0 ? (
          <p className="text-sm text-stone-500">No login records yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs font-semibold uppercase tracking-widest text-stone-400">
                <th className="pb-2">Date</th>
                <th className="pb-2">User</th>
                <th className="pb-2">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recentLogins.map((entry) => (
                <tr key={entry.id}>
                  <td className="py-2 text-stone-700">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 text-stone-700">{entry.userLogin}</td>
                  <td className="py-2 text-stone-500">
                    {entry.ipAddress ?? "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
