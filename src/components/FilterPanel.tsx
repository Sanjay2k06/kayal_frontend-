interface FilterPanelProps {
  filters: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

const options: Record<string, string[]> = {
  category: ["All", "Agriculture", "Education", "Healthcare", "Housing", "Employment", "Women Empowerment", "Social Welfare"],
  incomeGroup: ["All", "Below 1 Lakh", "1 - 3 Lakh", "3 - 6 Lakh", "6 - 10 Lakh", "Above 10 Lakh"],
  occupation: ["All", "Student", "Employee", "Farmer", "Self-employed", "Job seeker", "Homemaker", "Senior Citizen"],
  state: ["All", "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "Delhi", "Gujarat", "Telangana", "West Bengal"],
};

const FilterPanel = ({ filters, onChange }: FilterPanelProps) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {Object.entries(options).map(([key, values]) => (
      <div key={key}>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {key === "incomeGroup" ? "Income Group" : key.charAt(0).toUpperCase() + key.slice(1)}
        </label>
        <select
          value={filters[key] || "All"}
          onChange={(e) => onChange(key, e.target.value)}
          className="w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          {values.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>
    ))}
  </div>
);

export default FilterPanel;
