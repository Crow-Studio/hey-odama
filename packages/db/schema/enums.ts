import { pgEnum } from "drizzle-orm/pg-core";

export function enumToPgEnum<T extends Record<string, string>>(
  myEnum: T,
): [T[keyof T], ...T[keyof T][]] {
  return Object.values(myEnum) as [T[keyof T], ...T[keyof T][]];
}

/* ===============================================
   USER & STORE ENUMS
   =============================================== */

export enum UserRole {
  OWNER = "owner",
  MANAGER = "manager",
  STAFF = "staff",
}

export const user_role_enum = pgEnum("user_role", enumToPgEnum(UserRole));

/* ===============================================
   CATEGORY ENUMS
   =============================================== */

export enum CategoryVisibility {
  PUBLIC = "public",
  INTERNAL = "internal",
}

export enum CategoryStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export const category_visibility_enum = pgEnum(
  "category_visibility",
  enumToPgEnum(CategoryVisibility),
);

export const category_status_enum = pgEnum(
  "category_status",
  enumToPgEnum(CategoryStatus),
);

/* ===============================================
   PRODUCT ENUMS
   =============================================== */

export enum ProductType {
  PHYSICAL = "physical",
  DIGITAL = "digital",
  LICENSE_KEY = "license_key",
}

export enum ProductStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export const product_type_enum = pgEnum(
  "product_type",
  enumToPgEnum(ProductType),
);

export const product_status_enum = pgEnum(
  "product_status",
  enumToPgEnum(ProductStatus),
);

/* ===============================================
   MEDIA ENUMS
   =============================================== */

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  DOCUMENT = "document",
  AUDIO = "audio",
}

export enum MediaSource {
  UPLOAD = "upload",
  URL = "url",
  IMPORT = "import",
}

export enum MediaEntityType {
  PRODUCT = "product",
  VARIANT = "variant",
  CATEGORY = "category",
  COLLECTION = "collection",
  STORE = "store",
}

export const media_type_enum = pgEnum("media_type", enumToPgEnum(MediaType));

export const media_source_enum = pgEnum(
  "media_source",
  enumToPgEnum(MediaSource),
);

export const media_entity_type_enum = pgEnum(
  "media_entity_type",
  enumToPgEnum(MediaEntityType),
);

/* ===============================================
   PAYMENT & SUBSCRIPTION ENUMS
   =============================================== */

export enum CurrencyEnum {
  USD = "USD",
  KES = "KES",
}

export enum SubscriptionPlanEnum {
  TRIAL = "trial",
  STARTER = "starter",
  GROWTH = "growth",
  ENTERPRISE = "enterprise",
}

export enum BillingCyleEnum {
  MONTHLY = "monthly",
  YEARLY = "yearly",
  TRIAL_PERIOD = "trial_period",
}

export enum SubscriptionStatusEnum {
  TRIALING = "trialing",
  ACTIVE = "active",
  PAST_DUE = "past_due",
  CANCELED = "canceled",
  EXPIRED = "expired",
}

export enum PaymentChannelEnum {
  CARD = "card",
  MOBILE_MONEY = "mobile_money",
  BANK_TRANSFER = "bank_transfer",
  USSD = "ussd",
  QR = "qr",
}

export enum PaymentStatusEnum {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  REFUNDED = "refunded",
  DISPUTED = "disputed",
}

export enum WithdrawalStatusEnum {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELED = "canceled",
}

export enum LedgerEntryTypeEnum {
  CREDIT = "credit",
  DEBIT = "debit",
}

export const subscription_plan = pgEnum(
  "subscription_plan",
  enumToPgEnum(SubscriptionPlanEnum),
);

export const currency_enum = pgEnum(
  "currency_enum",
  enumToPgEnum(CurrencyEnum),
);

export const billing_cyle_enum = pgEnum(
  "billing_cyle_enum",
  enumToPgEnum(BillingCyleEnum),
);

export const subscription_status_enum = pgEnum(
  "subscription_status_enum",
  enumToPgEnum(SubscriptionStatusEnum),
);

export const payment_channel_enum = pgEnum(
  "payment_channel_enum",
  enumToPgEnum(PaymentChannelEnum),
);

export const payment_status_enum = pgEnum(
  "payment_status_enum",
  enumToPgEnum(PaymentStatusEnum),
);

export const withdrawal_status_enum = pgEnum(
  "withdrawal_status_enum",
  enumToPgEnum(WithdrawalStatusEnum),
);

export const ledger_entry_type_enum = pgEnum(
  "ledger_entry_type_enum",
  enumToPgEnum(LedgerEntryTypeEnum),
);

/* ===============================================
   LICENSE ENUMS
   =============================================== */

export enum LicenseKeyStatus {
  AVAILABLE = "available",
  RESERVED = "reserved",
  SOLD = "sold",
  REVOKED = "revoked",
  EXPIRED = "expired",
}

export const license_key_status_enum = pgEnum(
  "license_key_status",
  enumToPgEnum(LicenseKeyStatus),
);
