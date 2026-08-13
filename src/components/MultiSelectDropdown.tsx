import { useEffect, useRef, useState } from "react";

export interface MultiSelectOption {
  id: number;
  label: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: MultiSelectOption[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export function MultiSelectDropdown({ label, options, selectedIds, onChange }: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
  const allSelected = options.length > 0 && selectedIds.length === options.length;

  function toggle(id: number) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]);
  }

  const summary = allSelected
    ? `${label}: All`
    : selectedIds.length === 0
      ? `${label}: None`
      : `${label}: ${selectedIds.length}/${options.length}`;

  return (
    <div className="multiselect" ref={containerRef}>
      <button type="button" className="multiselect-trigger" onClick={() => setOpen((v) => !v)}>
        {summary}
        <span className="multiselect-caret">▾</span>
      </button>
      {open && (
        <div className="multiselect-panel">
          <input
            className="multiselect-search"
            placeholder={`Search ${label.toLowerCase()}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="multiselect-actions">
            <button type="button" className="link-button" onClick={() => onChange(options.map((o) => o.id))}>
              Select all
            </button>
            <button type="button" className="link-button" onClick={() => onChange([])}>
              Clear
            </button>
          </div>
          <div className="multiselect-list">
            {filtered.length === 0 && <p className="muted">No matches</p>}
            {filtered.map((o) => (
              <label key={o.id} className="source-checkbox">
                <input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => toggle(o.id)} />
                {o.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
