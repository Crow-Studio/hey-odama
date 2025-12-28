import { relations } from "drizzle-orm";
import { subs_transactions, subscriptions } from "./payments";
import { store, store_members } from "./store";
import { user } from "./user";
import {
  category,
  collection,
  digital_product_file,
  license_key,
  license_key_assignment,
  license_key_batch,
  physical_product,
  digital_product,
  license_product,
  product,
  product_category,
  product_collection,
  product_image,
  product_variant,
  media,
  media_association,
  media_folder,
  media_tag,
  media_tag_assignment,
} from "./products";

/* ===============================================
   USER & STORE RELATIONS
   =============================================== */

export const users_relations = relations(user, ({ many }) => ({
  stores: many(store),
  memberships: many(store_members),
  subscriptions: many(subscriptions),
  uploadedMedia: many(media),
}));

export const store_relations = relations(store, ({ one, many }) => ({
  owner: one(user, { fields: [store.owner_id], references: [user.id] }),
  members: many(store_members),
  collections: many(collection),
  categories: many(category),
  products: many(product),
  mediaLibrary: many(media),
  mediaFolders: many(media_folder),
  mediaTags: many(media_tag),
  licenseKeys: many(license_key),
  licenseBatches: many(license_key_batch),
}));

export const store_members_relations = relations(store_members, ({ one }) => ({
  user: one(user, { fields: [store_members.user_id], references: [user.id] }),
  store: one(store, {
    fields: [store_members.store_id],
    references: [store.id],
  }),
}));

/* ===============================================
   SUBSCRIPTION RELATIONS
   =============================================== */

export const subscriptions_relations = relations(
  subscriptions,
  ({ one, many }) => ({
    user: one(user, { fields: [subscriptions.user_id], references: [user.id] }),
    transactions: many(subs_transactions),
  }),
);

export const subs_transactions_relations = relations(
  subs_transactions,
  ({ one }) => ({
    subscription: one(subscriptions, {
      fields: [subs_transactions.subscription_id],
      references: [subscriptions.id],
    }),
  }),
);

/* ===============================================
   MEDIA GALLERY RELATIONS
   =============================================== */

export const mediaFolderRelations = relations(
  media_folder,
  ({ one, many }) => ({
    store: one(store, {
      fields: [media_folder.store_id],
      references: [store.id],
    }),
    parent: one(media_folder, {
      fields: [media_folder.parent_id],
      references: [media_folder.id],
      relationName: "subfolders",
    }),
    children: many(media_folder, { relationName: "subfolders" }),
    media: many(media),
  }),
);

export const mediaRelations = relations(media, ({ one, many }) => ({
  store: one(store, {
    fields: [media.store_id],
    references: [store.id],
  }),
  folder: one(media_folder, {
    fields: [media.folder_id],
    references: [media_folder.id],
  }),
  uploader: one(user, {
    fields: [media.uploaded_by],
    references: [user.id],
  }),
  associations: many(media_association),
  tagAssignments: many(media_tag_assignment),
}));

export const mediaAssociationRelations = relations(
  media_association,
  ({ one }) => ({
    media: one(media, {
      fields: [media_association.media_id],
      references: [media.id],
    }),
    // Note: Polymorphic relations to products, variants, categories, etc.
    // are handled at the application level based on entity_type
  }),
);

export const mediaTagRelations = relations(media_tag, ({ one, many }) => ({
  store: one(store, {
    fields: [media_tag.store_id],
    references: [store.id],
  }),
  tagAssignments: many(media_tag_assignment),
}));

export const mediaTagAssignmentRelations = relations(
  media_tag_assignment,
  ({ one }) => ({
    media: one(media, {
      fields: [media_tag_assignment.media_id],
      references: [media.id],
    }),
    tag: one(media_tag, {
      fields: [media_tag_assignment.tag_id],
      references: [media_tag.id],
    }),
  }),
);

/* ===============================================
   PRODUCT CATALOG RELATIONS
   =============================================== */

export const collectionRelations = relations(collection, ({ one, many }) => ({
  store: one(store, {
    fields: [collection.store_id],
    references: [store.id],
  }),
  productCollections: many(product_collection),
}));

export const categoryRelations = relations(category, ({ one, many }) => ({
  store: one(store, {
    fields: [category.store_id],
    references: [store.id],
  }),
  parent: one(category, {
    fields: [category.parent_id],
    references: [category.id],
    relationName: "subcategories",
  }),
  children: many(category, { relationName: "subcategories" }),
  productCategories: many(product_category),
}));

export const productRelations = relations(product, ({ one, many }) => ({
  store: one(store, {
    fields: [product.store_id],
    references: [store.id],
  }),
  productCollections: many(product_collection),
  productCategories: many(product_category),
  product_variants: many(product_variant),
  digital_product_files: many(digital_product_file),
  license_keys: many(license_key),
  license_batches: many(license_key_batch),

  // Type-specific extensions
  physical: one(physical_product, {
    fields: [product.id],
    references: [physical_product.product_id],
  }),
  digital: one(digital_product, {
    fields: [product.id],
    references: [digital_product.product_id],
  }),
  license: one(license_product, {
    fields: [product.id],
    references: [license_product.product_id],
  }),

  // Legacy image system (deprecated)
  product_images: many(product_image),

  // New media system (recommended)
  // Access via media_association with entity_type = 'product'
}));

export const physicalProductRelations = relations(
  physical_product,
  ({ one }) => ({
    product: one(product, {
      fields: [physical_product.product_id],
      references: [product.id],
    }),
  }),
);

export const digitalProductRelations = relations(
  digital_product,
  ({ one }) => ({
    product: one(product, {
      fields: [digital_product.product_id],
      references: [product.id],
    }),
  }),
);

export const licenseProductRelations = relations(
  license_product,
  ({ one }) => ({
    product: one(product, {
      fields: [license_product.product_id],
      references: [product.id],
    }),
  }),
);

export const productCollectionRelations = relations(
  product_collection,
  ({ one }) => ({
    product: one(product, {
      fields: [product_collection.product_id],
      references: [product.id],
    }),
    collection: one(collection, {
      fields: [product_collection.collection_id],
      references: [collection.id],
    }),
  }),
);

export const productCategoryRelations = relations(
  product_category,
  ({ one }) => ({
    product: one(product, {
      fields: [product_category.product_id],
      references: [product.id],
    }),
    category: one(category, {
      fields: [product_category.category_id],
      references: [category.id],
    }),
  }),
);

export const productImageRelations = relations(product_image, ({ one }) => ({
  product: one(product, {
    fields: [product_image.product_id],
    references: [product.id],
  }),
}));

export const productVariantRelations = relations(
  product_variant,
  ({ one, many }) => ({
    product: one(product, {
      fields: [product_variant.product_id],
      references: [product.id],
    }),
    digitalFiles: many(digital_product_file),
    // UPDATED: License keys now always belong to variants
    licenseKeys: many(license_key),
    licenseBatches: many(license_key_batch),
    // Variants can also have media via media_association with entity_type = 'variant'
  }),
);

export const digitalProductFileRelations = relations(
  digital_product_file,
  ({ one }) => ({
    product: one(product, {
      fields: [digital_product_file.product_id],
      references: [product.id],
    }),
    variant: one(product_variant, {
      fields: [digital_product_file.variant_id],
      references: [product_variant.id],
    }),
  }),
);

/* ===============================================
   LICENSE KEY RELATIONS (UPDATED)
   =============================================== */

export const licenseKeyRelations = relations(license_key, ({ one, many }) => ({
  product: one(product, {
    fields: [license_key.product_id],
    references: [product.id],
  }),
  // UPDATED: variant is now required (NOT NULL)
  variant: one(product_variant, {
    fields: [license_key.variant_id],
    references: [product_variant.id],
  }),
  store: one(store, {
    fields: [license_key.store_id],
    references: [store.id],
  }),
  batch: one(license_key_batch, {
    fields: [license_key.batch_id],
    references: [license_key_batch.id],
  }),
  assignments: many(license_key_assignment),
}));

export const licenseKeyAssignmentRelations = relations(
  license_key_assignment,
  ({ one }) => ({
    license_key: one(license_key, {
      fields: [license_key_assignment.license_key_id],
      references: [license_key.id],
    }),
    // Note: Relations to order, customer, etc., can be added if those tables are defined
  }),
);

export const licenseKeyBatchRelations = relations(
  license_key_batch,
  ({ one, many }) => ({
    product: one(product, {
      fields: [license_key_batch.product_id],
      references: [product.id],
    }),
    // UPDATED: variant is now required (NOT NULL)
    variant: one(product_variant, {
      fields: [license_key_batch.variant_id],
      references: [product_variant.id],
    }),
    store: one(store, {
      fields: [license_key_batch.store_id],
      references: [store.id],
    }),
    imported_by: one(user, {
      fields: [license_key_batch.imported_by],
      references: [user.id],
    }),
    keys: many(license_key),
  }),
);
