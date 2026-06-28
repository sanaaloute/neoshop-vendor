import type { Category } from "@/services/vendor/categories-api";

import type { VariantAttributeDefinition, VariantAttributeKind } from "./types";

export type AttributePreset = {
  name: string;
  kind: VariantAttributeKind;
  values: string[];
};

function genAttrId() {
  return `attr_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Category-normalised (lowercased, trimmed) -> default attribute presets.
 *
 * Vendors can still add / remove / rename values and attributes; these are
 * merely suggestions injected when a product has no backend attributes yet.
 */
export const CATEGORY_ATTRIBUTE_PRESETS: Record<string, AttributePreset[]> = {
  // Apparel
  clothes: [
    { name: "Color", kind: "color", values: ["Red", "Yellow", "Blue", "Green", "Black", "White", "Pink", "Gray"] },
    { name: "Size", kind: "size", values: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
    { name: "Material", kind: "custom", values: ["Cotton", "Polyester", "Wool", "Silk", "Linen", "Denim"] },
  ],
  clothing: [
    { name: "Color", kind: "color", values: ["Red", "Yellow", "Blue", "Green", "Black", "White", "Pink", "Gray"] },
    { name: "Size", kind: "size", values: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
    { name: "Material", kind: "custom", values: ["Cotton", "Polyester", "Wool", "Silk", "Linen", "Denim"] },
  ],
  apparel: [
    { name: "Color", kind: "color", values: ["Red", "Yellow", "Blue", "Green", "Black", "White", "Pink", "Gray"] },
    { name: "Size", kind: "size", values: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
    { name: "Material", kind: "custom", values: ["Cotton", "Polyester", "Wool", "Silk", "Linen", "Denim"] },
  ],
  "men's clothing": [
    { name: "Color", kind: "color", values: ["Black", "White", "Navy", "Gray", "Blue", "Red", "Green"] },
    { name: "Size", kind: "size", values: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
  ],
  "women's clothing": [
    { name: "Color", kind: "color", values: ["Black", "White", "Red", "Pink", "Blue", "Green", "Yellow"] },
    { name: "Size", kind: "size", values: ["XS", "S", "M", "L", "XL", "XXL"] },
  ],
  "kids' clothing": [
    { name: "Color", kind: "color", values: ["Red", "Blue", "Yellow", "Green", "Pink", "Purple"] },
    { name: "Size", kind: "size", values: ["2T", "3T", "4T", "5T", "6", "7", "8", "10", "12", "14"] },
  ],

  // Footwear
  shoes: [
    { name: "Color", kind: "color", values: ["Black", "Brown", "White", "Red", "Blue", "Gray", "Beige"] },
    { name: "Size", kind: "size", values: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"] },
    { name: "Material", kind: "custom", values: ["Leather", "Synthetic", "Suede", "Canvas", "Mesh"] },
  ],
  footwear: [
    { name: "Color", kind: "color", values: ["Black", "Brown", "White", "Red", "Blue", "Gray", "Beige"] },
    { name: "Size", kind: "size", values: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"] },
    { name: "Material", kind: "custom", values: ["Leather", "Synthetic", "Suede", "Canvas", "Mesh"] },
  ],
  sneakers: [
    { name: "Color", kind: "color", values: ["Black", "White", "Red", "Blue", "Gray", "Green"] },
    { name: "Size", kind: "size", values: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"] },
  ],
  boots: [
    { name: "Color", kind: "color", values: ["Black", "Brown", "Tan", "Gray"] },
    { name: "Size", kind: "size", values: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"] },
  ],

  // Electronics
  electronics: [
    { name: "Color", kind: "color", values: ["Black", "White", "Silver", "Gold", "Rose Gold", "Blue"] },
    { name: "Storage", kind: "custom", values: ["64GB", "128GB", "256GB", "512GB", "1TB"] },
    { name: "RAM", kind: "custom", values: ["4GB", "6GB", "8GB", "12GB", "16GB", "32GB"] },
  ],
  phones: [
    { name: "Color", kind: "color", values: ["Black", "White", "Silver", "Gold", "Blue", "Green"] },
    { name: "Storage", kind: "custom", values: ["64GB", "128GB", "256GB", "512GB", "1TB"] },
    { name: "RAM", kind: "custom", values: ["4GB", "6GB", "8GB", "12GB", "16GB"] },
  ],
  smartphones: [
    { name: "Color", kind: "color", values: ["Black", "White", "Silver", "Gold", "Blue", "Green"] },
    { name: "Storage", kind: "custom", values: ["64GB", "128GB", "256GB", "512GB", "1TB"] },
    { name: "RAM", kind: "custom", values: ["4GB", "6GB", "8GB", "12GB", "16GB"] },
  ],
  laptops: [
    { name: "Color", kind: "color", values: ["Black", "Silver", "Gray", "White"] },
    { name: "Storage", kind: "custom", values: ["256GB", "512GB", "1TB", "2TB"] },
    { name: "RAM", kind: "custom", values: ["8GB", "16GB", "32GB", "64GB"] },
  ],
  computers: [
    { name: "Color", kind: "color", values: ["Black", "Silver", "Gray", "White"] },
    { name: "Storage", kind: "custom", values: ["256GB", "512GB", "1TB", "2TB"] },
    { name: "RAM", kind: "custom", values: ["8GB", "16GB", "32GB", "64GB"] },
  ],
  tablets: [
    { name: "Color", kind: "color", values: ["Black", "White", "Silver", "Gold", "Blue"] },
    { name: "Storage", kind: "custom", values: ["64GB", "128GB", "256GB", "512GB", "1TB"] },
  ],
  cameras: [
    { name: "Color", kind: "color", values: ["Black", "Silver", "White"] },
    { name: "Lens Mount", kind: "custom", values: ["EF", "RF", "E-mount", "Micro Four Thirds", "F-mount"] },
  ],
  audio: [
    { name: "Color", kind: "color", values: ["Black", "White", "Silver", "Blue", "Red"] },
    { name: "Connectivity", kind: "custom", values: ["Wired", "Bluetooth 5.0", "Bluetooth 5.1", "Bluetooth 5.2", "USB-C"] },
  ],
  "tv & home theater": [
    { name: "Screen Size", kind: "custom", values: ["32 inch", "43 inch", "50 inch", "55 inch", "65 inch", "75 inch", "85 inch"] },
    { name: "Resolution", kind: "custom", values: ["Full HD", "4K UHD", "8K UHD"] },
  ],
  accessories: [
    { name: "Color", kind: "color", values: ["Black", "Brown", "White", "Red", "Blue", "Beige", "Tan"] },
    { name: "Material", kind: "custom", values: ["Leather", "Canvas", "Nylon", "Metal", "Plastic"] },
  ],

  // Furniture
  furniture: [
    { name: "Color", kind: "color", values: ["White", "Black", "Brown", "Beige", "Gray", "Walnut", "Oak"] },
    { name: "Material", kind: "custom", values: ["Wood", "Metal", "Plastic", "Glass", "Fabric", "Leather"] },
    { name: "Size", kind: "size", values: ["Small", "Medium", "Large", "Extra Large"] },
  ],
  "home & kitchen": [
    { name: "Color", kind: "color", values: ["White", "Black", "Red", "Blue", "Green", "Yellow", "Gray"] },
    { name: "Material", kind: "custom", values: ["Stainless Steel", "Ceramic", "Glass", "Plastic", "Wood", "Silicone"] },
  ],
  bedding: [
    { name: "Color", kind: "color", values: ["White", "Gray", "Blue", "Beige", "Pink", "Green"] },
    { name: "Size", kind: "size", values: ["Twin", "Full", "Queen", "King", "California King"] },
    { name: "Material", kind: "custom", values: ["Cotton", "Linen", "Silk", "Polyester", "Microfiber"] },
  ],
  "home decor": [
    { name: "Color", kind: "color", values: ["White", "Black", "Gold", "Silver", "Blue", "Green", "Red"] },
    { name: "Style", kind: "custom", values: ["Modern", "Rustic", "Bohemian", "Minimalist", "Industrial"] },
  ],
  lighting: [
    { name: "Color", kind: "color", values: ["Black", "White", "Gold", "Silver", "Bronze"] },
    { name: "Bulb Type", kind: "custom", values: ["LED", "Incandescent", "Halogen", "Smart"] },
  ],

  // Beauty & Personal Care
  beauty: [
    { name: "Color / Shade", kind: "color", values: ["Natural", "Pink", "Red", "Nude", "Coral", "Berry", "Plum"] },
    { name: "Size", kind: "size", values: ["Travel", "Regular", "Family", "Jumbo"] },
  ],
  makeup: [
    { name: "Color / Shade", kind: "color", values: ["Natural", "Pink", "Red", "Nude", "Coral", "Berry", "Plum"] },
    { name: "Finish", kind: "custom", values: ["Matte", "Glossy", "Satin", "Metallic"] },
  ],
  skincare: [
    { name: "Skin Type", kind: "custom", values: ["Dry", "Oily", "Combination", "Sensitive", "Normal"] },
    { name: "Size", kind: "size", values: ["30ml", "50ml", "100ml", "150ml"] },
  ],
  haircare: [
    { name: "Hair Type", kind: "custom", values: ["Straight", "Wavy", "Curly", "Coily", "Fine", "Thick"] },
    { name: "Size", kind: "size", values: ["100ml", "250ml", "500ml", "1L"] },
  ],
  fragrance: [
    { name: "Size", kind: "size", values: ["30ml", "50ml", "100ml", "150ml"] },
    { name: "Concentration", kind: "custom", values: ["Eau de Toilette", "Eau de Parfum", "Parfum", "Cologne"] },
  ],

  // Jewelry & Watches
  jewelry: [
    { name: "Metal", kind: "custom", values: ["Gold", "Silver", "Rose Gold", "Platinum", "Stainless Steel"] },
    { name: "Gemstone", kind: "custom", values: ["Diamond", "Ruby", "Sapphire", "Emerald", "Pearl", "Amethyst", "None"] },
    { name: "Size", kind: "size", values: ["S", "M", "L", "Adjustable"] },
  ],
  watches: [
    { name: "Color", kind: "color", values: ["Black", "Silver", "Gold", "Rose Gold", "Blue", "Brown"] },
    { name: "Strap Material", kind: "custom", values: ["Leather", "Metal", "Silicone", "Nylon", "Rubber"] },
    { name: "Dial Size", kind: "custom", values: ["38mm", "40mm", "42mm", "44mm", "46mm"] },
  ],

  // Bags & Luggage
  bags: [
    { name: "Color", kind: "color", values: ["Black", "Brown", "Beige", "Gray", "Navy", "Red"] },
    { name: "Material", kind: "custom", values: ["Leather", "Canvas", "Nylon", "Polyester", "Vegan Leather"] },
    { name: "Size", kind: "size", values: ["Mini", "Small", "Medium", "Large"] },
  ],
  luggage: [
    { name: "Color", kind: "color", values: ["Black", "Silver", "Blue", "Red", "Rose Gold"] },
    { name: "Size", kind: "size", values: ["Carry-on", "Medium", "Large", "Extra Large"] },
  ],
  wallets: [
    { name: "Color", kind: "color", values: ["Black", "Brown", "Tan", "Navy", "Gray"] },
    { name: "Material", kind: "custom", values: ["Leather", "Canvas", "Synthetic", "Metal"] },
  ],

  // Toys & Games
  toys: [
    { name: "Color", kind: "color", values: ["Red", "Blue", "Yellow", "Green", "Pink", "Purple", "Multi"] },
    { name: "Age Group", kind: "custom", values: ["0-2", "3-5", "6-8", "9-12", "13+"] },
  ],
  games: [
    { name: "Platform", kind: "custom", values: ["PC", "PlayStation 5", "Xbox Series X", "Nintendo Switch", "Mobile"] },
    { name: "Genre", kind: "custom", values: ["Action", "Adventure", "RPG", "Sports", "Strategy", "Simulation"] },
  ],
  "board games": [
    { name: "Number of Players", kind: "custom", values: ["1", "2", "2-4", "4-6", "6+"] },
    { name: "Age Group", kind: "custom", values: ["3-5", "6-8", "9-12", "13+", "Adult"] },
  ],
  puzzles: [
    { name: "Number of Pieces", kind: "custom", values: ["100", "250", "500", "1000", "2000", "3000"] },
    { name: "Age Group", kind: "custom", values: ["3-5", "6-8", "9-12", "13+", "Adult"] },
  ],

  // Sports & Outdoors
  sports: [
    { name: "Color", kind: "color", values: ["Black", "White", "Red", "Blue", "Green", "Yellow", "Orange"] },
    { name: "Size", kind: "size", values: ["S", "M", "L", "XL", "One Size"] },
  ],
  fitness: [
    { name: "Color", kind: "color", values: ["Black", "Gray", "Blue", "Red", "Green", "Pink"] },
    { name: "Weight / Resistance", kind: "custom", values: ["Light", "Medium", "Heavy", "Adjustable"] },
  ],
  "outdoor & camping": [
    { name: "Color", kind: "color", values: ["Green", "Camo", "Black", "Gray", "Orange"] },
    { name: "Capacity", kind: "custom", values: ["1-person", "2-person", "4-person", "6-person", "8-person"] },
  ],
  cycling: [
    { name: "Color", kind: "color", values: ["Black", "Red", "Blue", "White", "Green"] },
    { name: "Frame Size", kind: "custom", values: ["XS", "S", "M", "L", "XL"] },
  ],

  // Books & Media
  books: [
    { name: "Format", kind: "custom", values: ["Hardcover", "Paperback", "E-book", "Audiobook"] },
    { name: "Language", kind: "custom", values: ["English", "French", "Spanish", "German", "Chinese", "Arabic"] },
  ],
  stationery: [
    { name: "Color", kind: "color", values: ["Black", "Blue", "Red", "Green", "Purple", "Pink"] },
    { name: "Pack Size", kind: "custom", values: ["Single", "Pack of 5", "Pack of 10", "Pack of 20"] },
  ],

  // Food & Beverages
  food: [
    { name: "Flavor", kind: "custom", values: ["Original", "Chocolate", "Vanilla", "Strawberry", "Mint", "Caramel"] },
    { name: "Size", kind: "size", values: ["Small", "Medium", "Large", "Family Pack"] },
  ],
  beverages: [
    { name: "Flavor", kind: "custom", values: ["Original", "Cola", "Lemon", "Orange", "Berry", "Peach"] },
    { name: "Size", kind: "size", values: ["250ml", "330ml", "500ml", "1L", "1.5L", "2L"] },
  ],
  coffee: [
    { name: "Roast Level", kind: "custom", values: ["Light", "Medium", "Dark", "Espresso"] },
    { name: "Grind", kind: "custom", values: ["Whole Bean", "Coarse", "Medium", "Fine", "Espresso"] },
    { name: "Size", kind: "size", values: ["250g", "500g", "1kg"] },
  ],
  tea: [
    { name: "Type", kind: "custom", values: ["Black", "Green", "White", "Oolong", "Herbal", "Rooibos"] },
    { name: "Format", kind: "custom", values: ["Loose Leaf", "Tea Bags", "Sachets"] },
  ],
  wine: [
    { name: "Type", kind: "custom", values: ["Red", "White", "Rose", "Sparkling", "Dessert"] },
    { name: "Bottle Size", kind: "size", values: ["375ml", "750ml", "1.5L", "3L"] },
  ],

  // Health & Wellness
  health: [
    { name: "Size / Count", kind: "size", values: ["30 count", "60 count", "90 count", "120 count"] },
    { name: "Form", kind: "custom", values: ["Tablet", "Capsule", "Softgel", "Powder", "Liquid"] },
  ],
  vitamins: [
    { name: "Size / Count", kind: "size", values: ["30 count", "60 count", "90 count", "120 count"] },
    { name: "Form", kind: "custom", values: ["Tablet", "Capsule", "Softgel", "Gummy", "Liquid"] },
  ],
  "personal care": [
    { name: "Scent", kind: "custom", values: ["Unscented", "Lavender", "Coconut", "Aloe", "Fresh", "Citrus"] },
    { name: "Size", kind: "size", values: ["100ml", "250ml", "400ml", "500ml", "1L"] },
  ],

  // Baby & Kids
  baby: [
    { name: "Size", kind: "size", values: ["Newborn", "0-3M", "3-6M", "6-12M", "12-18M", "18-24M"] },
    { name: "Color", kind: "color", values: ["White", "Blue", "Pink", "Green", "Yellow", "Gray"] },
  ],
  diapers: [
    { name: "Size", kind: "size", values: ["Newborn", "1", "2", "3", "4", "5", "6", "7"] },
    { name: "Count", kind: "custom", values: ["20 count", "30 count", "50 count", "100 count", "150 count"] },
  ],
  strollers: [
    { name: "Color", kind: "color", values: ["Black", "Gray", "Blue", "Pink", "Beige"] },
    { name: "Configuration", kind: "custom", values: ["Single", "Double", "Travel System", "Jogging"] },
  ],

  // Pet Supplies
  "pet supplies": [
    { name: "Pet Type", kind: "custom", values: ["Dog", "Cat", "Fish", "Bird", "Small Animal", "Reptile"] },
    { name: "Size", kind: "size", values: ["Small", "Medium", "Large", "Extra Large"] },
  ],
  "pet food": [
    { name: "Pet Type", kind: "custom", values: ["Dog", "Cat", "Fish", "Bird", "Small Animal"] },
    { name: "Size", kind: "size", values: ["1kg", "2kg", "5kg", "10kg", "15kg"] },
  ],

  // Automotive
  automotive: [
    { name: "Color", kind: "color", values: ["Black", "White", "Silver", "Red", "Blue", "Gray"] },
    { name: "Material", kind: "custom", values: ["Plastic", "Metal", "Rubber", "Carbon Fiber", "Leather"] },
  ],
  "car accessories": [
    { name: "Color", kind: "color", values: ["Black", "Gray", "Beige", "Red", "Blue"] },
    { name: "Material", kind: "custom", values: ["Plastic", "Metal", "Rubber", "Leather"] },
  ],

  // Tools & Home Improvement
  tools: [
    { name: "Power Source", kind: "custom", values: ["Corded Electric", "Cordless Battery", "Manual", "Pneumatic"] },
    { name: "Voltage", kind: "custom", values: ["12V", "18V", "20V", "40V", "120V"] },
  ],
  "home improvement": [
    { name: "Color / Finish", kind: "color", values: ["White", "Black", "Silver", "Brass", "Bronze", "Chrome"] },
    { name: "Size", kind: "size", values: ["Small", "Medium", "Large"] },
  ],
  garden: [
    { name: "Color", kind: "color", values: ["Green", "Black", "Brown", "Terracotta", "Gray"] },
    { name: "Material", kind: "custom", values: ["Plastic", "Ceramic", "Metal", "Wood", "Concrete"] },
  ],

  // Office Supplies
  "office supplies": [
    { name: "Color", kind: "color", values: ["Black", "Blue", "Red", "Green", "White", "Gray"] },
    { name: "Pack Size", kind: "custom", values: ["Single", "Pack of 5", "Pack of 10", "Pack of 50"] },
  ],

  // Arts & Crafts
  "arts & crafts": [
    { name: "Color", kind: "color", values: ["Red", "Blue", "Yellow", "Green", "Black", "White", "Purple", "Orange"] },
    { name: "Material", kind: "custom", values: ["Acrylic", "Oil", "Watercolor", "Fabric", "Paper", "Wood"] },
  ],
  sewing: [
    { name: "Color", kind: "color", values: ["Black", "White", "Red", "Blue", "Green", "Beige"] },
    { name: "Material", kind: "custom", values: ["Cotton", "Polyester", "Silk", "Denim", "Linen"] },
  ],

  // Musical Instruments
  "musical instruments": [
    { name: "Color", kind: "color", values: ["Black", "White", "Red", "Blue", "Sunburst", "Natural"] },
    { name: "Size", kind: "size", values: ["1/4", "1/2", "3/4", "Full Size"] },
  ],
  guitars: [
    { name: "Color", kind: "color", values: ["Black", "Sunburst", "Natural", "White", "Red"] },
    { name: "Body Type", kind: "custom", values: ["Acoustic", "Electric", "Classical", "Bass"] },
  ],

  // Industrial & Scientific
  "industrial & scientific": [
    { name: "Size", kind: "size", values: ["Small", "Medium", "Large", "Extra Large"] },
    { name: "Material", kind: "custom", values: ["Steel", "Aluminum", "Plastic", "Rubber", "Glass"] },
  ],
};

/**
 * Keyword-based fallback presets. When a category name is not an exact key in
 * CATEGORY_ATTRIBUTE_PRESETS, we look for the first keyword it contains and
 * return the associated presets.
 */
export const CATEGORY_KEYWORD_PRESETS: Array<{
  keywords: string[];
  presets: AttributePreset[];
}> = [
  {
    keywords: ["t-shirt", "tshirt", "tee", "shirt", "blouse", "polo", "top"],
    presets: CATEGORY_ATTRIBUTE_PRESETS["men's clothing"],
  },
  {
    keywords: ["dress", "gown", "skirt"],
    presets: CATEGORY_ATTRIBUTE_PRESETS["women's clothing"],
  },
  {
    keywords: ["pant", "jean", "trouser", "short", "legging", "jogger"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.clothes,
  },
  {
    keywords: ["jacket", "coat", "hoodie", "sweater", "cardigan", "blazer"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.clothes,
  },
  {
    keywords: ["sock", "underwear", "lingerie", "bra", "swimwear", "bikini"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.clothes,
  },
  {
    keywords: ["sneaker", "trainer", "running shoe", "sandal", "boot", "heel", "flat", "loafer"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.shoes,
  },
  {
    keywords: ["phone", "smartphone", "mobile", "iphone", "android"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.phones,
  },
  {
    keywords: ["laptop", "notebook", "macbook", "chromebook"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.laptops,
  },
  {
    keywords: ["computer", "desktop", "pc", "workstation"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.computers,
  },
  {
    keywords: ["tablet", "ipad"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.tablets,
  },
  {
    keywords: ["camera", "lens", "dslr", "mirrorless"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.cameras,
  },
  {
    keywords: ["headphone", "earbud", "speaker", "audio", "sound", "microphone"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.audio,
  },
  {
    keywords: ["tv", "television", "monitor", "display", "projector"],
    presets: CATEGORY_ATTRIBUTE_PRESETS["tv & home theater"],
  },
  {
    keywords: ["sofa", "couch", "chair", "table", "desk", "bed", "mattress", "wardrobe", "shelf", "cabinet"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.furniture,
  },
  {
    keywords: ["cookware", "dinnerware", "utensil", "appliance", "kitchen", "pan", "pot", "knife", "plate"],
    presets: CATEGORY_ATTRIBUTE_PRESETS["home & kitchen"],
  },
  {
    keywords: ["bedding", "pillow", "duvet", "comforter", "sheet", "blanket"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.bedding,
  },
  {
    keywords: ["decor", "wall art", "vase", "mirror", "rug", "curtain", "cushion"],
    presets: CATEGORY_ATTRIBUTE_PRESETS["home decor"],
  },
  {
    keywords: ["lamp", "light", "chandelier", "bulb"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.lighting,
  },
  {
    keywords: ["makeup", "lipstick", "foundation", "eyeshadow", "mascara"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.makeup,
  },
  {
    keywords: ["skincare", "moisturizer", "serum", "cleanser", "sunscreen"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.skincare,
  },
  {
    keywords: ["hair", "shampoo", "conditioner", "styling"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.haircare,
  },
  {
    keywords: ["perfume", "cologne", "fragrance"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.fragrance,
  },
  {
    keywords: ["necklace", "ring", "earring", "bracelet", "pendant", "jewelry"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.jewelry,
  },
  {
    keywords: ["watch", "wristwatch"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.watches,
  },
  {
    keywords: ["bag", "backpack", "handbag", "tote", "duffel", "messenger"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.bags,
  },
  {
    keywords: ["suitcase", "luggage", "carry-on"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.luggage,
  },
  {
    keywords: ["wallet", "purse", "clutch"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.wallets,
  },
  {
    keywords: ["toy", "doll", "action figure", "plush", "building block"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.toys,
  },
  {
    keywords: ["video game", "console", "controller", "gaming"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.games,
  },
  {
    keywords: ["board game", "card game"],
    presets: CATEGORY_ATTRIBUTE_PRESETS["board games"],
  },
  {
    keywords: ["puzzle", "jigsaw"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.puzzles,
  },
  {
    keywords: ["fitness", "gym", "yoga", "dumbbell", "treadmill"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.fitness,
  },
  {
    keywords: ["camping", "hiking", "tent", "sleeping bag", "backpacking"],
    presets: CATEGORY_ATTRIBUTE_PRESETS["outdoor & camping"],
  },
  {
    keywords: ["cycling", "bicycle", "bike", "helmet"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.cycling,
  },
  {
    keywords: ["book", "novel", "magazine"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.books,
  },
  {
    keywords: ["pen", "pencil", "notebook", "paper", "sticker"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.stationery,
  },
  {
    keywords: ["snack", "chocolate", "candy", "cookie", "chip"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.food,
  },
  {
    keywords: ["drink", "beverage", "soda", "juice", "water"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.beverages,
  },
  {
    keywords: ["coffee", "espresso", "bean"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.coffee,
  },
  {
    keywords: ["tea"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.tea,
  },
  {
    keywords: ["wine", "beer", "spirit", "alcohol"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.wine,
  },
  {
    keywords: ["vitamin", "supplement", "protein", "mineral"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.vitamins,
  },
  {
    keywords: ["diaper", "wipe", "baby food", "formula"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.diapers,
  },
  {
    keywords: ["stroller", "carseat", "carrier", "crib"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.strollers,
  },
  {
    keywords: ["dog", "cat", "pet", "fish", "bird", "aquarium"],
    presets: CATEGORY_ATTRIBUTE_PRESETS["pet supplies"],
  },
  {
    keywords: ["car", "auto", "vehicle", "motorcycle"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.automotive,
  },
  {
    keywords: ["tool", "drill", "saw", "wrench", "screwdriver"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.tools,
  },
  {
    keywords: ["garden", "plant", "planter", "hose", "outdoor"],
    presets: CATEGORY_ATTRIBUTE_PRESETS.garden,
  },
  {
    keywords: ["office", "desk", "chair", "printer", "ink"],
    presets: CATEGORY_ATTRIBUTE_PRESETS["office supplies"],
  },
  {
    keywords: ["paint", "brush", "canvas", "craft", "diy"],
    presets: CATEGORY_ATTRIBUTE_PRESETS["arts & crafts"],
  },
  {
    keywords: ["guitar", "piano", "keyboard", "drum", "instrument"],
    presets: CATEGORY_ATTRIBUTE_PRESETS["musical instruments"],
  },
  {
    keywords: ["industrial", "scientific", "lab", "safety", "hardware"],
    presets: CATEGORY_ATTRIBUTE_PRESETS["industrial & scientific"],
  },
];

function clonePresets(presets: AttributePreset[]): AttributePreset[] {
  return presets.map((p) => ({ ...p, values: [...p.values] }));
}

function findPresetsByName(name: string): AttributePreset[] | null {
  const key = normalizeCategoryName(name);
  const exact = CATEGORY_ATTRIBUTE_PRESETS[key];
  if (exact) return clonePresets(exact);

  for (const { keywords, presets } of CATEGORY_KEYWORD_PRESETS) {
    if (keywords.some((kw) => key.includes(kw))) {
      return clonePresets(presets);
    }
  }

  return null;
}

function collectAncestorNames(
  categoryId: string,
  categories: Category[]
): string[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const names: string[] = [];
  let current = byId.get(categoryId);
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.name) names.push(current.name);
    if (!current.parentId) break;
    current = byId.get(current.parentId);
  }

  return names;
}

/**
 * Resolve default attribute presets for a product's categories.
 *
 * Resolution order for each category:
 * 1. Exact match on category name
 * 2. Keyword fallback on category name
 * 3. Exact/keyword match on ancestor category names (parent, grandparent, ...)
 *
 * Duplicates are removed by attribute name (case-insensitive).
 */
export function resolvePresetAttributes(
  categoryIds: string[],
  categories: Category[]
): VariantAttributeDefinition[] {
  const seenNames = new Set<string>();
  const result: VariantAttributeDefinition[] = [];

  for (const categoryId of categoryIds) {
    const names = collectAncestorNames(categoryId, categories);

    for (const name of names) {
      const presets = findPresetsByName(name);
      if (!presets) continue;

      for (const preset of presets) {
        const lowerName = preset.name.toLowerCase();
        if (seenNames.has(lowerName)) continue;
        seenNames.add(lowerName);

        result.push({
          id: genAttrId(),
          name: preset.name,
          kind: preset.kind,
          values: [...preset.values],
          valueIdMap: {},
        });
      }
    }
  }

  return result;
}
