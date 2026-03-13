import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Brain, Mic, ClipboardCheck, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const features = [
  {
    icon: Brain,
    title: "AI Scheme Discovery",
    description: "Our intelligent assistant analyzes your profile against thousands of government schemes to find perfect matches.",
  },
  {
    icon: Mic,
    title: "Voice Query Support",
    description: "Simply speak your query in any language. Our system transcribes and processes your voice input seamlessly.",
  },
  {
    icon: ClipboardCheck,
    title: "Eligibility Checker",
    description: "Enter your details once and instantly see which schemes you qualify for, ranked by match percentage.",
  },
  {
    icon: Globe,
    title: "Multilingual Support",
    description: "Access information in your preferred language. CiviX supports major Indian languages for inclusive access.",
  },
];

const exampleQueries = [
  "What schemes are available for farmers in Maharashtra?",
  "Am I eligible for PM Awas Yojana with an income of 2 lakh?",
  "Show me education scholarships for girls in Karnataka",
  "What health insurance schemes exist for BPL families?",
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-36">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/40" />
        <div className="container relative mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span className="inline-block rounded-full border bg-card px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground">
              AI-Powered Civic Intelligence
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Find Government Schemes You Are Eligible For{" "}
              <span className="text-accent">Instantly with AI</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              CiviX uses artificial intelligence to match citizens with relevant government welfare schemes, simplifying discovery and eligibility verification.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/assistant"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-elevated"
              >
                Start Assistant <ArrowRight size={16} />
              </Link>
              <Link
                to="/eligibility"
                className="inline-flex items-center gap-2 rounded-lg border bg-card px-8 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Check Eligibility
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center font-display text-3xl font-bold text-foreground"
          >
            How CiviX Works
          </motion.h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            A structured, intelligent approach to welfare scheme discovery.
          </p>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-lg border bg-card p-6 shadow-card transition-shadow hover:shadow-elevated"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-accent/15">
                  <f.icon size={20} className="text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Queries */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center font-display text-3xl font-bold text-foreground"
          >
            Try Asking CiviX
          </motion.h2>
          <div className="mx-auto mt-10 grid max-w-2xl gap-3">
            {exampleQueries.map((q, i) => (
              <motion.div
                key={q}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <Link
                  to="/assistant"
                  className="block rounded-lg border bg-card px-5 py-4 text-sm text-foreground transition-all hover:bg-muted hover:shadow-card"
                >
                  &ldquo;{q}&rdquo;
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
