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

export const companySettings = pgTable("company_settings", {
  companyId: uuid("company_id")
    .primaryKey()
    .references(() => companies.id, { onDelete: "cascade" }),
  tradeName: text("trade_name"),
  taxLegalName: text("tax_legal_name"),
  taxRfc: text("tax_rfc"),
  taxRegime: text("tax_regime"),
  taxZip: text("tax_zip"),
  address: text("address"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  logoUrl: text("logo_url"),
  directPurchaseMonthlyLimitMxn: integer("direct_purchase_monthly_limit_mxn")
    .default(5000)
    .notNull(),
  directPurchaseIndividualLimitMxn: integer(
    "direct_purchase_individual_limit_mxn",
  )
    .default(2000)
    .notNull(),
  servomotoresInventoryEnabled: boolean("servomotores_inventory_enabled")
    .default(false)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
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
    vendorDiscountLimitPct: integer("vendor_discount_limit_pct"),
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

export const globalFolioSequences = pgTable("global_folio_sequences", {
  folioType: text("folio_type").primaryKey(),
  lastValue: integer("last_value").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const equiCustodyStatusEnum = pgEnum("equi_custody_status", [
  "AWAITING_ENTRY",
  "IN_CUSTODY",
  "OUT",
  "TRIAL_OUT",
]);

export const motorOriginEnum = pgEnum("motor_origin", [
  "SYSTRON",
  "SERVOMOTORES_DIRECT",
]);

export const servomotoresIntakeStatusEnum = pgEnum("servomotores_intake_status", [
  "NOT_APPLICABLE",
  "PENDING_INTAKE",
  "IN_CUSTODY",
  "OUT",
  "TRIAL_OUT",
]);

export const physicalMovementTypeEnum = pgEnum("physical_movement_type", [
  "ENTRY",
  "EXIT",
  "TRIAL_OUT",
  "TRIAL_RETURN",
  "DEFINITIVE_EXIT",
  "INGRESO",
  "EGRESO",
]);

export const physicalEntityTypeEnum = pgEnum("physical_entity_type", [
  "EQUI",
  "MOT",
]);

export const workOrderStatusEnum = pgEnum("work_order_status", [
  "OPEN",
  "CLOSED",
]);

export const sparePartRequestStatusEnum = pgEnum("spare_part_request_status", [
  "SOLICITADA",
  "EN_TRANSITO",
  "EN_ALMACEN",
  "SURTIDA",
]);

export const inventoryMovementKindEnum = pgEnum("inventory_movement_kind", [
  "RECEIPT",
  "ISSUE",
  "ADJUSTMENT",
  "IMPORT",
]);

export const equipmentTypes = pgTable(
  "equipment_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("equipment_types_company_name_unique").on(
      t.companyId,
      t.name,
    ),
  ],
);

export const equipmentBrands = pgTable(
  "equipment_brands",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("equipment_brands_company_name_unique").on(
      t.companyId,
      t.name,
    ),
  ],
);

export const equiUnits = pgTable(
  "equi_units",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    folioNumber: integer("folio_number").notNull(),
    typeId: uuid("type_id")
      .notNull()
      .references(() => equipmentTypes.id),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => equipmentBrands.id),
    model: text("model").notNull(),
    description: text("description"),
    serialNumber: text("serial_number"),
    custodyStatus: equiCustodyStatusEnum("custody_status")
      .default("AWAITING_ENTRY")
      .notNull(),
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
    uniqueIndex("equi_units_company_folio_unique").on(
      t.companyId,
      t.folioNumber,
    ),
  ],
);

export const motors = pgTable("motors", {
  id: uuid("id").defaultRandom().primaryKey(),
  folioNumber: integer("folio_number").notNull().unique(),
  origin: motorOriginEnum("origin").notNull(),
  originCompanyId: uuid("origin_company_id")
    .notNull()
    .references(() => companies.id),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  identification: text("identification").notNull(),
  brand: text("brand"),
  model: text("model"),
  serialNumber: text("serial_number"),
  notes: text("notes"),
  servomotoresIntakeStatus: servomotoresIntakeStatusEnum(
    "servomotores_intake_status",
  )
    .default("NOT_APPLICABLE")
    .notNull(),
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

export const physicalMovements = pgTable("physical_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  entityType: physicalEntityTypeEnum("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  movementType: physicalMovementTypeEnum("movement_type").notNull(),
  motive: text("motive"),
  receiverName: text("receiver_name"),
  receiverNotes: text("receiver_notes"),
  enablingDocumentRef: text("enabling_document_ref"),
  performedByActorUserId: uuid("performed_by_actor_user_id")
    .notNull()
    .references(() => users.id),
  occurredAt: timestamp("occurred_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const workOrders = pgTable(
  "work_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    folioNumber: integer("folio_number").notNull(),
    equiId: uuid("equi_id").references(() => equiUnits.id),
    motorId: uuid("motor_id").references(() => motors.id),
    status: workOrderStatusEnum("status").default("OPEN").notNull(),
    summary: text("summary"),
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
    uniqueIndex("work_orders_company_folio_unique").on(
      t.companyId,
      t.folioNumber,
    ),
  ],
);

export const inventoryParts = pgTable(
  "inventory_parts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    partNumber: text("part_number").notNull(),
    description: text("description").notNull(),
    quantityOnHand: integer("quantity_on_hand").default(0).notNull(),
    minQty: integer("min_qty"),
    maxQty: integer("max_qty"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("inventory_parts_company_part_unique").on(
      t.companyId,
      t.partNumber,
    ),
  ],
);

export const inventoryMovements = pgTable("inventory_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  partId: uuid("part_id")
    .notNull()
    .references(() => inventoryParts.id, { onDelete: "cascade" }),
  kind: inventoryMovementKindEnum("kind").notNull(),
  quantityDelta: integer("quantity_delta").notNull(),
  reference: text("reference"),
  performedByActorUserId: uuid("performed_by_actor_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sparePartRequests = pgTable("spare_part_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  workOrderId: uuid("work_order_id")
    .notNull()
    .references(() => workOrders.id, { onDelete: "cascade" }),
  partNumber: text("part_number").notNull(),
  description: text("description").notNull(),
  linkUrl: text("link_url"),
  quantityRequested: integer("quantity_requested").notNull(),
  quantityFulfilled: integer("quantity_fulfilled").default(0).notNull(),
  status: sparePartRequestStatusEnum("status")
    .default("SOLICITADA")
    .notNull(),
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

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type IntegrationProvider =
  (typeof integrationProviderEnum.enumValues)[number];
export type ProspectStatus = (typeof prospectStatusEnum.enumValues)[number];
