import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { admin, session, unique_code, user } from "./user";
import type { store, store_members } from "./store";
import type { subscriptions, subs_transactions } from "./payments";
import type {
  category,
  collection,
  product,
  product_variant,
  product_category,
  product_collection,
  product_image,
  digital_product_file,
  license_key,
  media,
  media_folder,
  media_tag,
  media_association,
  media_tag_assignment,
} from "./products";

/* ===============================================
   USER & AUTH TYPES
   =============================================== */
export type User = InferSelectModel<typeof user>;
export type Admin = InferSelectModel<typeof admin>;
export type NewUser = InferInsertModel<typeof user>;
export type Session = InferSelectModel<typeof session>;
export type NewSession = InferInsertModel<typeof session>;
export type UniqueCode = InferSelectModel<typeof unique_code>;
export type NewUniqueCode = InferInsertModel<typeof unique_code>;

/* ===============================================
   STORE TYPES
   =============================================== */
export type Store = InferSelectModel<typeof store>;
export type NewStore = InferInsertModel<typeof store>;
export type StoreMember = InferSelectModel<typeof store_members>;
export type NewStoreMember = InferInsertModel<typeof store_members>;

/* ===============================================
   SUBSCRIPTION & PAYMENT TYPES
   =============================================== */
export type Subscription = InferSelectModel<typeof subscriptions>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;
export type SubscriptionTransaction = InferSelectModel<
  typeof subs_transactions
>;
export type NewSubscriptionTransaction = InferInsertModel<
  typeof subs_transactions
>;

/* ===============================================
   PRODUCT CATALOG TYPES
   =============================================== */
export type Collection = InferSelectModel<typeof collection>;
export type NewCollection = InferInsertModel<typeof collection>;
export type Category = InferSelectModel<typeof category>;
export type NewCategory = InferInsertModel<typeof category>;

export type Product = InferSelectModel<typeof product>;
export type NewProduct = InferInsertModel<typeof product>;
export type ProductVariant = InferSelectModel<typeof product_variant>;
export type NewProductVariant = InferInsertModel<typeof product_variant>;

export type ProductCategory = InferSelectModel<typeof product_category>;
export type NewProductCategory = InferInsertModel<typeof product_category>;
export type ProductCollection = InferSelectModel<typeof product_collection>;
export type NewProductCollection = InferInsertModel<typeof product_collection>;

// Legacy product image type (deprecated - use Media instead)
export type ProductImage = InferSelectModel<typeof product_image>;
export type NewProductImage = InferInsertModel<typeof product_image>;

/* ===============================================
   DIGITAL PRODUCT TYPES
   =============================================== */
export type DigitalProductFile = InferSelectModel<typeof digital_product_file>;
export type NewDigitalProductFile = InferInsertModel<
  typeof digital_product_file
>;
export type LicenseKey = InferSelectModel<typeof license_key>;
export type NewLicenseKey = InferInsertModel<typeof license_key>;

/* ===============================================
   MEDIA GALLERY TYPES
   =============================================== */
export type Media = InferSelectModel<typeof media>;
export type NewMedia = InferInsertModel<typeof media>;

export type MediaFolder = InferSelectModel<typeof media_folder>;
export type NewMediaFolder = InferInsertModel<typeof media_folder>;

export type MediaTag = InferSelectModel<typeof media_tag>;
export type NewMediaTag = InferInsertModel<typeof media_tag>;

export type MediaAssociation = InferSelectModel<typeof media_association>;
export type NewMediaAssociation = InferInsertModel<typeof media_association>;

export type MediaTagAssignment = InferSelectModel<typeof media_tag_assignment>;
export type NewMediaTagAssignment = InferInsertModel<
  typeof media_tag_assignment
>;

/* ===============================================
   EXTENDED TYPES (With Relations)
   =============================================== */

// Product with all relations
export type ProductWithRelations = Product & {
  store?: Store;
  productCollections?: ProductCollection[];
  productCategories?: (ProductCategory & { category?: Category })[];
  product_variants?: ProductVariant[];
  digital_product_files?: DigitalProductFile[];
  license_keys?: LicenseKey[];
  product_images?: ProductImage[]; // Legacy
};

// Product with media (new system)
export type ProductWithMedia = Product & {
  media?: (MediaAssociation & { media: Media })[];
};

// Media with full details
export type MediaWithDetails = Media & {
  folder?: MediaFolder;
  tagAssignments?: (MediaTagAssignment & { tag: MediaTag })[];
  associations?: MediaAssociation[];
};

// Category with hierarchy
export type CategoryWithHierarchy = Category & {
  parent?: Category;
  children?: Category[];
  productCategories?: ProductCategory[];
};

// Store with members
export type StoreWithMembers = Store & {
  owner?: User;
  members?: (StoreMember & { user: User })[];
};

/* ===============================================
   UTILITY TYPES
   =============================================== */

// Image variant structure
export type ImageVariant = {
  url: string;
  object_key: string;
  width: number;
  height: number;
  size: number;
};

export type ImageVariants = {
  thumbnail?: ImageVariant;
  small?: ImageVariant;
  medium?: ImageVariant;
  large?: ImageVariant;
  xlarge?: ImageVariant;
  original?: ImageVariant;
};

// Media upload options
export type MediaUploadOptions = {
  folderId?: string;
  title?: string;
  altText?: string;
  caption?: string;
  tags?: string[];
};

// Media attachment options
export type MediaAttachmentOptions = {
  position?: number;
  isFeatured?: boolean;
  isThumbnail?: boolean;
};

// Media query options
export type MediaQueryOptions = {
  folderId?: string;
  mediaType?: "image" | "video" | "document" | "audio";
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
};

// Product creation with media
export type ProductCreateInput = Omit<
  NewProduct,
  "id" | "created_at" | "updated_at"
> & {
  mediaIds?: string[]; // Existing media IDs to attach
  categoryIds?: string[];
  collectionId?: string;
  variants?: Omit<
    NewProductVariant,
    "id" | "product_id" | "created_at" | "updated_at"
  >[];
};

// Media statistics
export type MediaStatistics = {
  totalFiles: number;
  totalSize: number;
  imageCount: number;
  videoCount: number;
  documentCount: number;
  totalDownloads: number;
  totalViews: number;
};
