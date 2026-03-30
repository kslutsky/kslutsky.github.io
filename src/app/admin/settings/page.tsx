import { getSetting } from "@/lib/actions/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function SettingsPage() {
  const heroBio = (await getSetting("hero_bio")) ?? "";

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Settings</h1>
      <SettingsForm heroBio={heroBio} />
    </div>
  );
}
