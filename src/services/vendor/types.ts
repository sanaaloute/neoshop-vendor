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
  | "pending_payment"
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
  sessionId?: string;
  session_id?: string;
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
  submittedAt?: string | null;
  onboardingCompletedAt?: string | null;
  documents: VendorDocument[];
  shops: VendorShopSummary[];
  statusHistory: VendorStatusHistoryEntry[];
  createdAt: string;
};

export type VendorDocument = {
  id: string;
  type: VendorDocumentType;
  fileUrl: string;
  storageBucket?: string | null;
  storagePath?: string | null;
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
  dateOfBirth?: string | null;
  nationality?: string | null;
  idCardType?: string | null;
  idCardNumber?: string | null;
  role: string;
  avatarUrl?: string | null;
  createdAt: string;
};

export type UpdateUserMeDto = {
  name?: string;
  surname?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  idCardType?: string;
  idCardNumber?: string;
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
};

/** PATCH /vendors/me/onboarding — all fields optional in spec */
export type UpdateVendorOnboardingDto = {
  vendorType?: VendorType;
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

export type Currency = "CNY" | "XOF";

export type BulkPricingTierInput = {
  minQuantity: number;
  unitPrice: number;
};

export type BulkPricingTier = {
  minQuantity: number;
  unitPrice: string;
};

export type CreateProductDto = {
  title: string;
  slug: string;
  description?: string;
  moq?: number;
  currency?: Currency;
  bulkPricing?: BulkPricingTierInput[];
  categoryIds?: string[];
};

export type UpdateProductDto = {
  title?: string;
  slug?: string;
  description?: string;
  moq?: number;
  currency?: Currency;
  // Vendors may set draft, pending_review, hidden, or published directly.
  // archived and rejected are admin-only.
  status?: Extract<
    ApiProductStatus,
    "draft" | "pending_review" | "hidden" | "published"
  >;
  bulkPricing?: BulkPricingTierInput[];
};

export type ProductStatsResponse = {
  total: number;
  byStatus: {
    draft: number;
    pending_review: number;
    published: number;
    hidden: number;
    archived: number;
  };
};

export type CreateProductAttributeDto = {
  code: string;
  label: string;
  sortOrder?: number;
  values?: Array<{
    value: string;
    sortOrder?: number;
  }>;
};

export type AddAttributeValuesDto = {
  values: Array<{
    value: string;
    sortOrder?: number;
  }>;
};

// --- Variants ---

export type CreateVariantDto = {
  attributeValueIds: string[];
  wholesalePrice: number;
  currency?: Currency;
  isActive?: boolean;
  weightKg?: number;
  volumeCbm?: number;
  imageUrl?: string;
};

export type UpdateVariantDto = {
  wholesalePrice?: number;
  currency?: Currency;
  isActive?: boolean;
  weightKg?: number;
  volumeCbm?: number;
  imageUrl?: string;
};

export type BulkCreateVariantsDto = {
  variants: CreateVariantDto[];
};

export type BulkUpdateVariantsDto = {
  updates: Array<UpdateVariantDto & { variantId: string }>;
};

export type BulkDeleteVariantsDto = {
  variantIds: string[];
};

export type ProductVariantSelection = {
  attributeValueId: string;
  attributeValue?: { value: string } | null;
};

export type ProductVariantInventory = {
  quantity: number;
  reservedQuantity: number;
};

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  // Decimal values are returned as strings per API guide global conventions.
  wholesalePrice: string;
  currency: Currency;
  isActive: boolean;
  imageUrl?: string | null;
  weightKg: string;
  volumeCbm: string;
  selections: ProductVariantSelection[];
  inventory: ProductVariantInventory;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedProductVariants = {
  items: ProductVariant[];
  total: number;
  skip: number;
  take: number;
};

// --- Orders ---

export type OrderStatsResponse = {
  total: number;
  byStatus: {
    pending_payment: number;
    paid: number;
    processing: number;
    shipped: number;
    delivered: number;
    disputed: number;
    refunded: number;
    cancelled: number;
  };
};

export type UpdateOrderStatusDto = {
  status: ApiOrderStatus;
  note?: string;
};

export type UpdateOrderTrackingDto = {
  trackingNumber: string;
  note?: string;
};

export type OrderLineItem = {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  skuSnapshot: string;
  titleSnapshot: string;
  variantImageUrl: string | null;
};

export type VendorOrder = {
  id: string;
  orderNumber: string;
  checkoutGroupId: string;
  customerUserId: string;
  customer: { id: string; email: string };
  status: ApiOrderStatus;
  currency: string;
  subtotal: string;
  taxTotal: string;
  shippingTotal: string;
  grandTotal: string;
  placedAt: string;
  items: OrderLineItem[];
};

export type OrderDetailItem = OrderLineItem & {
  variant: {
    id: string;
    sku: string;
    imageUrl: string | null;
    weightKg: string;
    volumeCbm: string;
    currency: string;
  };
};

export type OrderStatusHistoryItem = {
  id: string;
  status: ApiOrderStatus;
  note: string | null;
  actorUserId: string | null;
  createdAt: string;
};

export type OrderDetailResponse = {
  id: string;
  checkoutGroupId: string;
  customerUserId: string;
  customer: { id: string; email: string };
  vendorId: string;
  vendor: {
    id: string;
    tradeName: string;
    legalBusinessName: string;
  };
  status: ApiOrderStatus;
  currency: string;
  vendorCurrency: string;
  subtotal: string;
  taxTotal: string;
  shippingTotal: string;
  grandTotal: string;
  couponCode: string | null;
  placedAt: string;
  updatedAt: string;
  orderNumber: string;
  trackingNumber?: string | null;
  shippingAddress: {
    id: string;
    fullName: string;
    phone: string;
    country: string;
    city: string;
    region: string;
    postalCode: string;
    streetLine1: string;
    streetLine2?: string | null;
  } | null;
  shippingMethod: {
    id: string;
    name: string;
    type: "SEA" | "AIR";
    estimatedDaysMin: number;
    estimatedDaysMax: number;
  } | null;
  items: OrderDetailItem[];
  statusHistory: OrderStatusHistoryItem[];
  // Structured shapes are not documented in the vendor API guide; keep opaque
  // until the backend contract is known.
  invoices: unknown[];
  payments: unknown[];
  refunds: unknown[];
};

export type TrackingEvent = {
  id: string;
  status: ApiOrderStatus;
  location: string;
  note: string;
  createdAt: string;
};

export type OrderTrackingResponse = {
  carrier: string;
  trackingNumber: string;
  events: TrackingEvent[];
};

/** Product in customer's purchase history */
export type CustomerProductFromApi = {
  productId: string;
  title: string;
  totalQuantity: number;
  totalSpent: string;
};

/** GET /orders/vendor/customers — raw customer row with order counts */
export type VendorCustomerFromApi = {
  userId: string;
  name: string | null;
  surname: string | null;
  email: string | null;
  phone: string | null;
  orderCount: number;
  totalSpent: string;
  products: CustomerProductFromApi[];
};

// --- Analytics ---

export type AnalyticsDashboardResponse = {
  totalRevenue: string;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: string;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  disputedOrders: number;
  topProducts: Array<{
    variantId: string;
    productTitle: string;
    quantitySold: number;
    revenue: string;
  }>;
  period: string;
  geographic: Array<{
    countryCode: string;
    name: string;
    revenue: string;
    orderCount: number;
  }>;
  retentionSeries: Array<{
    period: string;
    label: string;
    returningCustomers: number;
    totalCustomers: number;
    rate: number;
  }>;
  conversionRate: number;
  conversionTrend: Array<{
    label: string;
    value: number;
  }>;
};

export type AnalyticsOrdersTrendItem = {
  date: string;
  orders: number;
  revenue: string;
};

export type AnalyticsOrdersResponse = {
  items: AnalyticsOrdersTrendItem[];
};

export type AnalyticsProductsItem = {
  id: string;
  title: string;
  slug: string;
  status: ApiProductStatus;
  imageUrl: string | null;
  variantCount: number;
  averageRating: string;
  reviewsCount: number;
  totalSold: number;
  totalRevenue: string;
};

export type AnalyticsProductsResponse = {
  items: AnalyticsProductsItem[];
};

export type AnalyticsInventoryItem = {
  date: string;
  label: string;
  unitsSold: number;
  restocked: number;
};

export type AnalyticsInventoryResponse = {
  items: AnalyticsInventoryItem[];
};

// --- Reviews ---

export type ReviewStatus = "pending" | "approved" | "rejected";

export type ReviewResponse = {
  id: string;
  productId: string;
  productTitle: string;
  customerName: string;
  rating: number;
  title?: string | null;
  // The review response endpoint returns the vendor reply as `comment` per the
  // API guide; `body` is kept as an alias for backwards compatibility.
  body: string;
  comment?: string;
  mediaUrls?: string[];
  helpfulCount?: number;
  isVerifiedPurchase?: boolean;
  vendorResponse?: string | null;
  vendorRespondedAt?: string | null;
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
  customerEmail: string;
  amountClaimed: string;
  currency: string;
  reasonCategory: string;
  escalationTier: number;
  openedAt: string;
  messageCount: number;
};

export type DisputeMessage = {
  id: string;
  body: string;
  internal: boolean;
  author: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
};

export type DisputeDetail = DisputeSummary & {
  resolvedAt: string | null;
  messages: DisputeMessage[];
};

export type PostDisputeMessageDto = {
  body: string;
  internal?: boolean;
  replyToId?: string;
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
  availableBalance: string;
  reservedBalance: string;
  totalBalance: string;
  currency: string;
};

export type WalletTransaction = {
  id: string;
  type:
    | "credit"
    | "debit"
    | "deposit"
    | "withdrawal"
    | "reserve"
    | "release"
    | "refund"
    | "adjustment";
  direction: "credit" | "debit";
  status: "pending" | "completed" | "failed" | "cancelled";
  amount: string;
  currency: string;
  referenceId?: string | null;
  description?: string | null;
  createdAt: string;
};

// --- Addresses ---

export type Address = {
  id: string;
  label: string;
  fullName: string;
  streetLine1: string;
  streetLine2?: string | null;
  city: string;
  region?: string | null;
  postalCode?: string | null;
  country: string;
  phone?: string | null;
  isDefault?: boolean;
};

export type CreateAddressDto = {
  label: string;
  fullName: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
};

export type UpdateAddressDto = Partial<CreateAddressDto>;

// --- Exchange Rates ---

export type ExchangeRateCurrentResponse = {
  from: string;
  to: string;
  rate: number;
  updatedAt: string;
};

export type ExchangeRateConvertRequest = {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
};

export type ExchangeRateConvertResponse = {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  convertedAmount: number;
  rate: number;
};

// --- Promotions ---

export type CouponValidateRequest = {
  code: string;
  cartId?: string;
};

export type CouponValidateResponse = {
  valid: boolean;
  code: string;
  discountAmount?: number;
  discountPercent?: number;
  message?: string;
};

export type PromotionActiveItem = {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
};

// --- Referrals ---

export type ReferralMeResponse = {
  code: string;
  referralsCount: number;
  // Decimal values are returned as strings per API guide global conventions.
  earnedAmount: string;
  currency: string;
};

export type ReferralRedeemRequest = {
  code: string;
};

// --- Search ---

export type SearchSuggestion = {
  query: string;
  type: "product" | "shop" | "category" | "history";
};

export type SearchHistoryItem = {
  query: string;
  searchedAt: string;
};

// --- Vendor Public ---

export type VendorPublicSummary = {
  id: string;
  legalBusinessName: string;
  tradeName?: string | null;
  shopCount: number;
  countryCode?: string | null;
};

export type VendorPublicProfile = {
  id: string;
  legalBusinessName: string;
  tradeName?: string | null;
  countryCode?: string | null;
  city?: string | null;
  shops: Array<{
    slug: string;
    name: string;
    logoUrl?: string | null;
  }>;
};

// --- Health & Setup ---

export type HealthLiveResponse = {
  status: "ok";
};

export type HealthReadyResponse = {
  status: "ok" | "error";
  checks?: Record<string, { status: "ok" | "error"; message?: string }>;
};

export type HealthBeaconRequest = {
  platform: string;
  appVersion: string;
  deviceId?: string;
};

// --- Viewed Products ---

export type ViewedProduct = {
  productId: string;
  viewedAt: string;
};

// --- Catalog Compare ---

export type CatalogProductCompareRequest = {
  productIds: string[];
};

export type CatalogProductCompareResponse = {
  products: CatalogProductDetail[];
};

// --- Auth Refresh ---

export type AuthRefreshRequest = {
  sessionId: string;
  refreshToken: string;
};

export type AuthRefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
  expires_at?: number;
  sessionId?: string;
  session_id?: string;
};

// --- Catalog ---

export type CatalogProductSummary = {
  id: string;
  slug: string;
  title: string;
  // Decimal values are returned as strings per API guide global conventions.
  wholesalePrice: string;
  moq: number;
  primaryImageUrl?: string | null;
  categoryNames?: string[];
};

export type CatalogProductDetail = CatalogProductSummary & {
  description?: string | null;
  variants: Array<{
    id: string;
    sku: string;
    // Decimal values are returned as strings per API guide global conventions.
    wholesalePrice: string;
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
