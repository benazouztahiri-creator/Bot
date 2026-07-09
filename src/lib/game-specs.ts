export type FieldType = "text" | "number" | "select" | "textarea";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  displayPriority: number;
  searchable?: boolean;
  filterable?: boolean;
  unit?: string;
};

export type GameSpec = {
  id: string;
  name: string;
  icon: string;
  productType: "account" | "recharge";
  fields: FieldDef[];
};

export const GAME_SPECS: Record<string, GameSpec> = {
  pubg: {
    id: "pubg",
    name: "PUBG",
    icon: "🎯",
    productType: "account",
    fields: [
      { key: "account_id", label: "ID الحساب", type: "text", required: true, placeholder: "أدخل معرف الحساب", displayPriority: 1, searchable: true },
      { key: "level", label: "المستوى", type: "number", required: true, placeholder: "مستوى الحساب", displayPriority: 2, searchable: true, filterable: true, min: 1 },
      { key: "gold_skins_count", label: "السكنات الذهبية", type: "number", required: false, placeholder: "عدد السكنات الذهبية", displayPriority: 3, filterable: true, min: 0 },
      { key: "outfits_count", label: "البذلات", type: "number", required: false, placeholder: "عدد البذلات", displayPriority: 4, filterable: true, min: 0 },
      { key: "weapons_count", label: "الأسلحة", type: "number", required: false, placeholder: "عدد الأسلحة", displayPriority: 5, filterable: true, min: 0 },
      { key: "vehicles_count", label: "السيارات", type: "number", required: false, placeholder: "عدد السيارات", displayPriority: 6, filterable: true, min: 0 },
    ],
  },
  "free-fire": {
    id: "free-fire",
    name: "Free Fire",
    icon: "🔥",
    productType: "account",
    fields: [
      { key: "account_id", label: "ID الحساب", type: "text", required: true, placeholder: "أدخل معرف الحساب", displayPriority: 1, searchable: true },
      { key: "level", label: "المستوى", type: "number", required: true, placeholder: "مستوى الحساب", displayPriority: 2, searchable: true, filterable: true, min: 1 },
      { key: "characters_count", label: "عدد الشخصيات", type: "number", required: false, placeholder: "عدد الشخصيات", displayPriority: 3, min: 0 },
      { key: "skins_count", label: "عدد السكنات", type: "number", required: false, placeholder: "عدد السكنات", displayPriority: 4, filterable: true, min: 0 },
      { key: "diamonds", label: "عدد الألماس", type: "number", required: false, placeholder: "عدد الألماس", displayPriority: 5, filterable: true, min: 0 },
      { key: "pets_count", label: "عدد الحيوانات", type: "number", required: false, placeholder: "عدد الحيوانات الأليفة", displayPriority: 6, min: 0 },
    ],
  },
  topup: {
    id: "topup",
    name: "Top-up",
    icon: "⚡",
    productType: "recharge",
    fields: [
      { key: "service_type", label: "نوع الخدمة", type: "select", required: true, options: [
        { value: "uc", label: "UC (PUBG)" },
        { value: "diamonds", label: "Diamonds (Free Fire)" },
        { value: "mlbb", label: "Diamonds (MLBB)" },
      ], displayPriority: 1 },
      { key: "server_id", label: "ID السيرفر", type: "text", required: true, placeholder: "أدخل معرف السيرفر", displayPriority: 2, searchable: true },
      { key: "character_id", label: "ID الشخصية", type: "text", required: true, placeholder: "أدخل معرف الشخصية", displayPriority: 3, searchable: true },
      { key: "quantity", label: "الكمية", type: "number", required: true, placeholder: "الكمية المطلوبة", displayPriority: 4, filterable: true, min: 1 },
    ],
  },
};

export function getGameSpec(category: string): GameSpec | null {
  return GAME_SPECS[category] || null;
}

export function getGameSpecs(): GameSpec[] {
  return Object.values(GAME_SPECS);
}

export function validateAttributes(category: string, attributes: Record<string, unknown>): string[] {
  const spec = getGameSpec(category);
  if (!spec) return ["نوع اللعبة غير معروف"];

  const errors: string[] = [];
  for (const field of spec.fields) {
    const value = attributes[field.key];
    if (field.required && (value === undefined || value === null || value === "")) {
      errors.push(`الحقل "${field.label}" مطلوب`);
      continue;
    }
    if (value !== undefined && value !== null && value !== "") {
      if (field.type === "number") {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`الحقل "${field.label}" يجب أن يكون رقمًا`);
        } else {
          if (field.min !== undefined && num < field.min) {
            errors.push(`الحقل "${field.label}" أقل قيمة هي ${field.min}`);
          }
          if (field.max !== undefined && num > field.max) {
            errors.push(`الحقل "${field.label}" أكبر قيمة هي ${field.max}`);
          }
        }
      }
      if (field.type === "select" && field.options) {
        const valid = field.options.some((o) => o.value === value);
        if (!valid) {
          errors.push(`القيمة "${value}" غير صالحة للحقل "${field.label}"`);
        }
      }
    }
  }
  return errors;
}

export function renderFieldValue(field: FieldDef, value: unknown): string {
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
