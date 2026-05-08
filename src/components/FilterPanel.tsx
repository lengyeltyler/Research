import { Filter } from "lucide-react";

export interface GraphFilters {
  hideArchived: boolean;
  onlyDisputed: boolean;
  onlyQuestions: boolean;
  onlyClaims: boolean;
  hideGhosts: boolean;
  hideSources: boolean;
  verifiedOnly: boolean;
}

interface Props {
  filters: GraphFilters;
  onChange: (filters: GraphFilters) => void;
}

const labels: Array<[keyof GraphFilters, string]> = [
  ["hideArchived", "hide archived"],
  ["onlyDisputed", "only disputed"],
  ["onlyQuestions", "only questions"],
  ["onlyClaims", "only claims"],
  ["hideGhosts", "hide ghost nodes"],
  ["hideSources", "hide source nodes"],
  ["verifiedOnly", "show verified only"]
];

export function FilterPanel({ filters, onChange }: Props) {
  return (
    <section className="filter-panel">
      <span><Filter size={14} /> Filters</span>
      {labels.map(([key, label]) => (
        <label key={key}>
          <input type="checkbox" checked={filters[key]} onChange={(event) => onChange({ ...filters, [key]: event.target.checked })} />
          {label}
        </label>
      ))}
    </section>
  );
}
