import type { VariantAttributeDefinition, VariantAttributeKind } from "./types";

export type AttributePreset = {
  name: string;
  kind: VariantAttributeKind;
  values: string[];
};

function genAttrId() {
  return `attr_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

/**
 * Category-normalised (lowercased, trimmed) → default attribute presets.
 *
 * Vendors can still add / remove / rename values and attributes; these are
 * merely suggestions injected when a product has no backend attributes yet.
 */
export const CATEGORY_ATTRIBUTE_PRESETS: Record<string, AttributePreset[]> = {
  clothes: [
    {
      name: "Color",
      kind: "color",
      values: ["Red", "Yellow", "Blue", "Green", "Black", "White", "Pink", "Gray"],
    },
    {
      name: "Size",
      kind: "size",
      values: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
    },
    {
      name: "Material",
      kind: "custom",
      values: ["Cotton", "Polyester", "Wool", "Silk", "Linen", "Denim"],
    },
  ],
  shoes: [
    {
      name: "Color",
      kind: "color",
      values: ["Black", "Brown", "White", "Red", "Blue", "Gray", "Beige"],
    },
    {
      name: "Size",
      kind: "size",
      values: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
    },
    {
      name: "Material",
      kind: "custom",
      values: ["Leather", "Synthetic", "Suede", "Canvas", "Mesh"],
    },
  ],
  electronics: [
    {
      name: "Color",
      kind: "color",
      values: ["Black", "White", "Silver", "Gold", "Rose Gold", "Blue"],
    },
    {
      name: "Storage",
      kind: "custom",
      values: ["64GB", "128GB", "256GB", "512GB", "1TB"],
    },
    {
      name: "RAM",
      kind: "custom",
      values: ["4GB", "6GB", "8GB", "12GB", "16GB", "32GB"],
    },
  ],
  furniture: [
    {
      name: "Color",
      kind: "color",
      values: ["White", "Black", "Brown", "Beige", "Gray", "Walnut", "Oak"],
    },
    {
      name: "Material",
      kind: "custom",
      values: ["Wood", "Metal", "Plastic", "Glass", "Fabric", "Leather"],
    },
    {
      name: "Size",
      kind: "size",
      values: ["Small", "Medium", "Large", "Extra Large"],
    },
  ],
  "home & kitchen": [
    {
      name: "Color",
      kind: "color",
      values: ["White", "Black", "Red", "Blue", "Green", "Yellow", "Gray"],
    },
    {
      name: "Material",
      kind: "custom",
      values: ["Stainless Steel", "Ceramic", "Glass", "Plastic", "Wood", "Silicone"],
    },
  ],
  beauty: [
    {
      name: "Color / Shade",
      kind: "color",
      values: ["Natural", "Pink", "Red", "Nude", "Coral", "Berry", "Plum"],
    },
    {
      name: "Size",
      kind: "size",
      values: ["Travel", "Regular", "Family", "Jumbo"],
    },
  ],
  jewelry: [
    {
      name: "Metal",
      kind: "custom",
      values: ["Gold", "Silver", "Rose Gold", "Platinum", "Stainless Steel"],
    },
    {
      name: "Gemstone",
      kind: "custom",
      values: ["Diamond", "Ruby", "Sapphire", "Emerald", "Pearl", "Amethyst", "None"],
    },
    {
      name: "Size",
      kind: "size",
      values: ["S", "M", "L", "Adjustable"],
    },
  ],
  accessories: [
    {
      name: "Color",
      kind: "color",
      values: ["Black", "Brown", "White", "Red", "Blue", "Beige", "Tan"],
    },
    {
      name: "Material",
      kind: "custom",
      values: ["Leather", "Canvas", "Nylon", "Metal", "Plastic"],
    },
  ],
  toys: [
    {
      name: "Color",
      kind: "color",
      values: ["Red", "Blue", "Yellow", "Green", "Pink", "Purple", "Multi"],
    },
    {
      name: "Age Group",
      kind: "custom",
      values: ["0-2", "3-5", "6-8", "9-12", "13+"],
    },
  ],
  sports: [
    {
      name: "Color",
      kind: "color",
      values: ["Black", "White", "Red", "Blue", "Green", "Yellow", "Orange"],
    },
    {
      name: "Size",
      kind: "size",
      values: ["S", "M", "L", "XL", "One Size"],
    },
  ],
  books: [
    {
      name: "Format",
      kind: "custom",
      values: ["Hardcover", "Paperback", "E-book", "Audiobook"],
    },
    {
      name: "Language",
      kind: "custom",
      values: ["English", "French", "Spanish", "German", "Chinese", "Arabic"],
    },
  ],
  food: [
    {
      name: "Flavor",
      kind: "custom",
      values: ["Original", "Chocolate", "Vanilla", "Strawberry", "Mint", "Caramel"],
    },
    {
      name: "Size",
      kind: "size",
      values: ["Small", "Medium", "Large", "Family Pack"],
    },
  ],
};

export function resolvePresetAttributes(
  categoryNames: string[]
): VariantAttributeDefinition[] {
  const seenNames = new Set<string>();
  const result: VariantAttributeDefinition[] = [];

  for (const rawName of categoryNames) {
    const key = rawName.trim().toLowerCase();
    const presets = CATEGORY_ATTRIBUTE_PRESETS[key];
    if (!presets) continue;

    for (const preset of presets) {
      if (seenNames.has(preset.name.toLowerCase())) continue;
      seenNames.add(preset.name.toLowerCase());

      result.push({
        id: genAttrId(),
        name: preset.name,
        kind: preset.kind,
        values: [...preset.values],
        valueIdMap: {},
      });
    }
  }

  return result;
}
