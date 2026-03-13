import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import FilterPanel from "@/components/FilterPanel";
import SchemeCard, { Scheme } from "@/components/SchemeCard";
import { addBookmark, getBookmarks, getSchemes, removeBookmark } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

const SchemeExplorer = () => {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadBookmarks = async () => {
      if (!isAuthenticated()) return;
      try {
        const bookmarks = await getBookmarks();
        setBookmarkedIds(new Set(bookmarks.map((item) => item.id)));
      } catch {
        setBookmarkedIds(new Set());
      }
    };
    void loadBookmarks();
  }, []);

  useEffect(() => {
    setPage(1);
    setSchemes([]);
    setHasMore(true);
  }, [search, filters]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!hasMore && page > 1) return;
      setLoading(true);
      setErrorMessage("");
      try {
        const result = await getSchemes({
          page,
          limit: 24,
          search,
          category: filters.category,
          state: filters.state,
        });

        const filtered = result.items.filter((item) => {
          const profileText = `${item.eligibility} ${item.description || ""}`.toLowerCase();
          const occupationOk = !filters.occupation || filters.occupation === "All" || profileText.includes(filters.occupation.toLowerCase());
          const incomeOk = !filters.incomeGroup || filters.incomeGroup === "All" || profileText.includes(filters.incomeGroup.toLowerCase().replace(/\s+/g, " "));
          return occupationOk && incomeOk;
        });

        setSchemes((prev) => (page === 1 ? filtered : [...prev, ...filtered]));
        setTotal(result.total);
        setHasMore(page * 24 < result.total);
      } catch {
        if (page === 1) setSchemes([]);
        setErrorMessage("Unable to load schemes right now. Please retry.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, filters, page, hasMore]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (schemes.length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((prev) => Math.min(schemes.length - 1, prev + 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [schemes.length]);

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const keys = new Set<string>();
    for (const item of schemes) {
      if (item.name.toLowerCase().includes(search.toLowerCase())) keys.add(item.name);
      if (keys.size >= 6) break;
    }
    return Array.from(keys);
  }, [search, schemes]);

  const toggleBookmark = async (schemeId: string) => {
    if (!isAuthenticated()) return;
    const isBookmarked = bookmarkedIds.has(schemeId);
    try {
      if (isBookmarked) {
        await removeBookmark(schemeId);
      } else {
        await addBookmark(schemeId);
      }
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (next.has(schemeId)) next.delete(schemeId);
        else next.add(schemeId);
        return next;
      });
    } catch {
      return;
    }
  };

  const toggleCompare = (schemeId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(schemeId)) return prev.filter((id) => id !== schemeId);
      if (prev.length >= 3) return prev;
      return [...prev, schemeId];
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">Scheme Explorer</h1>
          <p className="mt-2 text-muted-foreground">
            Browse and search through available government welfare schemes.
          </p>
        </motion.div>

        <div className="mt-8 space-y-6">
          <SearchBar value={search} onChange={setSearch} suggestions={suggestions} onSelectSuggestion={setSearch} />
          <FilterPanel filters={filters} onChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))} />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card/50 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Loaded {schemes.length} of {total} schemes</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Compare selected: {compareIds.length}/3</span>
              <Link
                to={`/schemes/compare?${compareIds.map((id) => `id=${encodeURIComponent(id)}`).join("&")}`}
                className={`rounded-md px-3 py-1.5 font-semibold ${compareIds.length > 0 ? "bg-primary text-primary-foreground" : "border text-muted-foreground"}`}
              >
                Compare
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {errorMessage && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
              {errorMessage}
            </div>
          )}
          {loading && page === 1 ? (
            <div className="rounded-lg border border-dashed bg-card/50 p-12 text-center">
              <p className="text-sm text-muted-foreground">Loading schemes...</p>
            </div>
          ) : schemes.length > 0 ? (
            schemes.map((s, i) => {
              const selectedForCompare = compareIds.includes(s.id);
              return (
                <div key={s.id} className="space-y-2">
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => toggleCompare(s.id)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${selectedForCompare ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
                    >
                      {selectedForCompare ? "Selected for Compare" : "Add to Compare"}
                    </button>
                  </div>
                  <SchemeCard
                    scheme={s}
                    index={i}
                    isBookmarked={bookmarkedIds.has(s.id)}
                    onToggleBookmark={toggleBookmark}
                  />
                  {focusedIndex === i && <div className="sr-only" aria-live="polite">Focused scheme {s.name}</div>}
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed bg-card/50 p-12 text-center">
              <p className="text-sm text-muted-foreground">No schemes match your filters. Try clearing category/state or broadening your search terms.</p>
            </div>
          )}
          <div ref={loadMoreRef} />
          {loading && page > 1 && <p className="text-center text-sm text-muted-foreground">Loading more schemes...</p>}
          {!hasMore && schemes.length > 0 && <p className="text-center text-sm text-muted-foreground">You reached the end.</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SchemeExplorer;
