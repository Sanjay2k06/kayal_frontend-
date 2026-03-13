interface FilterPanelProps {
  filters: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

const options: Record<string, string[]> = {
  category: ["All", "Agriculture", "Education", "Health", "Housing", "Employment"],
  incomeGroup: ["All", "Below Poverty Line", "Low Income", "Middle Income"],
  gender: ["All", "Male", "Female", "Other"],
  state: ["All", "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "Delhi"],
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
