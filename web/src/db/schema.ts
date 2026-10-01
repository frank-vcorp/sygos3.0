import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "ADMINISTRADOR",
  "CEO",
  "COORDINACION_ADMINISTRACION",
  "GERENTE_OPERATIVO_SYSTRON",
  "GERENTE_OPERATIVO_SERVOMOTORES",
  "SUPERVISOR_TECNICO_SYSTRON",
  "TECNICO_SYSTRON",
  "VENTAS_SYSTRON",
  "ALMACEN_SYSTRON",
  "AYUDANTE_GENERAL_SERVOMOTORES",
  "KIOSCO",
]);

export const integrationProviderEnum = pgEnum("integration_provider", [
  "facturapi",
  "sendgrid",
  "whatsapp",
]);

export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull(),
    homeCompanyId: uuid("home_company_id").references(() => companies.id),
    mustChangePassword: boolean("must_change_password").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("users_username_unique").on(t.username)],
);

export const userCompanyAccess = pgTable(
  "user_company_access",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("user_company_access_unique").on(t.userId, t.companyId),
  ],
);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  activeCompanyId: uuid("active_company_id")
    .notNull()
    .references(() => companies.id),
  effectiveUserId: uuid("effective_user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const viewAsLogs = pgTable("view_as_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id")
    .notNull()
    .references(() => users.id),
  targetUserId: uuid("target_user_id")
    .notNull()
    .references(() => users.id),
  startedAt: timestamp("started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const companyIntegrations = pgTable(
  "company_integrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    provider: integrationProviderEnum("provider").notNull(),
    enabled: boolean("enabled").default(false).notNull(),
    configCiphertext: text("config_ciphertext"),
    configHint: text("config_hint"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("company_integrations_unique").on(t.companyId, t.provider),
  ],
);

export const clientClassificationEnum = pgEnum("client_classification", [
  "NORMAL",
  "PREMIUM",
]);

export const prospectStatusEnum = pgEnum("prospect_status", [
  "NUEVO",
  "EN_SEGUIMIENTO",
  "CONVERTIDO",
  "DESCARTADO",
]);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    legalName: text("legal_name").notNull(),
    classification: clientClassificationEnum("classification"),
    commercialResponsibleUserId: uuid("commercial_responsible_user_id")
      .notNull()
      .references(() => users.id),
    requiresInvoice: boolean("requires_invoice").default(false).notNull(),
    creditDays: integer("credit_days"),
    deliveryAddress: text("delivery_address"),
    taxLegalName: text("tax_legal_name"),
    taxRfc: text("tax_rfc"),
    taxRegime: text("tax_regime"),
    taxZip: text("tax_zip"),
    isActive: boolean("is_active").default(true).notNull(),
    originProspectId: uuid("origin_prospect_id"),
    createdByActorUserId: uuid("created_by_actor_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("clients_company_legal_name_unique").on(
      t.companyId,
      t.legalName,
    ),
  ],
);

export const clientContacts = pgTable("client_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  jobTitle: text("job_title"),
  email: text("email"),
  isPrimary: boolean("is_primary").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const prospects = pgTable("prospects", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  responsibleUserId: uuid("responsible_user_id")
    .notNull()
    .references(() => users.id),
  source: text("source"),
  notes: text("notes"),
  status: prospectStatusEnum("status").default("NUEVO").notNull(),
  convertedClientId: uuid("converted_client_id").references(() => clients.id),
  createdByActorUserId: uuid("created_by_actor_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    legalName: text("legal_name").notNull(),
    contactName: text("contact_name"),
    phone: text("phone"),
    email: text("email"),
    creditDays: integer("credit_days"),
    emitsFiscalInvoice: boolean("emits_fiscal_invoice").default(true).notNull(),
    category: text("category"),
    taxRfc: text("tax_rfc"),
    isActive: boolean("is_active").default(true).notNull(),
    isSystemFixed: boolean("is_system_fixed").default(false).notNull(),
    createdByActorUserId: uuid("created_by_actor_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("suppliers_company_legal_name_unique").on(
      t.companyId,
      t.legalName,
    ),
  ],
);

export const folioSequences = pgTable(
  "folio_sequences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    folioType: text("folio_type").notNull(),
    lastValue: integer("last_value").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("folio_sequences_company_type_unique").on(
      t.companyId,
      t.folioType,
    ),
  ],
);

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type IntegrationProvider =
  (typeof integrationProviderEnum.enumValues)[number];
export type ProspectStatus = (typeof prospectStatusEnum.enumValues)[number];
