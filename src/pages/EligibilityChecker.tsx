import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SchemeCard, { Scheme } from "@/components/SchemeCard";
import { checkEligibility, getMyProfile, updateMyProfile } from "@/lib/api";
import { getSessionUser, isAuthenticated } from "@/lib/auth";

interface FormData {
  age: string;
  gender: string;
  occupation: string;
  income: string;
  state: string;
  district: string;
  educationLevel: string;
  socialCategory: string;
  residenceType: string;
  maritalStatus: string;
  disabilityStatus: string;
  minorityStatus: string;
}

const incomeRanges = [
  { label: "Below 1 Lakh", value: "75000" },
  { label: "1 - 3 Lakh", value: "200000" },
  { label: "3 - 6 Lakh", value: "450000" },
  { label: "6 - 10 Lakh", value: "800000" },
  { label: "Above 10 Lakh", value: "1200000" },
];

const states = [
  "Andhra Pradesh",
  "Bihar",
  "Delhi",
  "Gujarat",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
];

const EligibilityChecker = () => {
  const [form, setForm] = useState<FormData>({
    age: "",
    gender: "",
    occupation: "",
    income: "",
    state: "",
    district: "",
    educationLevel: "",
    socialCategory: "",
    residenceType: "",
    maritalStatus: "",
    disabilityStatus: "",
    minorityStatus: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [profileMessage, setProfileMessage] = useState<string>("");

  const update = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    const hydrateProfile = async () => {
      const sessionUser = getSessionUser();
      if (sessionUser) {
        setForm((prev) => ({
          ...prev,
          age: sessionUser.age ? String(sessionUser.age) : prev.age,
          gender: sessionUser.gender || prev.gender,
          occupation: sessionUser.occupation || prev.occupation,
          income: sessionUser.income ? String(sessionUser.income) : prev.income,
          state: sessionUser.state || prev.state,
          district: sessionUser.district || prev.district,
          educationLevel: sessionUser.education_level || prev.educationLevel,
          socialCategory: sessionUser.social_category || prev.socialCategory,
          residenceType: sessionUser.residence_type || prev.residenceType,
          maritalStatus: sessionUser.marital_status || prev.maritalStatus,
          disabilityStatus: sessionUser.disability_status || prev.disabilityStatus,
          minorityStatus: sessionUser.minority_status || prev.minorityStatus,
        }));
      }

      if (!isAuthenticated()) return;

      try {
        const profile = await getMyProfile();
        setForm((prev) => ({
          ...prev,
          age: profile.age ? String(profile.age) : prev.age,
          gender: profile.gender || prev.gender,
          occupation: profile.occupation || prev.occupation,
          income: profile.income ? String(profile.income) : prev.income,
          state: profile.state || prev.state,
          district: profile.district || prev.district,
          educationLevel: profile.education_level || prev.educationLevel,
          socialCategory: profile.social_category || prev.socialCategory,
          residenceType: profile.residence_type || prev.residenceType,
          maritalStatus: profile.marital_status || prev.maritalStatus,
          disabilityStatus: profile.disability_status || prev.disabilityStatus,
          minorityStatus: profile.minority_status || prev.minorityStatus,
        }));
      } catch {
        return;
      }
    };

    void hydrateProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setProfileMessage("");

    const eligibilityPayload = {
      age: Number(form.age),
      gender: form.gender,
      occupation: form.occupation,
      income: Number(form.income) || 0,
      state: form.state,
      district: form.district,
      education_level: form.educationLevel,
      social_category: form.socialCategory,
      residence_type: form.residenceType,
      marital_status: form.maritalStatus,
      disability_status: form.disabilityStatus,
      minority_status: form.minorityStatus,
    };

    try {
      const schemes = await checkEligibility(eligibilityPayload);

      if (isAuthenticated()) {
        await updateMyProfile(eligibilityPayload);
        setProfileMessage("Eligibility profile saved to your account.");
      }

      setResults(schemes);
      setSubmitted(true);
    } catch (err) {
      setResults([]);
      setSubmitted(true);
      setError(err instanceof Error ? err.message : "Unable to check eligibility right now.");
    } finally {
      setLoading(false);
    }
  };

  const selectClass =
    "w-full rounded-md border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40";
  const inputClass = selectClass;
  const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

  const matchExplainer = (score?: number) => {
    if (!score) return "Match score is based on your profile and scheme eligibility text.";
    if (score >= 85) return "Strong match: occupation, state, and profile attributes align closely.";
    if (score >= 65) return "Good match: key criteria align, but some optional conditions may differ.";
    return "Basic match: consider refining profile details for more accurate recommendations.";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">Eligibility Checker</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your details to discover schemes you qualify for.
          </p>
          {isAuthenticated() && (
            <p className="mt-3 text-sm text-accent">Your details are saved back into your profile whenever you run a check.</p>
          )}
        </motion.div>

        <div className="mt-10 grid gap-10 lg:grid-cols-5">
          {/* Form */}
          <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 shadow-card lg:col-span-2">
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
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
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                <label className={labelClass}>Occupation</label>
                <select value={form.occupation} onChange={(e) => update("occupation", e.target.value)} className={selectClass} required>
                  <option value="">Select</option>
                  <option>Farmer</option>
                  <option>Student</option>
                  <option>Self-employed</option>
                  <option>Salaried</option>
                  <option>Unemployed</option>
                  <option>Homemaker</option>
                  <option>Senior Citizen</option>
                </select>
                </div>
                <div>
                <label className={labelClass}>Annual Income Range</label>
                <select value={form.income} onChange={(e) => update("income", e.target.value)} className={selectClass} required>
                  <option value="">Select</option>
                  {incomeRanges.map((range) => (
                    <option key={range.label} value={range.value}>{range.label}</option>
                  ))}
                </select>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                <label className={labelClass}>State</label>
                <select value={form.state} onChange={(e) => update("state", e.target.value)} className={selectClass} required>
                  <option value="">Select</option>
                  {states.map((state) => (
                    <option key={state}>{state}</option>
                  ))}
                </select>
                </div>
                <div>
                <label className={labelClass}>District</label>
                <input value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="e.g. Pune" className={inputClass} required />
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Additional Filters</p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Education Level</label>
                    <select value={form.educationLevel} onChange={(e) => update("educationLevel", e.target.value)} className={selectClass}>
                      <option value="">Select</option>
                      <option>School Student</option>
                      <option>Graduate</option>
                      <option>Postgraduate</option>
                      <option>ITI / Diploma</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Social Category</label>
                    <select value={form.socialCategory} onChange={(e) => update("socialCategory", e.target.value)} className={selectClass}>
                      <option value="">Select</option>
                      <option>General</option>
                      <option>OBC</option>
                      <option>SC</option>
                      <option>ST</option>
                      <option>EWS</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Residence Type</label>
                    <select value={form.residenceType} onChange={(e) => update("residenceType", e.target.value)} className={selectClass}>
                      <option value="">Select</option>
                      <option>Urban</option>
                      <option>Rural</option>
                      <option>Semi-urban</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Marital Status</label>
                    <select value={form.maritalStatus} onChange={(e) => update("maritalStatus", e.target.value)} className={selectClass}>
                      <option value="">Select</option>
                      <option>Single</option>
                      <option>Married</option>
                      <option>Widowed</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Disability Status</label>
                    <select value={form.disabilityStatus} onChange={(e) => update("disabilityStatus", e.target.value)} className={selectClass}>
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Minority Community</label>
                    <select value={form.minorityStatus} onChange={(e) => update("minorityStatus", e.target.value)} className={selectClass}>
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {loading ? "Checking..." : "Check Eligibility"}
            </button>
          </form>

          {/* Results */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Eligible Schemes ({results.length})
                </h2>
                {profileMessage && <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">{profileMessage}</div>}
                {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
                {!error && results.length === 0 && (
                  <div className="rounded-lg border border-border/60 bg-card px-4 py-6 text-sm text-muted-foreground">
                    No schemes matched this profile yet. Try broadening the filters or changing the occupation and income range.
                  </div>
                )}
                {results
                  .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
                  .map((s, i) => (
                    <div key={s.id} className="space-y-2">
                      <div className="rounded-md border border-accent/20 bg-accent/5 px-3 py-2 text-xs text-foreground/80">
                        {matchExplainer(s.matchScore)}
                      </div>
                      <SchemeCard scheme={s} index={i} />
                    </div>
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
      </main>
      <Footer />
    </div>
  );
};

export default EligibilityChecker;
