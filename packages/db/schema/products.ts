/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  text,
  varchar,
  decimal,
  integer,
  boolean,
  jsonb,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { generateNanoId, pgTable, timestamps } from "./utils";
import {
  category_status_enum,
  category_visibility_enum,
  CategoryStatus,
  CategoryVisibility,
  product_status_enum,
  product_type_enum,
  ProductStatus,
  ProductType,
  media_entity_type_enum,
  media_source_enum,
  media_type_enum,
  MediaSource,
  license_key_status_enum,
  LicenseKeyStatus,
} from "./enums";
import { store } from "./store";

/* ===============================================
   MEDIA GALLERY SYSTEM
   =============================================== */

/* ------------------- Media Folder (For Organization) ------------------- */
export const media_folder = pgTable(
  "media_folder",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    parent_id: varchar("parent_id", { length: 16 }).references(
      (): any => media_folder.id,
      {
        onDelete: "cascade",
      },
    ),
    store_id: text("store_id")
      .notNull()
      .references(() => store.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => ({
    storeIdx: index("media_folder_store_idx").on(table.store_id),
    parentIdx: index("media_folder_parent_idx").on(table.parent_id),
    storeNameUnique: unique("media_folder_store_name_unique").on(
      table.store_id,
      table.name,
      table.parent_id,
    ),
  }),
);

/* ------------------- Media Library (Central Media Storage) ------------------- */
export const media = pgTable(
  "media",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),

    // File Information
    filename: varchar("filename", { length: 255 }).notNull(),
    original_filename: varchar("original_filename", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }),
    alt_text: text("alt_text"),
    caption: text("caption"),

    // File Details
    file_url: text("file_url").notNull(),
    file_size: integer("file_size").notNull(),
    mime_type: varchar("mime_type", { length: 100 }).notNull(),
    media_type: media_type_enum("media_type").notNull(),
    source: media_source_enum("source").notNull().default(MediaSource.UPLOAD),

    // Image-specific fields
    width: integer("width"),
    height: integer("height"),

    // Video-specific fields
    duration: integer("duration"),

    // MinIO Storage Information
    minio_bucket: varchar("minio_bucket", { length: 100 }).notNull(),
    minio_object_key: text("minio_object_key").notNull(),
    minio_etag: text("minio_etag"),

    // Image Variants
    variants: jsonb("variants").$type<{
      thumbnail?: {
        url: string;
        object_key: string;
        width: number;
        height: number;
        size: number;
      };
      small?: {
        url: string;
        object_key: string;
        width: number;
        height: number;
        size: number;
      };
      medium?: {
        url: string;
        object_key: string;
        width: number;
        height: number;
        size: number;
      };
      large?: {
        url: string;
        object_key: string;
        width: number;
        height: number;
        size: number;
      };
      xlarge?: {
        url: string;
        object_key: string;
        width: number;
        height: number;
        size: number;
      };
      original?: {
        url: string;
        object_key: string;
        width: number;
        height: number;
        size: number;
      };
    }>(),

    // Organization
    folder_id: varchar("folder_id", { length: 16 }).references(
      () => media_folder.id,
      {
        onDelete: "set null",
      },
    ),

    // Additional Metadata
    metadata: jsonb("metadata").$type<Record<string, any>>(),

    // Stats
    download_count: integer("download_count").default(0).notNull(),
    view_count: integer("view_count").default(0).notNull(),
    usage_count: integer("usage_count").default(0).notNull(),

    // Ownership
    store_id: text("store_id")
      .notNull()
      .references(() => store.id, { onDelete: "cascade" }),
    uploaded_by: text("uploaded_by"),

    ...timestamps,
  },
  (table) => ({
    storeIdx: index("media_store_idx").on(table.store_id),
    folderIdx: index("media_folder_idx").on(table.folder_id),
    typeIdx: index("media_type_idx").on(table.media_type),
    filenameIdx: index("media_filename_idx").on(table.filename),
    uploadedByIdx: index("media_uploaded_by_idx").on(table.uploaded_by),
    createdAtIdx: index("media_created_at_idx").on(table.created_at),
    minioKeyIdx: index("media_minio_key_idx").on(table.minio_object_key),
  }),
);

/* ------------------- Media Tags (For Organization & Search) ------------------- */
export const media_tag = pgTable(
  "media_tag",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    name: varchar("name", { length: 50 }).notNull(),
    color: varchar("color", { length: 7 }),
    store_id: text("store_id")
      .notNull()
      .references(() => store.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => ({
    storeIdx: index("media_tag_store_idx").on(table.store_id),
    storeNameUnique: unique("media_tag_store_name_unique").on(
      table.store_id,
      table.name,
    ),
  }),
);

/* ------------------- Media Tag Assignments ------------------- */
export const media_tag_assignment = pgTable(
  "media_tag_assignment",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    media_id: varchar("media_id", { length: 16 })
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    tag_id: varchar("tag_id", { length: 16 })
      .notNull()
      .references(() => media_tag.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => ({
    mediaIdx: index("media_tag_assignment_media_idx").on(table.media_id),
    tagIdx: index("media_tag_assignment_tag_idx").on(table.tag_id),
    uniqueAssignment: unique("media_tag_assignment_unique").on(
      table.media_id,
      table.tag_id,
    ),
  }),
);

/* ------------------- Media Associations (Links media to entities) ------------------- */
export const media_association = pgTable(
  "media_association",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),

    media_id: varchar("media_id", { length: 16 })
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),

    // Polymorphic relationship
    entity_type: media_entity_type_enum("entity_type").notNull(),
    entity_id: varchar("entity_id", { length: 16 }).notNull(),

    // Display properties
    position: integer("position").default(0).notNull(),
    is_featured: boolean("is_featured").default(false).notNull(),
    is_thumbnail: boolean("is_thumbnail").default(false).notNull(),

    ...timestamps,
  },
  (table) => ({
    mediaIdx: index("media_association_media_idx").on(table.media_id),
    entityIdx: index("media_association_entity_idx").on(
      table.entity_type,
      table.entity_id,
    ),
    positionIdx: index("media_association_position_idx").on(
      table.entity_id,
      table.position,
    ),
    uniqueAssociation: unique("media_association_unique").on(
      table.media_id,
      table.entity_type,
      table.entity_id,
    ),
  }),
);

/* ===============================================
   PRODUCT SYSTEM
   =============================================== */

/* ------------------- Collection ------------------- */
export const collection = pgTable(
  "collection",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    title: varchar("title", { length: 100 }).notNull(),
    handle: text("handle").notNull(),
    store_id: text("store_id")
      .notNull()
      .references(() => store.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => ({
    storeHandleUnique: unique("collection_store_handle_unique").on(
      table.store_id,
      table.handle,
    ),
    storeTitleUnique: unique("collection_store_title_unique").on(
      table.store_id,
      table.title,
    ),
    storeIdx: index("collection_store_idx").on(table.store_id),
    handleIdx: index("collection_handle_idx").on(table.handle),
  }),
);

/* ------------------- Category ------------------- */
export const category = pgTable(
  "category",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    title: varchar("title", { length: 100 }).notNull(),
    description: text("description"),
    handle: text("handle").notNull(),
    status: category_status_enum("status")
      .notNull()
      .default(CategoryStatus.ACTIVE),
    visibility: category_visibility_enum("visibility")
      .notNull()
      .default(CategoryVisibility.PUBLIC),
    parent_id: varchar("parent_id", { length: 16 }).references(
      (): any => category.id,
      {
        onDelete: "set null",
      },
    ),
    store_id: text("store_id")
      .notNull()
      .references(() => store.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => ({
    storeHandleUnique: unique("category_store_handle_unique").on(
      table.store_id,
      table.handle,
    ),
    storeTitleUnique: unique("category_store_title_unique").on(
      table.store_id,
      table.title,
    ),
    storeIdx: index("category_store_idx").on(table.store_id),
    handleIdx: index("category_handle_idx").on(table.handle),
    parentIdx: index("category_parent_idx").on(table.parent_id),
  }),
);

/* ------------------- Product (Shared Fields) ------------------- */
export const product = pgTable(
  "product",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    name: varchar("name", { length: 100 }).notNull(),
    handle: text("handle").notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    compare_at_price: decimal("compare_at_price", { precision: 10, scale: 2 }),
    cost_price: decimal("cost_price", { precision: 10, scale: 2 }),
    product_type: product_type_enum("product_type")
      .notNull()
      .default(ProductType.PHYSICAL),
    status: product_status_enum("status")
      .notNull()
      .default(ProductStatus.DRAFT),
    sku: varchar("sku", { length: 100 }),
    barcode: varchar("barcode", { length: 100 }),
    has_variants: boolean("has_variants").default(false).notNull(),
    inventory_quantity: integer("inventory_quantity").default(0).notNull(),
    track_inventory: boolean("track_inventory").default(true).notNull(),
    allow_backorder: boolean("allow_backorder").default(false).notNull(),
    taxable: boolean("taxable").default(true).notNull(),
    metadata: jsonb("metadata").$type<Record<string, any>>(),
    store_id: text("store_id")
      .notNull()
      .references(() => store.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => ({
    storeHandleUnique: unique("product_store_handle_unique").on(
      table.store_id,
      table.handle,
    ),
    storeSkuUnique: unique("product_store_sku_unique").on(
      table.store_id,
      table.sku,
    ),
    storeIdx: index("product_store_idx").on(table.store_id),
    handleIdx: index("product_handle_idx").on(table.handle),
    statusIdx: index("product_status_idx").on(table.status),
    typeIdx: index("product_type_idx").on(table.product_type),
  }),
);

/* ------------------- Physical Product (Type-Specific) ------------------- */
export const physical_product = pgTable(
  "physical_product",
  {
    product_id: varchar("product_id", { length: 16 })
      .primaryKey()
      .references(() => product.id, { onDelete: "cascade" }),
    weight: decimal("weight", { precision: 10, scale: 2 }),
    weight_unit: varchar("weight_unit", { length: 10 }).default("kg"),
    requires_shipping: boolean("requires_shipping").default(true).notNull(),
    dimensions: jsonb("dimensions").$type<{
      length?: number;
      width?: number;
      height?: number;
      unit?: string;
    }>(),
    ...timestamps,
  },
  (table) => ({
    productIdx: index("physical_product_idx").on(table.product_id),
  }),
);

/* ------------------- Digital Product (Type-Specific) ------------------- */
export const digital_product = pgTable(
  "digital_product",
  {
    product_id: varchar("product_id", { length: 16 })
      .primaryKey()
      .references(() => product.id, { onDelete: "cascade" }),
    file_type: varchar("file_type", { length: 10 }), // Added to match form
    auto_deliver: boolean("auto_deliver").default(true).notNull(), // Added to match form
    ...timestamps,
  },
  (table) => ({
    productIdx: index("digital_product_idx").on(table.product_id),
  }),
);

/* ------------------- License Product (Type-Specific) ------------------- */
export const license_product = pgTable(
  "license_product",
  {
    product_id: varchar("product_id", { length: 16 })
      .primaryKey()
      .references(() => product.id, { onDelete: "cascade" }),
    auto_deliver_license: boolean("auto_deliver_license")
      .default(true)
      .notNull(),
    download_limit: integer("download_limit"),
    duration_days: integer("duration_days"),
    ...timestamps,
  },
  (table) => ({
    productIdx: index("license_product_idx").on(table.product_id),
  }),
);

/* ------------------- Product Categories ------------------- */
export const product_category = pgTable(
  "product_category",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    product_id: varchar("product_id", { length: 16 })
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    category_id: varchar("category_id", { length: 16 })
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => ({
    productCategoryUnique: unique("product_category_unique").on(
      table.product_id,
      table.category_id,
    ),
    productIdx: index("product_category_product_idx").on(table.product_id),
    categoryIdx: index("product_category_category_idx").on(table.category_id),
  }),
);

/* ------------------- Product Collection ------------------- */
export const product_collection = pgTable(
  "product_collection",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    product_id: varchar("product_id", { length: 16 })
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    collection_id: varchar("collection_id", { length: 16 })
      .notNull()
      .references(() => collection.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => ({
    productCollectionUnique: unique("product_collection_unique").on(
      table.product_id,
      table.collection_id,
    ),
    productIdx: index("product_collection_product_idx").on(table.product_id),
    collectionIdx: index("product_collection_collection_idx").on(
      table.collection_id,
    ),
  }),
);

/* ------------------- Product Variants ------------------- */
export const product_variant = pgTable(
  "product_variant",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    product_id: varchar("product_id", { length: 16 })
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 100 }).notNull(),
    sku: varchar("sku", { length: 100 }),
    barcode: varchar("barcode", { length: 100 }),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    compare_at_price: decimal("compare_at_price", { precision: 10, scale: 2 }),
    cost_price: decimal("cost_price", { precision: 10, scale: 2 }),
    inventory_quantity: integer("inventory_quantity").default(0).notNull(),
    weight: decimal("weight", { precision: 10, scale: 2 }),
    position: integer("position").default(0).notNull(),
    download_limit: integer("download_limit"), // Added for digital/license consistency
    access_duration: integer("access_duration"), // Added for digital/license consistency
    ...timestamps,
  },
  (table) => ({
    productSkuUnique: unique("variant_product_sku_unique").on(
      table.product_id,
      table.sku,
    ),
    productIdx: index("product_variant_product_idx").on(table.product_id),
    skuIdx: index("product_variant_sku_idx").on(table.sku),
  }),
);

/* ------------------- Digital Product Files ------------------- */
export const digital_product_file = pgTable(
  "digital_product_file",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    product_id: varchar("product_id", { length: 16 })
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    variant_id: varchar("variant_id", { length: 16 }).references(
      () => product_variant.id,
      {
        onDelete: "cascade",
      },
    ),
    filename: varchar("filename", { length: 255 }).notNull(),
    file_size: integer("file_size"),
    mime_type: varchar("mime_type", { length: 100 }),
    download_limit: integer("download_limit"),

    // MinIO Storage
    minio_bucket: varchar("minio_bucket", { length: 100 }).notNull(),
    minio_object_key: text("minio_object_key").notNull(),
    file_url: text("file_url").notNull(),

    ...timestamps,
  },
  (table) => ({
    productIdx: index("digital_file_product_idx").on(table.product_id),
    variantIdx: index("digital_file_variant_idx").on(table.variant_id),
  }),
);

/* ===============================================
   LICENSE KEY SYSTEM (UPDATED FOR VARIANT-BASED KEYS)
   =============================================== */

/* ------------------- License Key Inventory ------------------- */
export const license_key = pgTable(
  "license_key",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),

    // What product/variant this key belongs to
    product_id: varchar("product_id", { length: 16 })
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),

    variant_id: varchar("variant_id", { length: 16 })
      .notNull()
      .references(() => product_variant.id, { onDelete: "cascade" }),

    // The actual license key
    key: text("key").notNull(),

    // Key status and lifecycle
    status: license_key_status_enum("status")
      .notNull()
      .default(LicenseKeyStatus.AVAILABLE),

    // Optional metadata
    batch_id: varchar("batch_id", { length: 16 }),
    notes: text("notes"),

    // Expiration (if applicable)
    expires_at: timestamp("expires_at", { mode: "date", precision: 3 }),

    // Store reference
    store_id: text("store_id")
      .notNull()
      .references(() => store.id, { onDelete: "cascade" }),

    ...timestamps,
  },
  (table) => ({
    productIdx: index("license_key_product_idx").on(table.product_id),
    variantIdx: index("license_key_variant_idx").on(table.variant_id),
    statusIdx: index("license_key_status_idx").on(table.status),
    storeIdx: index("license_key_store_idx").on(table.store_id),
    batchIdx: index("license_key_batch_idx").on(table.batch_id),
    uniqueKey: unique("license_key_unique").on(table.variant_id, table.key),
  }),
);

/* ------------------- License Key Assignment (Links keys to orders) ------------------- */
export const license_key_assignment = pgTable(
  "license_key_assignment",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),

    // The license key that was assigned
    license_key_id: varchar("license_key_id", { length: 16 })
      .notNull()
      .references(() => license_key.id, { onDelete: "restrict" }),

    // Who it was assigned to
    order_id: text("order_id").notNull(),
    order_item_id: text("order_item_id"),
    customer_id: text("customer_id"),
    customer_email: text("customer_email"),

    // Assignment metadata
    assigned_at: timestamp("assigned_at", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
    download_count: integer("download_count").default(0).notNull(),
    download_limit: integer("download_limit"),
    last_downloaded_at: timestamp("last_downloaded_at", {
      mode: "date",
      precision: 3,
    }),

    // Revocation
    revoked: boolean("revoked").default(false).notNull(),
    revoked_at: timestamp("revoked_at", { mode: "date", precision: 3 }),
    revoked_reason: text("revoked_reason"),

    ...timestamps,
  },
  (table) => ({
    licenseKeyIdx: index("license_key_assignment_key_idx").on(
      table.license_key_id,
    ),
    orderIdx: index("license_key_assignment_order_idx").on(table.order_id),
    customerIdx: index("license_key_assignment_customer_idx").on(
      table.customer_id,
    ),
    emailIdx: index("license_key_assignment_email_idx").on(
      table.customer_email,
    ),
    uniqueAssignment: unique("license_key_assignment_unique").on(
      table.license_key_id,
    ),
  }),
);

/* ------------------- License Key Batch (For bulk imports) ------------------- */
export const license_key_batch = pgTable(
  "license_key_batch",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),

    product_id: varchar("product_id", { length: 16 })
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),

    variant_id: varchar("variant_id", { length: 16 })
      .notNull()
      .references(() => product_variant.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    total_keys: integer("total_keys").notNull(),

    store_id: text("store_id")
      .notNull()
      .references(() => store.id, { onDelete: "cascade" }),
    imported_by: text("imported_by"),

    ...timestamps,
  },
  (table) => ({
    productIdx: index("license_key_batch_product_idx").on(table.product_id),
    variantIdx: index("license_key_batch_variant_idx").on(table.variant_id),
    storeIdx: index("license_key_batch_store_idx").on(table.store_id),
  }),
);

/* ===============================================
   DEPRECATED: Legacy product_image table
   =============================================== */
export const product_image = pgTable(
  "product_image",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    product_id: varchar("product_id", { length: 16 })
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    urls: jsonb("urls").$type<{
      thumbnail?: string;
      medium?: string;
      large?: string;
      original: string;
    }>(),
    alt_text: text("alt_text"),
    position: integer("position").default(0).notNull(),
    ...timestamps,
  },
  (table) => ({
    productIdx: index("product_image_product_idx").on(table.product_id),
    positionIdx: index("product_image_position_idx").on(
      table.product_id,
      table.position,
    ),
  }),
);
