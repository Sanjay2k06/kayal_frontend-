import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Bookmark, ClipboardCheck, Sparkles, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SchemeCard, { Scheme } from "@/components/SchemeCard";
import { checkEligibility, getAdminStats, getBookmarks, getMyProfile } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

const Dashboard = () => {
  const [savedSchemes, setSavedSchemes] = useState<Scheme[]>([]);
  const [recommendedSchemes, setRecommendedSchemes] = useState<Scheme[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const profileCompletion = profile
    ? Math.round(
        ([
          profile.name,
          profile.age,
          profile.gender,
          profile.occupation,
          profile.income,
          profile.state,
          profile.district,
          profile.social_category,
        ].filter(Boolean).length /
          8) *
          100
      )
    : 0;

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [profileData, bookmarksData] = await Promise.all([getMyProfile(), getBookmarks()]);
        setProfile(profileData);
        setSavedSchemes(bookmarksData);

        if (profileData.age && profileData.gender && profileData.occupation && profileData.income && profileData.state) {
          const suggestions = await checkEligibility(profileData);
          setRecommendedSchemes(suggestions);
        }

        if (getSessionUser()?.is_admin) {
          try {
            const stats = await getAdminStats();
            setAdminStats(stats);
          } catch {
            setAdminStats(null);
          }
        }
      } catch {
        setSavedSchemes([]);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">Your Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Review profile and suggested schemes based on your onboarding inputs.</p>
        </motion.div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <User size={18} /> Profile Summary
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Update your details anytime from onboarding if needed.</p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>Name: {String(profile?.name || "N/A")}</p>
              <p>Email: {String(profile?.email || "N/A")}</p>
              <p>Occupation: {String(profile?.occupation || "N/A")}</p>
              <p>Gender: {String(profile?.gender || "N/A")}</p>
              <p>State: {String(profile?.state || "N/A")}</p>
              <p>District: {String(profile?.district || "N/A")}</p>
              <p>Social Category: {String(profile?.social_category || "N/A")}</p>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-md border bg-background/50 p-3 text-sm">
              <span className="text-muted-foreground">Profile completion</span>
              <span className="font-semibold text-foreground">{profileCompletion}%</span>
            </div>
            <Link to="/onboarding" className="mt-4 inline-flex w-full items-center justify-center rounded-md border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
              Re-open Onboarding
            </Link>
            {adminStats && (
              <div className="mt-4 rounded-md border bg-background/50 p-3 text-xs text-muted-foreground">
                <p>Total Schemes: {String(adminStats.total_schemes || 0)}</p>
                <p>Total Users: {String(adminStats.total_users || 0)}</p>
                <p className="mt-2 font-semibold text-foreground/80">Top Categories</p>
                <ul className="mt-1 space-y-1">
                  {Object.entries(adminStats.categories || {})
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <li key={key}>{key}: {String(value)}</li>
                    ))}
                </ul>
                <p className="mt-2 font-semibold text-foreground/80">Top States</p>
                <ul className="mt-1 space-y-1">
                  {Object.entries(adminStats.states || {})
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <li key={key}>{key}: {String(value)}</li>
                    ))}
                </ul>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="space-y-4 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Bookmark, label: "Saved Schemes", value: String(savedSchemes.length) },
                { icon: ClipboardCheck, label: "Suggested Schemes", value: String(recommendedSchemes.length) },
                { icon: User, label: "Profile Complete", value: `${profileCompletion}%` },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border bg-card p-5 shadow-card"
                >
                  <stat.icon size={18} className="text-accent" />
                  <p className="mt-3 font-display text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="rounded-lg border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                    <Sparkles size={18} /> Suggested Schemes For You
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">These recommendations refresh from your saved profile inputs.</p>
                </div>
                <Link to="/assistant" className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
                  <MessageSquare size={16} /> Open Assistant
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {recommendedSchemes.length > 0 ? (
                  recommendedSchemes.slice(0, 6).map((scheme, index) => (
                    <SchemeCard key={scheme.id} scheme={scheme} index={index} />
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed bg-background/60 p-8 text-center text-sm text-muted-foreground">
                    Save your profile details to generate personalized scheme suggestions on this dashboard.
                  </div>
                )}
              </div>
            </div>

            {/* Saved Schemes */}
            <div>
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                <Bookmark size={18} /> Saved Schemes
              </h2>
              {loading ? (
                <div className="rounded-lg border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground">
                  Loading schemes...
                </div>
              ) : (
                <div className="space-y-3">
                  {savedSchemes.length > 0 ? (
                    savedSchemes.map((s, i) => <SchemeCard key={s.id} scheme={s} index={i} isBookmarked />)
                  ) : (
                    <div className="rounded-lg border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground">
                      No bookmarked schemes yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
