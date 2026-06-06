/**
 * Gateway-aligned shapes for Barkosem `/api/v1` vendor REST.
 * Cross-check with live OpenAPI: `{API_ORIGIN}/api/docs` and `{API_ORIGIN}/api/docs-json`.
 */

export type ApiProductStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "hidden"
  | "archived"
  | "rejected";

export type ApiOrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "disputed"
  | "refunded"
  | "cancelled";

/** Paginated list wrappers returned by the backend */
export type Paginated<T> = {
  items: T[];
  total: number;
  skip: number;
  take: number;
};

export type AuthMeResponse = {
  id: string;
  email: string | null;
  phone?: string | null;
  name?: string | null;
  surname?: string | null;
  role: string;
  avatarUrl?: string | null;
  createdAt?: string;
  emailVerifiedAt?: string | null;
};

export type AuthSessionResponse = {
  sessionId: string;
  expiresAt: string;
};

/** Prisma `VendorStatus` — GET /vendors/me `status` */
export type VendorLifecycleStatus =
  | "PENDING_ONBOARDING"
  | "PENDING_VERIFICATION"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

/** GET /vendors/me — full vendor profile */
export type VendorMeResponse = {
  id: string;
  userId: string;
  status: VendorLifecycleStatus;
  vendorType?: VendorType | null;
  legalBusinessName: string;
  tradeName?: string | null;
  taxId?: string | null;
  businessEmail?: string | null;
  businessPhone?: string | null;
  countryCode?: string | null;
  region?: string | null;
  city?: string | null;
  addressLine1?: string | null;
  postalCode?: string | null;
  rejectionReason?: string | null;
  documents: VendorDocument[];
  shops: VendorShopSummary[];
  statusHistory: VendorStatusHistoryEntry[];
  createdAt: string;
};

export type VendorDocument = {
  id: string;
  type: VendorDocumentType;
  fileUrl: string;
  fileName?: string | null;
  mimeType?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
};

export type VendorShopSummary = {
  id: string;
  slug: string;
  name: string;
  isPublished: boolean;
};

export type VendorStatusHistoryEntry = {
  status: VendorLifecycleStatus;
  note?: string | null;
  createdAt: string;
};

// --- User Profile DTOs ---

export type UserMeResponse = {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  surname?: string | null;
  role: string;
  avatarUrl?: string | null;
  createdAt: string;
};

export type UpdateUserMeDto = {
  name?: string;
  surname?: string;
  avatarUrl?: string;
};

// --- Vendor + shop DTOs (OpenAPI: RegisterVendorDto, UpdateVendorOnboardingDto, …) ---

export type VendorType = "INDIVIDUAL" | "COMPANY";

export type RegisterVendorDto = {
  vendorType: VendorType;
  legalBusinessName: string;
  tradeName?: string;
  taxId?: string;
  businessEmail?: string;
  businessPhone?: string;
  /** ISO 3166-1 alpha-2 */
  countryCode?: string;
  region?: string;
  city?: string;
  addressLine1?: string;
  postalCode?: string;
};

/** PATCH /vendors/me/onboarding — all fields optional in spec */
export type UpdateVendorOnboardingDto = {
  legalBusinessName?: string;
  tradeName?: string;
  taxId?: string;
  businessEmail?: string;
  businessPhone?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  addressLine1?: string;
  postalCode?: string;
};

export type VendorDocumentType =
  | "BUSINESS_REGISTRATION"
  | "TAX_CERTIFICATE"
  | "BANK_PROOF"
  | "IDENTITY"
  | "OTHER";

export type CreateVendorDocumentDto = {
  type: VendorDocumentType;
  /** HTTPS URL (e.g. Supabase Storage) */
  fileUrl: string;
  fileName?: string;
  mimeType?: string;
  /** Storage bucket name (e.g. "vendor-documents") */
  storageBucket?: string;
  /** Storage object path (e.g. "vendor-uuid/filename.pdf") */
  storagePath?: string;
};

export type CreateShopDto = {
  /** `^[a-z0-9]+(?:-[a-z0-9]+)*$` */
  slug: string;
  name: string;
  description?: string;
};

export type UpdateShopDto = {
  slug?: string;
  name?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  shippingConfig?: Record<string, unknown>;
  paymentConfig?: Record<string, unknown>;
  isPublished?: boolean;
};

// --- Products ---

export type CreateProductDto = {
  title: string;
  slug?: string;
  description?: string;
  moq?: number;
  categoryIds?: string[];
};

export type UpdateProductDto = {
  title?: string;
  slug?: string;
  description?: string;
  moq?: number;
  status?: ApiProductStatus;
};

export type ProductStatsResponse = {
  draft: number;
  pending_review: number;
  published: number;
  hidden: number;
  archived: number;
  rejected: number;
};

export type CreateProductAttributeDto = {
  code: string;
  label: string;
  sortOrder?: number;
};

export type CreateProductAttributeValueDto = {
  value: string;
  sortOrder?: number;
};

// --- Variants ---

export type BulkPricingTier = {
  minQuantity: number;
  price: number;
};

export type CreateVariantDto = {
  sku?: string;
  wholesalePrice: number;
  moq?: number;
  attributeValueIds: string[];
  bulkPricing?: BulkPricingTier[];
  isActive?: boolean;
};

export type UpdateVariantDto = {
  sku?: string;
  wholesalePrice?: number;
  moq?: number;
  attributeValueIds?: string[];
  bulkPricing?: BulkPricingTier[];
  isActive?: boolean;
};

// --- Orders ---

export type OrderStatsResponse = {
  pending: number;
  paid: number;
  processing: number;
  shipped: number;
  delivered: number;
  disputed: number;
  refunded: number;
  cancelled: number;
};

export type UpdateOrderStatusDto = {
  status: ApiOrderStatus;
  note?: string;
};

// --- Payments ---

export type PaymentMethod = {
  id: string;
  code: string;
  name: string;
  enabled: boolean;
};

export type CapturePaymentDto = {
  amount: number;
  method: "cash" | "bank_transfer";
  reference?: string;
};

// --- Analytics ---

export type AnalyticsDashboardResponse = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: string;
    title: string;
    soldCount: number;
  }>;
  period: string;
};

export type AnalyticsOrdersTrendItem = {
  date: string;
  orderCount: number;
  revenue: number;
};

export type AnalyticsProductsItem = {
  productId: string;
  title: string;
  views: number;
  orders: number;
  conversionRate: number;
};

// --- Reviews ---

export type ReviewStatus = "pending" | "approved" | "rejected";

export type ReviewResponse = {
  id: string;
  productId: string;
  productTitle: string;
  customerName: string;
  rating: number;
  body: string;
  vendorResponse?: string | null;
  status: ReviewStatus;
  createdAt: string;
};

export type RespondToReviewDto = {
  response: string;
};

// --- Disputes ---

export type DisputeStatus =
  | "open"
  | "investigating"
  | "awaiting_customer"
  | "awaiting_vendor"
  | "mediation"
  | "escalated"
  | "resolved";

export type DisputeSummary = {
  id: string;
  orderId: string;
  status: DisputeStatus;
  amountClaimed: number;
  currency: string;
  reasonCategory: string;
  openedAt: string;
};

export type DisputeMessage = {
  id: string;
  body: string;
  senderRole: string;
  createdAt: string;
};

export type DisputeDetail = DisputeSummary & {
  messages: DisputeMessage[];
  timeline: Array<{
    status: string;
    note?: string | null;
    createdAt: string;
  }>;
};

export type PostDisputeMessageDto = {
  body: string;
};

// --- Notifications ---

export type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  category: string;
  read: boolean;
  createdAt: string;
  href?: string | null;
};

export type NotificationUnreadCountResponse = {
  count: number;
};

export type RegisterDeviceDto = {
  token: string;
  platform: "ios" | "android" | "web";
  deviceId?: string;
  appVersion?: string;
};

// --- Wallet ---

export type WalletBalanceResponse = {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  heldBalance: number;
};

export type WalletTransaction = {
  id: string;
  walletId: string;
  type: "deposit" | "withdrawal" | "payment" | "payout" | "refund" | "hold" | "release";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

// --- Catalog ---

export type CatalogProductSummary = {
  id: string;
  slug: string;
  title: string;
  wholesalePrice: number;
  moq: number;
  primaryImageUrl?: string | null;
  categoryNames?: string[];
};

export type CatalogProductDetail = CatalogProductSummary & {
  description?: string | null;
  variants: Array<{
    id: string;
    sku: string;
    wholesalePrice: number;
    moq: number;
    isActive: boolean;
  }>;
  attributes: Array<{
    code: string;
    label: string;
    values: Array<{ id: string; value: string }>;
  }>;
  images: Array<{ url: string; alt?: string | null; isPrimary: boolean }>;
};
