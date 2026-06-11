/** Raw customer from GET /orders/vendor/customers */
export type VendorCustomerFromApi = {
  userId: string;
  name: string | null;
  surname: string | null;
  email: string | null;
  phone: string | null;
  orderCount: number;
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



/** Snapshot row for embedded history (enriched in UI from orders store when emails match). */
export type CustomerOrderSnapshot = {
  reference: string;
  total: number;
  at: string;
  status: string;
};

export type VendorCustomer = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  /** e.g. repeat buyer, wholesale */
  tags: string[];
  orderCount: number;
  totalSpend: number;
  firstSeen: string;
  lastSeen: string;
  orders: CustomerOrderSnapshot[];
  communications: CommunicationEntry[];
  activities: CustomerActivity[];
};
