import { useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Scheme } from "@/components/SchemeCard";
import { getSchemeById } from "@/lib/api";

const SchemeCompare = () => {
  const location = useLocation();
  const ids = useMemo(() => new URLSearchParams(location.search).getAll("id").slice(0, 3), [location.search]);
  const [items, setItems] = useState<Scheme[]>([]);

  useEffect(() => {
    const load = async () => {
      if (ids.length === 0) {
        setItems([]);
        return;
      }
      const resolved = await Promise.all(ids.map(async (id) => {
        try {
          return await getSchemeById(id);
        } catch {
          return null;
        }
      }));
      setItems(resolved.filter(Boolean) as Scheme[]);
    };
    void load();
  }, [ids]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground">Scheme Comparison</h1>
        <p className="mt-2 text-sm text-muted-foreground">Compare up to 3 selected schemes side by side.</p>

        {items.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed bg-card/50 p-10 text-center">
            <p className="text-sm text-muted-foreground">No schemes selected. Choose up to 3 from Scheme Explorer.</p>
            <Link to="/schemes" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Go to Explorer</Link>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">Field</th>
                  {items.map((s) => <th key={s.id} className="px-4 py-3 text-left">{s.name}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {[
                  ["Category", (s: Scheme) => s.category || "-"],
                  ["State", (s: Scheme) => s.state || "-"],
                  ["Eligibility", (s: Scheme) => s.eligibility],
                  ["Benefits", (s: Scheme) => s.benefits],
                  ["Documents", (s: Scheme) => (s.documents || []).join(", ") || "-"],
                  ["Guidance", (s: Scheme) => s.guidance || "-"],
                  ["Official Link", (s: Scheme) => s.applyLink],
                ].map(([label, getter]) => (
                  <tr key={String(label)}>
                    <td className="px-4 py-3 font-semibold text-foreground">{String(label)}</td>
                    {items.map((s) => <td key={`${s.id}-${String(label)}`} className="px-4 py-3 text-muted-foreground">{(getter as (x: Scheme) => string)(s)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SchemeCompare;