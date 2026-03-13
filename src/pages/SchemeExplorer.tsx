import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import FilterPanel from "@/components/FilterPanel";
import SchemeCard from "@/components/SchemeCard";
import { sampleSchemes } from "@/data/schemes";

const SchemeExplorer = () => {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    return sampleSchemes.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.category && filters.category !== "All" && s.category !== filters.category) return false;
      if (filters.incomeGroup && filters.incomeGroup !== "All" && s.incomeGroup !== filters.incomeGroup) return false;
      return true;
    });
  }, [search, filters]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">Scheme Explorer</h1>
          <p className="mt-2 text-muted-foreground">
            Browse and search through available government welfare schemes.
          </p>
        </motion.div>

        <div className="mt-8 space-y-6">
          <SearchBar value={search} onChange={setSearch} />
          <FilterPanel filters={filters} onChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))} />
        </div>

        <div className="mt-8 space-y-4">
          {filtered.length > 0 ? (
            filtered.map((s, i) => <SchemeCard key={s.id} scheme={s} index={i} />)
          ) : (
            <div className="rounded-lg border border-dashed bg-card/50 p-12 text-center">
              <p className="text-sm text-muted-foreground">No schemes match your current filters.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SchemeExplorer;
