/** Product purchased by a customer with aggregated stats. */
export type CustomerProduct = {
  productId: string;
  title: string;
  totalQuantity: number;
  totalSpent: string;
};

/** Raw customer from GET /orders/vendor/customers */
export type VendorCustomerFromApi = {
  userId: string;
  name: string | null;
  surname: string | null;
  email: string | null;
  phone: string | null;
  orderCount: number;
  totalSpent: string;
  products: CustomerProduct[];
};

/** API wrapper: { items: VendorCustomerFromApi[] } */
export type VendorCustomersApiResponse = {
  items: VendorCustomerFromApi[];
};

export type CommunicationChannel = "email" | "message" | "note";

export type CommunicationEntry = {
  id: string;
  at: string;
  channel: CommunicationChannel;
  subject: string;
  snippet: string;
  direction: "in" | "out";
};

export type CustomerActivityKind =
  | "order_placed"
  | "login"
  | "email_open"
  | "support"
  | "catalog_view";

export type CustomerActivity = {
  id: string;
  at: string;
  kind: CustomerActivityKind;
  label: string;
  detail?: string;
};

/** Snapshot row for embedded history. */
export type CustomerOrderSnapshot = {
  reference: string;
  total: number;
  at: string;
  status: string;
};

/** Enriched customer for UI consumption. */
export type VendorCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  tags: string[];
  orderCount: number;
  totalSpent: number;
  firstSeen: string;
  lastSeen: string;
  orders: CustomerOrderSnapshot[];
  communications: CommunicationEntry[];
  activities: CustomerActivity[];
  products: CustomerProduct[];
};
