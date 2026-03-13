import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SchemeCard, { Scheme } from "@/components/SchemeCard";
import { checkEligibility, updateMyProfile } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

type OnboardingForm = {
  name: string;
  age: string;
  gender: string;
  occupation: string;
  income: string;
  state: string;
  district: string;
  education_level: string;
  social_category: string;
  residence_type: string;
  marital_status: string;
  disability_status: string;
  minority_status: string;
};

const incomeRanges = [
  { label: "Below 1 Lakh", value: "75000" },
  { label: "1 - 3 Lakh", value: "200000" },
  { label: "3 - 6 Lakh", value: "450000" },
  { label: "6 - 10 Lakh", value: "800000" },
  { label: "Above 10 Lakh", value: "1200000" },
];

const states = ["Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Karnataka", "Kerala", "Maharashtra", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"];
const occupations = ["Student", "Employee", "Farmer", "Self-employed", "Job seeker", "Homemaker", "Senior Citizen"];
const genders = ["Male", "Female", "Other"];
const socialCategories = ["General", "OBC", "SC", "ST", "EWS", "Minority"];

const Onboarding = () => {
  const sessionUser = getSessionUser();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Scheme[]>([]);
  const [form, setForm] = useState<OnboardingForm>({
    name: sessionUser?.name || "",
    age: sessionUser?.age ? String(sessionUser.age) : "",
    gender: sessionUser?.gender || "",
    occupation: sessionUser?.occupation || "",
    income: sessionUser?.income ? String(sessionUser.income) : "",
    state: sessionUser?.state || "",
    district: sessionUser?.district || "",
    education_level: sessionUser?.education_level || "",
    social_category: sessionUser?.social_category || "",
    residence_type: sessionUser?.residence_type || "",
    marital_status: sessionUser?.marital_status || "",
    disability_status: sessionUser?.disability_status || "",
    minority_status: sessionUser?.minority_status || "",
  });

  const navigate = useNavigate();

  const inputClass = "w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40";

  const completion = useMemo(() => {
    const fields = [
      form.name,
      form.age,
      form.gender,
      form.occupation,
      form.income,
      form.state,
      form.district,
      form.social_category,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [form]);

  const update = (key: keyof OnboardingForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const runEligibility = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        name: form.name,
        age: Number(form.age),
        gender: form.gender,
        occupation: form.occupation,
        income: Number(form.income),
        state: form.state,
        district: form.district,
        education_level: form.education_level,
        social_category: form.social_category,
        residence_type: form.residence_type,
        marital_status: form.marital_status,
        disability_status: form.disability_status,
        minority_status: form.minority_status,
      };

      await updateMyProfile(payload);
      const suggested = await checkEligibility(payload);
      setResults(suggested);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete onboarding.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">Welcome to CiviX</h1>
          <p className="mt-2 text-muted-foreground">Complete onboarding once: profile input then eligibility results.</p>
        </motion.div>

        <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className={step >= 1 ? "text-accent" : ""}>1. Basic</span>
          <span>•</span>
          <span className={step >= 2 ? "text-accent" : ""}>2. Profile</span>
          <span>•</span>
          <span className={step >= 3 ? "text-accent" : ""}>3. Eligibility</span>
        </div>

        {step < 3 && (
          <form onSubmit={runEligibility} className="mt-8 rounded-lg border bg-card p-6 shadow-card">
            {step === 1 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <input className={inputClass} placeholder="Full Name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
                <input className={inputClass} placeholder="Age" type="number" value={form.age} onChange={(e) => update("age", e.target.value)} required />
                <select className={inputClass} value={form.gender} onChange={(e) => update("gender", e.target.value)} required>
                  <option value="">Gender</option>
                  {genders.map((option) => <option key={option}>{option}</option>)}
                </select>
                <select className={inputClass} value={form.occupation} onChange={(e) => update("occupation", e.target.value)} required>
                  <option value="">Occupation</option>
                  {occupations.map((option) => <option key={option}>{option}</option>)}
                </select>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <select className={inputClass} value={form.income} onChange={(e) => update("income", e.target.value)} required>
                  <option value="">Annual Income</option>
                  {incomeRanges.map((range) => <option key={range.label} value={range.value}>{range.label}</option>)}
                </select>
                <select className={inputClass} value={form.state} onChange={(e) => update("state", e.target.value)} required>
                  <option value="">State</option>
                  {states.map((option) => <option key={option}>{option}</option>)}
                </select>
                <input className={inputClass} placeholder="District" value={form.district} onChange={(e) => update("district", e.target.value)} required />
                <select className={inputClass} value={form.social_category} onChange={(e) => update("social_category", e.target.value)} required>
                  <option value="">Social Category</option>
                  {socialCategories.map((option) => <option key={option}>{option}</option>)}
                </select>
                <input className={inputClass} placeholder="Education Level" value={form.education_level} onChange={(e) => update("education_level", e.target.value)} />
                <select className={inputClass} value={form.residence_type} onChange={(e) => update("residence_type", e.target.value)}>
                  <option value="">Residence Type</option>
                  <option>Urban</option>
                  <option>Rural</option>
                  <option>Semi-urban</option>
                </select>
                <select className={inputClass} value={form.marital_status} onChange={(e) => update("marital_status", e.target.value)}>
                  <option value="">Marital Status</option>
                  <option>Single</option>
                  <option>Married</option>
                  <option>Widowed</option>
                </select>
                <select className={inputClass} value={form.disability_status} onChange={(e) => update("disability_status", e.target.value)}>
                  <option value="">Disability Status</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <select className={inputClass} value={form.minority_status} onChange={(e) => update("minority_status", e.target.value)}>
                  <option value="">Minority Community</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between rounded-md border bg-background/50 p-3 text-sm">
              <span className="text-muted-foreground">Profile completion</span>
              <span className="font-semibold text-foreground">{completion}%</span>
            </div>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <div className="mt-5 flex gap-2">
              {step > 1 && (
                <button type="button" onClick={() => setStep((prev) => prev - 1)} className="rounded-md border px-4 py-2 text-sm font-medium">
                  Back
                </button>
              )}
              {step < 2 ? (
                <button type="button" onClick={() => setStep(2)} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                  Next
                </button>
              ) : (
                <button type="submit" disabled={submitting} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                  {submitting ? "Checking eligibility..." : "Save Profile and Check Eligibility"}
                </button>
              )}
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="mt-8 space-y-4">
            <h2 className="font-display text-xl font-semibold text-foreground">Your Suggested Schemes ({results.length})</h2>
            {results.slice(0, 10).map((scheme, index) => (
              <SchemeCard key={scheme.id} scheme={scheme} index={index} />
            ))}
            <div className="flex gap-2">
              <button type="button" onClick={() => navigate("/dashboard")} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Go to Dashboard
              </button>
              <button type="button" onClick={() => navigate("/assistant")} className="rounded-md border px-4 py-2 text-sm font-medium">
                Continue with Assistant
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Onboarding;