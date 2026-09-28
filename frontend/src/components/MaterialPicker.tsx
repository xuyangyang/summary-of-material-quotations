import { useEffect, useMemo, useState } from "react";
import type { MaterialGroup } from "../api";

interface MaterialPickerProps {
  groups: MaterialGroup[];
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
}

export default function MaterialPicker({
  groups,
  value,
  onChange,
  placeholder = "输入材料名称或规格",
}: MaterialPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = groups.find((group) => group.id === value);

  useEffect(() => {
    if (value !== null && query === "" && selected) {
      setQuery(`${selected.material_name} · ${selected.spec || "无规格"}`);
    }
  }, [value, selected]);

  const matches = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return [];
    }
    return groups
      .filter(
        (group) =>
          group.material_name.toLowerCase().includes(keyword) ||
          (group.spec || "").toLowerCase().includes(keyword),
      )
      .slice(0, 50);
  }, [groups, query]);

  function choose(group: MaterialGroup) {
    onChange(group.id);
    setQuery(`${group.material_name} · ${group.spec || "无规格"}`);
    setOpen(false);
  }

  return (
    <div className="material-picker">
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        placeholder={placeholder}
      />
      {query && (
        <button
          type="button"
          className="input-clear"
          aria-label="清空"
          onClick={() => {
            setQuery("");
            onChange(null);
            setOpen(true);
          }}
        >
          ×
        </button>
      )}
      {open && matches.length > 0 && (
        <ul className="material-picker-list">
          {matches.map((group) => (
            <li key={group.id}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(group);
                }}
              >
                <span>
                  {group.material_name} · {group.spec || "无规格"}
                </span>
                <em>{group.record_count} 条</em>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
