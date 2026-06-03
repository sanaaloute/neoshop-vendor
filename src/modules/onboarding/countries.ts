export type Country = {
  code: string;
  name: string;
};

/** Supported vendor countries: West African nations + China. */
export const COUNTRIES: Country[] = [
  { code: "BJ", name: "Benin" },
  { code: "BF", name: "Burkina Faso" },
  { code: "CV", name: "Cape Verde" },
  { code: "CN", name: "China" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "GM", name: "Gambia" },
  { code: "GH", name: "Ghana" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "LR", name: "Liberia" },
  { code: "ML", name: "Mali" },
  { code: "MR", name: "Mauritania" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "SN", name: "Senegal" },
  { code: "SL", name: "Sierra Leone" },
  { code: "TG", name: "Togo" },
];

/** Lookup map: lower-case name → ISO code. */
export const COUNTRY_NAME_TO_ISO: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.name.toLowerCase(), c.code])
);

/** Lookup map: ISO code → country name. */
export const ISO_TO_COUNTRY_NAME: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c.name])
);
