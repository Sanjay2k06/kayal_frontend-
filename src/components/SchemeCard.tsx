import { motion } from "framer-motion";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export interface Scheme {
  id: string;
  name: string;
  eligibility: string;
  benefits: string;
  documents: string[];
  applyLink: string;
  matchScore?: number;
  category?: string;
  incomeGroup?: string;
}

interface SchemeCardProps {
  scheme: Scheme;
  index?: number;
}

const SchemeCard = ({ scheme, index = 0 }: SchemeCardProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="overflow-hidden rounded-lg border bg-card shadow-card"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-display text-lg font-semibold text-foreground">
              {scheme.name}
            </h3>
            {scheme.category && (
              <span className="mt-1 inline-block rounded-sm bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {scheme.category}
              </span>
            )}
          </div>
          {scheme.matchScore !== undefined && (
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent bg-accent/10">
                <span className="text-sm font-bold text-accent">{scheme.matchScore}%</span>
              </div>
              <span className="mt-1 text-[10px] text-muted-foreground">Match</span>
            </div>
          )}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-foreground/80">{scheme.benefits}</p>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent/80"
        >
          {expanded ? "Hide details" : "View details"}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          className="border-t bg-background/30 px-5 pb-5 pt-4"
        >
          <div className="mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Eligibility
            </h4>
            <p className="mt-1 text-sm text-foreground/80">{scheme.eligibility}</p>
          </div>
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Required Documents
            </h4>
            <ul className="mt-1 space-y-1">
              {scheme.documents.map((doc) => (
                <li key={doc} className="text-sm text-foreground/80">
                  &mdash; {doc}
                </li>
              ))}
            </ul>
          </div>
          <a
            href={scheme.applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Apply Now <ExternalLink size={14} />
          </a>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SchemeCard;
