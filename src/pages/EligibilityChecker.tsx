import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SchemeCard, { Scheme } from "@/components/SchemeCard";
import { checkEligibility, getMyProfile, runHeroSimulation, updateMyProfile } from "@/lib/api";
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
  const [heroIncome, setHeroIncome] = useState<string>("");
  const [heroState, setHeroState] = useState<string>("");
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroError, setHeroError] = useState("");
  const [heroResult, setHeroResult] = useState<{
    summary: string;
    simulated_top_schemes: Array<{
      scheme: Scheme;
      base_score: number;
      simulated_score: number;
      score_delta: number;
      success_probability: number;
      missing_documents: string[];
      action_plan: string[];
    }>;
  } | null>(null);

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

  const runDemoStory = async () => {
    const demoForm: FormData = {
      age: "28",
      gender: "Female",
      occupation: "Student",
      income: "200000",
      state: "Maharashtra",
      district: "Pune",
      educationLevel: "Graduate",
      socialCategory: "OBC",
      residenceType: "Urban",
      maritalStatus: "Single",
      disabilityStatus: "no",
      minorityStatus: "no",
    };

    setForm(demoForm);
    setHeroIncome("75000");
    setHeroState("Maharashtra");
    setLoading(true);
    setHeroLoading(true);
    setError("");
    setHeroError("");
    setProfileMessage("Demo story is running with a sample student profile.");

    const baselineProfile = {
      age: Number(demoForm.age),
      gender: demoForm.gender,
      occupation: demoForm.occupation,
      income: Number(demoForm.income),
      state: demoForm.state,
      district: demoForm.district,
      education_level: demoForm.educationLevel,
      social_category: demoForm.socialCategory,
      residence_type: demoForm.residenceType,
      marital_status: demoForm.maritalStatus,
      disability_status: demoForm.disabilityStatus,
      minority_status: demoForm.minorityStatus,
    };

    const whatIfProfile = {
      ...baselineProfile,
      income: 75000,
      state: "Maharashtra",
    };

    try {
      const [schemes, hero] = await Promise.all([
        checkEligibility(baselineProfile),
        runHeroSimulation({ profile: baselineProfile, what_if: whatIfProfile }),
      ]);

      setResults(schemes);
      setSubmitted(true);
      setHeroResult({ summary: hero.summary, simulated_top_schemes: hero.simulated_top_schemes });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run demo story.");
      setHeroError("Hero simulation failed for demo story.");
    } finally {
      setLoading(false);
      setHeroLoading(false);
    }
  };

  const runHeroFlow = async () => {
    setHeroLoading(true);
    setHeroError("");
    setHeroResult(null);

    const baselineProfile = {
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

    const whatIfProfile = {
      ...baselineProfile,
      income: Number(heroIncome) || baselineProfile.income,
      state: heroState || baselineProfile.state,
    };

    try {
      const data = await runHeroSimulation({ profile: baselineProfile, what_if: whatIfProfile });
      setHeroResult({ summary: data.summary, simulated_top_schemes: data.simulated_top_schemes });
    } catch (err) {
      setHeroError(err instanceof Error ? err.message : "Unable to run hero simulation.");
    } finally {
      setHeroLoading(false);
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

                <div className="mt-8 rounded-lg border border-border/60 bg-card p-5">
                  <h3 className="font-display text-lg font-semibold text-foreground">Hero Feature: What-if + Success Predictor + Action Plan</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Simulate profile changes and see which schemes improve, your estimated success probability, and next-best actions.
                  </p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>What-if Income (optional)</label>
                      <select value={heroIncome} onChange={(e) => setHeroIncome(e.target.value)} className={selectClass}>
                        <option value="">Use current</option>
                        {incomeRanges.map((range) => (
                          <option key={`hero-${range.label}`} value={range.value}>{range.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>What-if State (optional)</label>
                      <select value={heroState} onChange={(e) => setHeroState(e.target.value)} className={selectClass}>
                        <option value="">Use current</option>
                        {states.map((state) => (
                          <option key={`hero-${state}`}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void runHeroFlow()}
                    disabled={heroLoading || !form.age || !form.gender || !form.occupation || !form.income || !form.state}
                    className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
                  >
                    {heroLoading ? "Running Hero Simulation..." : "Run Hero Simulation"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void runDemoStory()}
                    disabled={heroLoading || loading}
                    className="ml-2 mt-4 rounded-md border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    Run Demo Story (1-click)
                  </button>

                  {heroError && <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{heroError}</div>}

                  {heroResult && (
                    <div className="mt-4 space-y-4">
                      <div className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-foreground/90">{heroResult.summary}</div>
                      {heroResult.simulated_top_schemes.map((rec) => (
                        <div key={`hero-${rec.scheme.id}`} className="rounded-md border bg-background/60 p-4">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>Base: {rec.base_score}%</span>
                            <span>Simulated: {rec.simulated_score}%</span>
                            <span className={rec.score_delta >= 0 ? "text-green-700" : "text-destructive"}>Delta: {rec.score_delta >= 0 ? "+" : ""}{rec.score_delta}%</span>
                            <span className="font-semibold text-foreground/80">Success: {rec.success_probability}%</span>
                          </div>
                          <div className="mt-2">
                            <SchemeCard scheme={rec.scheme} />
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documents missing</p>
                              {rec.missing_documents.length > 0 ? (
                                <ul className="mt-1 space-y-1 text-sm text-foreground/80">
                                  {rec.missing_documents.map((doc) => <li key={doc}>- {doc}</li>)}
                                </ul>
                              ) : (
                                <p className="mt-1 text-sm text-foreground/80">No major document gaps detected.</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action plan</p>
                              <ol className="mt-1 space-y-1 text-sm text-foreground/80">
                                {rec.action_plan.map((step) => <li key={step}>- {step}</li>)}
                              </ol>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
