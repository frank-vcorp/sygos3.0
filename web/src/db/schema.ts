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
  "AT_EXTERNAL_VENDOR",
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
  "EXTERNAL_OUT",
  "EXTERNAL_RETURN",
]);

export const physicalEntityTypeEnum = pgEnum("physical_entity_type", [
  "EQUI",
  "MOT",
]);

export const attentionTypeEnum = pgEnum("attention_type", [
  "DIAGNOSTICO",
  "REPARACION",
  "DIAGNOSTICO_GARANTIA",
]);

export const diagnosticStatusEnum = pgEnum("diagnostic_status", [
  "EN_ESPERA",
  "EN_DIAGNOSTICO",
  "DIAGNOSTICO_TERMINADO",
  "PENDIENTE_VALIDACION_GERENTE",
  "VALIDADO",
  "DEVUELTO_CORRECCION",
]);

export const warrantyDecisionEnum = pgEnum("warranty_decision", [
  "GARANTIA_VALIDA",
  "GARANTIA_NO_PROCEDENTE",
]);

export const repairStatusEnum = pgEnum("repair_status", [
  "EN_ESPERA",
  "EN_REPARACION",
  "EN_ESPERA_REFACCIONES",
  "REPARACION_TERMINADA",
  "SIN_REPARACION",
]);

export const externalServiceStatusEnum = pgEnum("external_service_status", [
  "AT_VENDOR",
  "RETURNED",
]);

export const priorityCatalogEnum = pgEnum("priority_catalog", [
  "DIAGNOSTICO",
  "REPARACION",
]);

/** @deprecated migrado a repair_status */
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

export const servicePriorityConfigs = pgTable(
  "service_priority_configs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    catalog: priorityCatalogEnum("catalog").notNull(),
    code: text("code").notNull(),
    label: text("label").notNull(),
    priceMxn: integer("price_mxn").default(0).notNull(),
    incrementPct: integer("increment_pct").default(0).notNull(),
    targetMinDays: integer("target_min_days"),
    targetMaxDays: integer("target_max_days"),
    slaMaxDays: integer("sla_max_days").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("service_priority_company_catalog_code").on(
      t.companyId,
      t.catalog,
      t.code,
    ),
  ],
);

export const serviceAttentions = pgTable("service_attentions", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  equiId: uuid("equi_id").references(() => equiUnits.id),
  motorId: uuid("motor_id").references(() => motors.id),
  attentionType: attentionTypeEnum("attention_type").notNull(),
  reportedFailure: text("reported_failure").notNull(),
  priorityCode: text("priority_code").notNull(),
  warrantySourceWorkOrderId: uuid("warranty_source_work_order_id"),
  peerAttentionId: uuid("peer_attention_id"),
  createdByActorUserId: uuid("created_by_actor_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const diagnostics = pgTable(
  "diagnostics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    attentionId: uuid("attention_id")
      .notNull()
      .references(() => serviceAttentions.id, { onDelete: "cascade" }),
    folioNumber: integer("folio_number").notNull(),
    status: diagnosticStatusEnum("status").default("EN_ESPERA").notNull(),
    assignedUserId: uuid("assigned_user_id").references(() => users.id),
    technicalResult: text("technical_result"),
    warrantyDecision: warrantyDecisionEnum("warranty_decision"),
    frozenPriorityLabel: text("frozen_priority_label").notNull(),
    frozenPriceMxn: integer("frozen_price_mxn").default(0).notNull(),
    frozenIncrementPct: integer("frozen_increment_pct").default(0).notNull(),
    frozenSlaMaxDays: integer("frozen_sla_max_days").notNull(),
    slaStartedAt: timestamp("sla_started_at", { withTimezone: true }),
    slaDueAt: timestamp("sla_due_at", { withTimezone: true }),
    validationReturnReason: text("validation_return_reason"),
    validatedByUserId: uuid("validated_by_user_id").references(() => users.id),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("diagnostics_company_folio_unique").on(
      t.companyId,
      t.folioNumber,
    ),
  ],
);

export const technicalLogEntries = pgTable("technical_log_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  diagnosticId: uuid("diagnostic_id").references(() => diagnostics.id, {
    onDelete: "cascade",
  }),
  workOrderId: uuid("work_order_id"),
  body: text("body").notNull(),
  authorUserId: uuid("author_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const externalServiceCases = pgTable("external_service_cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  diagnosticId: uuid("diagnostic_id")
    .notNull()
    .references(() => diagnostics.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id),
  status: externalServiceStatusEnum("status").default("AT_VENDOR").notNull(),
  vendorDocumentRef: text("vendor_document_ref"),
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

export const workOrders = pgTable(
  "work_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    folioNumber: integer("folio_number").notNull(),
    attentionId: uuid("attention_id").references(() => serviceAttentions.id),
    diagnosticId: uuid("diagnostic_id").references(() => diagnostics.id),
    equiId: uuid("equi_id").references(() => equiUnits.id),
    motorId: uuid("motor_id").references(() => motors.id),
    repairStatus: repairStatusEnum("repair_status")
      .default("EN_ESPERA")
      .notNull(),
    status: workOrderStatusEnum("status").default("OPEN").notNull(),
    assignedUserId: uuid("assigned_user_id").references(() => users.id),
    technicalResult: text("technical_result"),
    frozenPriorityLabel: text("frozen_priority_label"),
    frozenIncrementPct: integer("frozen_increment_pct"),
    frozenSlaMaxDays: integer("frozen_sla_max_days"),
    slaStartedAt: timestamp("sla_started_at", { withTimezone: true }),
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
