import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  onSelectSuggestion?: (value: string) => void;
}

const SearchBar = ({ value, onChange, placeholder = "Search schemes...", suggestions = [], onSelectSuggestion }: SearchBarProps) => (
  <div className="relative">
    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
    />
    {suggestions.length > 0 && (
      <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-card shadow-card">
        {suggestions.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => onSelectSuggestion?.(item)}
            className="block w-full border-b px-3 py-2 text-left text-sm text-foreground last:border-b-0 hover:bg-muted"
          >
            {item}
          </button>
        ))}
      </div>
    )}
  </div>
);

export default SearchBar;
