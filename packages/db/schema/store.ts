import {
  boolean,
  index,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import * as enums from "./enums";
import { user } from "./user";
import { generateNanoId, pgTable } from "./utils";

// stores
export const store = pgTable(
  "stores",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    owner_id: varchar("owner_id", { length: 16 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    url: text("url").unique().notNull(),
    currency: enums
      .currency_enum("currency")
      .default(enums.CurrencyEnum.KES)
      .notNull(),
    active: boolean("active").default(true).notNull(),
    created_at: timestamp("created_at", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
  },
  (t) => ({ ownerIdx: index("stores_owner_idx").on(t.owner_id) }),
);

// store members
export const store_members = pgTable(
  "store_members",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    user_id: varchar("user_id", { length: 16 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    store_id: varchar("store_id", { length: 16 })
      .notNull()
      .references(() => store.id, { onDelete: "cascade" }),
    role: enums.user_role_enum("role").default(enums.UserRole.STAFF),
    created_at: timestamp("created_at", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
  },
  (t) => ({
    uniqueStoreUser: unique("store_members_user_store_unique").on(
      t.user_id,
      t.store_id,
    ),
  }),
);
