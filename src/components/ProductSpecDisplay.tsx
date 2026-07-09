"use client";

import { getGameSpec, type FieldDef } from "@/lib/game-specs";

export default function ProductSpecDisplay({
  category,
  attributes,
}: {
  category: string;
  attributes?: Record<string, unknown>;
}) {
  const spec = getGameSpec(category);
  if (!spec || !attributes) return null;

  const validFields = spec.fields.filter((f) => {
    const val = attributes[f.key];
    return val !== undefined && val !== null && val !== "";
  });

  if (validFields.length === 0) return null;

  function renderValue(field: FieldDef, value: unknown): string {
    if (value === undefined || value === null || value === "") return "-";
    if (field.type === "select" && field.options) {
      const opt = field.options.find((o) => o.value === value);
      return opt?.label || String(value);
    }
    if (field.type === "number" && field.unit) {
      return `${value} ${field.unit}`;
    }
    return String(value);
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {validFields.map((field) => (
        <div key={field.key} className="spec-card">
          <div className="spec-value">{renderValue(field, attributes[field.key])}</div>
          <div className="spec-label">{field.label}</div>
        </div>
      ))}
    </div>
  );
}
