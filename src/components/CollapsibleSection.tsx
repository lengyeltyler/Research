import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  aside?: ReactNode;
}

export function CollapsibleSection({ title, subtitle, defaultOpen = false, children, aside }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`collapse-section ${open ? "is-open" : ""}`}>
      <button className="collapse-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <ChevronDown size={16} />
        <span className="collapse-title">
          <strong>{title}</strong>
          {subtitle && <em>{subtitle}</em>}
        </span>
        {aside && <small>{aside}</small>}
      </button>
      <div className="collapse-body">
        <div className="collapse-inner">{children}</div>
      </div>
    </section>
  );
}
