import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { generateNanoId, pgTable, timestamps } from "./utils";

// user
export const user = pgTable(
  "user",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    email: varchar("email", { length: 255 }).notNull().unique(),
    username: varchar("username", { length: 255 }).notNull(),
    avatar: text("avatar").notNull(),
    password: text("password"),
    subscription_id: varchar("subscription_id", { length: 16 }),
    email_verified: boolean("email_verified").notNull().default(false),
    registered_2fa: boolean("registered_2fa").notNull().default(false),
    ...timestamps,
  },
  (table) => ({
    emailIndex: index("email_index").on(table.email),
  }),
);

export const admin = pgTable(
  "admin",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    email: varchar("email", { length: 255 }).notNull().unique(),
    username: varchar("username", { length: 255 }).notNull(),
    avatar: text("avatar").notNull(),
    password: text("password"),
    email_verified: boolean("email_verified").notNull().default(false),
    registered_2fa: boolean("registered_2fa").notNull().default(false),
    ...timestamps,
  },
  (table) => ({
    emailIndex: index("admin_email_index").on(table.email),
  }),
);

export const customer = pgTable(
  "customer",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    email: varchar("email", { length: 255 }).notNull().unique(),
    username: varchar("username", { length: 255 }).notNull(),
    avatar: text("avatar").notNull(),
    password: text("password"),
    email_verified: boolean("email_verified").notNull().default(false),
    registered_2fa: boolean("registered_2fa").notNull().default(false),
    ...timestamps,
  },
  (table) => ({
    emailIndex: index("customer_email_index").on(table.email),
  }),
);

// OAuth
export const oauth_account = pgTable("oauth_account", {
  id: varchar("id", { length: 16 })
    .primaryKey()
    .$defaultFn(() => generateNanoId()),
  user_id: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  provider_user_id: text("provider_user_id").notNull(),
  ...timestamps,
});

export const admin_oauth_account = pgTable("admin_oauth_account", {
  id: varchar("id", { length: 16 })
    .primaryKey()
    .$defaultFn(() => generateNanoId()),
  admin_id: text("admin_id")
    .notNull()
    .references(() => admin.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  provider_admin_id: text("provider_admin_id").notNull(),
  ...timestamps,
});

export const customer_oauth_account = pgTable("customer_oauth_account", {
  id: varchar("id", { length: 16 })
    .primaryKey()
    .$defaultFn(() => generateNanoId()),
  customer_id: text("customer_id")
    .notNull()
    .references(() => admin.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  provider_customer_id: text("provider_customer_id").notNull(),
  ...timestamps,
});

//  Unique Code
export const unique_code = pgTable(
  "unique_code",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    email: text("email").notNull(),
    code: varchar("code", {
      length: 6,
    }).notNull(),
    expires_at: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    ...timestamps,
  },
  (table) => ({
    codeExactLengthCheck: check(
      "code_exact_length",
      sql`LENGTH(${table.code}) = 6`,
    ),
  }),
);

export const admin_unique_code = pgTable(
  "admin_unique_code",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    email: text("email").notNull(),
    code: varchar("code", {
      length: 6,
    }).notNull(),
    expires_at: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    ...timestamps,
  },
  (table) => ({
    codeExactLengthCheck: check(
      "code_exact_length",
      sql`LENGTH(${table.code}) = 6`,
    ),
  }),
);

export const customer_unique_code = pgTable(
  "customer_unique_code",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    email: text("email").notNull(),
    code: varchar("code", {
      length: 6,
    }).notNull(),
    expires_at: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    ...timestamps,
  },
  (table) => ({
    codeExactLengthCheck: check(
      "code_exact_length",
      sql`LENGTH(${table.code}) = 6`,
    ),
  }),
);

// sessions (user, admin, customer)
export const session = pgTable("session", {
  id: varchar("id", { length: 255 }).primaryKey(),
  user_id: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  two_factor_verified: boolean("two_factor_verified").notNull().default(false),
  ip_address: varchar("ip_address", { length: 100 }),
  location: text("location"),
  device: text("device"),
  browser: text("browser"),
  os: text("os"),
  expires_at: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  ...timestamps,
});

export const admin_session = pgTable("admin_session", {
  id: varchar("id", { length: 255 }).primaryKey(),
  admin_id: text("admin_id")
    .notNull()
    .references(() => admin.id, { onDelete: "cascade" }),
  two_factor_verified: boolean("two_factor_verified").notNull().default(false),
  ip_address: varchar("ip_address", { length: 100 }),
  location: text("location"),
  device: text("device"),
  browser: text("browser"),
  os: text("os"),
  expires_at: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  ...timestamps,
});

export const customer_session = pgTable("customer_session", {
  id: varchar("id", { length: 255 }).primaryKey(),
  customer_id: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  two_factor_verified: boolean("two_factor_verified").notNull().default(false),
  ip_address: varchar("ip_address", { length: 100 }),
  location: text("location"),
  device: text("device"),
  browser: text("browser"),
  os: text("os"),
  expires_at: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  ...timestamps,
});
