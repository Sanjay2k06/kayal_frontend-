import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Brain, Mic, ClipboardCheck, Globe, Sparkles } from "lucide-react";
import { useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { isAuthenticated } from "@/lib/auth";

const features = [
  {
    icon: Brain,
    title: "AI Scheme Discovery",
    description: "Intelligent profile analysis across thousands of government schemes to surface perfect matches.",
  },
  {
    icon: Mic,
    title: "Voice Query Support",
    description: "Speak naturally in any language. Our engine transcribes and processes your input in real time.",
  },
  {
    icon: ClipboardCheck,
    title: "Eligibility Checker",
    description: "One-time profile entry. Instant ranked results showing your qualification percentage.",
  },
  {
    icon: Globe,
    title: "Multilingual Support",
    description: "Full support for major Indian languages, ensuring inclusive access for every citizen.",
  },
];

const exampleQueries = [
  "What schemes are available for farmers in Maharashtra?",
  "Am I eligible for PM Awas Yojana with an income of 2 lakh?",
  "Show me education scholarships for girls in Karnataka",
  "What health insurance schemes exist for BPL families?",
];

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const Index = () => {
  const authed = isAuthenticated();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">

      {/* Hero */}
      <section ref={heroRef} className="grain-overlay relative overflow-hidden py-28 lg:py-40">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-accent/10 blur-[100px]" />
        <div className="pointer-events-none absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-accent/8 blur-[120px]" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="container relative z-10 mx-auto px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-5 py-2 text-xs font-medium tracking-wide text-muted-foreground backdrop-blur-sm"
            >
              <Sparkles size={12} className="text-accent" />
              AI-Powered Civic Intelligence
            </motion.span>

            <h1 className="mx-auto mt-8 max-w-4xl font-display text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Find Government Schemes
              <br />
              You Are Eligible For{" "}
              <motion.span
                className="relative inline-block text-accent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                Instantly
                <motion.span
                  className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-accent/50"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
                  style={{ originX: 0 }}
                />
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg"
            >
              CiviX uses artificial intelligence to match citizens with relevant
              government welfare schemes, simplifying discovery and eligibility verification.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link
                to={authed ? "/assistant" : "/auth"}
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-elevated transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
              >
                Start Assistant
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                to={authed ? "/eligibility" : "/auth"}
                className="inline-flex items-center gap-2 rounded-xl border bg-card/60 px-8 py-4 text-sm font-semibold text-foreground backdrop-blur-sm transition-all duration-300 hover:bg-card hover:shadow-card"
              >
                Check Eligibility
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative py-24 lg:py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Platform Capabilities
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
              How CiviX Works
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              A structured, intelligent approach to welfare scheme discovery.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group rounded-xl border bg-card p-7 shadow-card transition-shadow duration-300 hover:shadow-elevated"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/12 transition-colors duration-300 group-hover:bg-accent/20">
                  <f.icon size={22} className="text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Example Queries */}
      <section className="relative py-24 lg:py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Get Started
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
              Try Asking CiviX
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
            className="mx-auto mt-12 grid max-w-2xl gap-3"
          >
            {exampleQueries.map((q) => (
              <motion.div key={q} variants={fadeUp}>
                <Link
                  to={authed ? "/assistant" : "/auth"}
                  className="group flex items-center gap-4 rounded-xl border bg-card px-6 py-5 text-sm text-foreground transition-all duration-300 hover:bg-card/80 hover:shadow-card"
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent/12">
                    <Sparkles size={14} className="text-accent" />
                  </span>
                  <span className="flex-1 font-medium">&ldquo;{q}&rdquo;</span>
                  <ArrowRight size={14} className="text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
