import { Filter } from "lucide-react";
import { researchCategories, type ResearchCategory } from "../lib/types";

export interface GraphFilters {
  hideArchived: boolean;
  onlyDisputed: boolean;
  onlyQuestions: boolean;
  onlyClaims: boolean;
  hideGhosts: boolean;
  hideSources: boolean;
  verifiedOnly: boolean;
  category: "" | ResearchCategory;
}

interface Props {
  filters: GraphFilters;
  onChange: (filters: GraphFilters) => void;
}

type BooleanFilterKey = Exclude<keyof GraphFilters, "category">;

const labels: Array<[BooleanFilterKey, string]> = [
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
      <label>
        Category
        <select value={filters.category} onChange={(event) => onChange({ ...filters, category: event.target.value as GraphFilters["category"] })}>
          <option value="">all</option>
          {researchCategories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </label>
    </section>
  );
}
