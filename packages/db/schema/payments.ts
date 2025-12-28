/* ------------------- PAYMENTS ------------------- */
import { index, integer, text, timestamp, varchar } from "drizzle-orm/pg-core";
import * as enums from "./enums";
import { user } from "./user";
import { generateNanoId, pgTable } from "./utils";

// subscriptions
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: varchar("id", { length: 16 })
      .primaryKey()
      .$defaultFn(() => generateNanoId()),
    user_id: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: enums
      .subscription_status_enum("status")
      .default(enums.SubscriptionStatusEnum.TRIALING)
      .notNull(),
    current_period_start: timestamp("current_period_start")
      .defaultNow()
      .notNull(),
    subscription_plan: enums
      .subscription_plan("subscription_plan")
      .default(enums.SubscriptionPlanEnum.TRIAL)
      .notNull(),
    billing_cycle: enums
      .billing_cyle_enum("billing_cycle")
      .default(enums.BillingCyleEnum.TRIAL_PERIOD)
      .notNull(),
    current_period_end: timestamp("current_period_end").notNull(),
    created_at: timestamp("created_at", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
  },
  (t) => ({ userIdx: index("user_subscriptions_user_idx").on(t.user_id) }),
);

// subscriptions transactions
export const subs_transactions = pgTable("subs_transactions", {
  id: varchar("id", { length: 16 })
    .primaryKey()
    .$defaultFn(() => generateNanoId()),
  subscription_id: text("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  paystack_reference: varchar("paystack_reference", { length: 255 }).notNull(),
  paystack_trxref: varchar("paystack_trxref", { length: 255 }).notNull(),
  currency: enums
    .currency_enum("currency")
    .default(enums.CurrencyEnum.KES)
    .notNull(),
  paystack_transaction_id: varchar("paystack_transaction_id", {
    length: 255,
  }).notNull(),
  created_at: timestamp("created_at", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(
    () => new Date(),
  ),
});
