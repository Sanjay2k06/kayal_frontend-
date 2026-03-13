import { motion } from "framer-motion";
import { User, Bookmark, ClipboardCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SchemeCard from "@/components/SchemeCard";
import { sampleSchemes } from "@/data/schemes";

const savedSchemes = sampleSchemes.slice(0, 2);

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">Your Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Track your saved schemes and eligibility profile.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* Profile */}
          <div className="rounded-lg border bg-card p-6 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <User size={18} /> Profile
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              {[
                ["Age", "32"],
                ["Gender", "Male"],
                ["Occupation", "Farmer"],
                ["Income", "1 - 3 Lakh"],
                ["State", "Maharashtra"],
                ["District", "Pune"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full rounded-md border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
              Edit Profile
            </button>
          </div>

          {/* Stats */}
          <div className="space-y-4 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Bookmark, label: "Saved Schemes", value: "2" },
                { icon: ClipboardCheck, label: "Eligible Schemes", value: "6" },
                { icon: User, label: "Profile Complete", value: "100%" },
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

            {/* Saved Schemes */}
            <div>
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                <Bookmark size={18} /> Saved Schemes
              </h2>
              <div className="space-y-3">
                {savedSchemes.map((s, i) => (
                  <SchemeCard key={s.id} scheme={s} index={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
