import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SchemeCard from "@/components/SchemeCard";
import { sampleSchemes } from "@/data/schemes";

interface FormData {
  age: string;
  gender: string;
  occupation: string;
  income: string;
  state: string;
  district: string;
}

const EligibilityChecker = () => {
  const [form, setForm] = useState<FormData>({
    age: "",
    gender: "",
    occupation: "",
    income: "",
    state: "",
    district: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const update = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const selectClass =
    "w-full rounded-md border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40";
  const inputClass = selectClass;
  const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">Eligibility Checker</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your details to discover schemes you qualify for.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-10 lg:grid-cols-5">
          {/* Form */}
          <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 shadow-card lg:col-span-2">
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Age</label>
                <input type="number" value={form.age} onChange={(e) => update("age", e.target.value)} placeholder="e.g. 32" className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select value={form.gender} onChange={(e) => update("gender", e.target.value)} className={selectClass} required>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Occupation</label>
                <select value={form.occupation} onChange={(e) => update("occupation", e.target.value)} className={selectClass} required>
                  <option value="">Select</option>
                  <option>Farmer</option>
                  <option>Student</option>
                  <option>Self-employed</option>
                  <option>Salaried</option>
                  <option>Unemployed</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Annual Income Range</label>
                <select value={form.income} onChange={(e) => update("income", e.target.value)} className={selectClass} required>
                  <option value="">Select</option>
                  <option>Below 1 Lakh</option>
                  <option>1 - 3 Lakh</option>
                  <option>3 - 6 Lakh</option>
                  <option>6 - 10 Lakh</option>
                  <option>Above 10 Lakh</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>State</label>
                <select value={form.state} onChange={(e) => update("state", e.target.value)} className={selectClass} required>
                  <option value="">Select</option>
                  <option>Maharashtra</option>
                  <option>Karnataka</option>
                  <option>Tamil Nadu</option>
                  <option>Uttar Pradesh</option>
                  <option>Delhi</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>District</label>
                <input value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="e.g. Pune" className={inputClass} required />
              </div>
            </div>
            <button
              type="submit"
              className="mt-6 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Check Eligibility
            </button>
          </form>

          {/* Results */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Eligible Schemes ({sampleSchemes.length})
                </h2>
                {sampleSchemes
                  .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
                  .map((s, i) => (
                    <SchemeCard key={s.id} scheme={s} index={i} />
                  ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed bg-card/50 p-12">
                <p className="text-center text-sm text-muted-foreground">
                  Fill in your details and submit to see eligible schemes ranked by match score.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EligibilityChecker;
