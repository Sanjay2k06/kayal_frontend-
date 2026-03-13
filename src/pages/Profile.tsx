import { FormEvent, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getMyProfile, updateMyProfile } from "@/lib/api";

const Profile = () => {
  const [form, setForm] = useState<Record<string, string>>({
    name: "",
    age: "",
    gender: "",
    occupation: "",
    income: "",
    state: "",
    district: "",
    education_level: "",
    social_category: "",
    residence_type: "",
    marital_status: "",
    disability_status: "",
    minority_status: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getMyProfile();
        setForm((prev) => ({
          ...prev,
          ...Object.fromEntries(Object.entries(profile).map(([k, v]) => [k, v == null ? "" : String(v)])),
        }));
      } catch {
        setStatus("Unable to load profile");
      }
    };
    void load();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    try {
      await updateMyProfile({
        ...form,
        age: form.age ? Number(form.age) : undefined,
        income: form.income ? Number(form.income) : undefined,
      });
      setStatus("Profile updated successfully");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground">Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Fetch and update your profile details.</p>

        <form onSubmit={submit} className="mt-8 grid gap-4 rounded-lg border bg-card p-6 shadow-card md:grid-cols-2">
          {Object.entries(form).map(([key, value]) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {key.replaceAll("_", " ")}
              </label>
              <input
                className={inputClass}
                value={value}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Profile"}
            </button>
            {status && <span className="text-sm text-muted-foreground">{status}</span>}
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;