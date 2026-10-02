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
  testModeEnabled: boolean("test_mode_enabled").default(false).notNull(),
  bonusPunctualityMxn: integer("bonus_punctuality_mxn").default(0).notNull(),
  bonusProductivityMxn: integer("bonus_productivity_mxn").default(0).notNull(),
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
    directPurchaseMonthlyLimitMxn: integer("direct_purchase_monthly_limit_mxn"),
    directPurchaseIndividualLimitMxn: integer(
      "direct_purchase_individual_limit_mxn",
    ),
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

export const testModeSessions = pgTable("test_mode_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  startedByUserId: uuid("started_by_user_id")
    .notNull()
    .references(() => users.id),
  startedAt: timestamp("started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  active: boolean("active").default(true).notNull(),
});

export const testModeSessionUsers = pgTable(
  "test_mode_session_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => testModeSessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("test_mode_session_users_unique").on(t.sessionId, t.userId),
  ],
);

export const testModeSessionRoles = pgTable(
  "test_mode_session_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => testModeSessions.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull(),
  },
  (t) => [
    uniqueIndex("test_mode_session_roles_unique").on(t.sessionId, t.role),
  ],
);

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

export const quoteTypeEnum = pgEnum("quote_type", [
  "DIAGNOSTICO",
  "REPARACION_SERVICIO",
  "SERVICIO_CAMPO",
  "VENTA_EQUIPO",
]);

export const quoteOriginEnum = pgEnum("quote_origin", [
  "VENDEDOR",
  "DIAGNOSTICO_VALIDADO",
  "REPARACION_TERMINADA",
  "GARANTIA_COBRAR",
  "MOT_BASE_SERVOMOTORES",
]);

export const quoteStatusEnum = pgEnum("quote_status", [
  "PENDIENTE_COTIZAR",
  "PENDIENTE_DECISION",
  "AUTORIZADA",
  "AUTORIZADA_PENDIENTE_INGRESO",
  "NO_AUTORIZADA",
]);

export const equipmentSaleStatusEnum = pgEnum("equipment_sale_status", [
  "ABIERTA",
  "PARCIAL",
  "CERRADA",
]);

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    folioNumber: integer("folio_number").notNull(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    vendorUserId: uuid("vendor_user_id")
      .notNull()
      .references(() => users.id),
    quoteType: quoteTypeEnum("quote_type").notNull(),
    quoteOrigin: quoteOriginEnum("quote_origin").notNull(),
    status: quoteStatusEnum("status").default("PENDIENTE_COTIZAR").notNull(),
    diagnosticId: uuid("diagnostic_id").references(() => diagnostics.id),
    workOrderId: uuid("work_order_id").references(() => workOrders.id),
    equiId: uuid("equi_id").references(() => equiUnits.id),
    motorId: uuid("motor_id").references(() => motors.id),
    prelimEquipmentType: text("prelim_equipment_type"),
    prelimBrand: text("prelim_brand"),
    prelimModel: text("prelim_model"),
    prelimSerial: text("prelim_serial"),
    commercialReference: text("commercial_reference"),
    complementNotes: text("complement_notes"),
    repairBaseMxn: integer("repair_base_mxn"),
    frozenIncrementPct: integer("frozen_increment_pct"),
    subtotalMxn: integer("subtotal_mxn"),
    discountPct: integer("discount_pct"),
    discountMxn: integer("discount_mxn"),
    priceBeforeIvaMxn: integer("price_before_iva_mxn"),
    ivaMxn: integer("iva_mxn"),
    totalMxn: integer("total_mxn"),
    creditDays: integer("credit_days"),
    linkedQuoteId: uuid("linked_quote_id"),
    intercompanyBaseTotalMxn: integer("intercompany_base_total_mxn"),
    pricedByUserId: uuid("priced_by_user_id").references(() => users.id),
    pricedAt: timestamp("priced_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
    decisionByUserId: uuid("decision_by_user_id").references(() => users.id),
    decisionAt: timestamp("decision_at", { withTimezone: true }),
    authorizedAt: timestamp("authorized_at", { withTimezone: true }),
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
    uniqueIndex("quotes_company_folio_unique").on(t.companyId, t.folioNumber),
    uniqueIndex("quotes_diagnostic_unique").on(t.diagnosticId),
    uniqueIndex("quotes_work_order_unique").on(t.workOrderId),
  ],
);

export const quoteLines = pgTable("quote_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").default(0).notNull(),
  concept: text("concept").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  unitPriceMxn: integer("unit_price_mxn"),
  lineAuthorized: boolean("line_authorized"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const quoteContactRecipients = pgTable(
  "quote_contact_recipients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => clientContacts.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("quote_contact_recipients_unique").on(t.quoteId, t.contactId),
  ],
);

export const quotePriceRevisions = pgTable("quote_price_revisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  actorUserId: uuid("actor_user_id")
    .notNull()
    .references(() => users.id),
  note: text("note"),
  subtotalMxn: integer("subtotal_mxn"),
  totalMxn: integer("total_mxn"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const equipmentSales = pgTable(
  "equipment_sales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    folioNumber: integer("folio_number").notNull(),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    status: equipmentSaleStatusEnum("status").default("ABIERTA").notNull(),
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
    uniqueIndex("equipment_sales_company_folio_unique").on(
      t.companyId,
      t.folioNumber,
    ),
  ],
);

export const equipmentSaleLines = pgTable("equipment_sale_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  saleId: uuid("sale_id")
    .notNull()
    .references(() => equipmentSales.id, { onDelete: "cascade" }),
  quoteLineId: uuid("quote_line_id")
    .notNull()
    .references(() => quoteLines.id),
  quantitySold: integer("quantity_sold").notNull(),
  quantityReceived: integer("quantity_received").default(0).notNull(),
  quantityDelivered: integer("quantity_delivered").default(0).notNull(),
});

export const commercialActivityCategories = pgTable(
  "commercial_activity_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    countsForGoals: boolean("counts_for_goals").default(true).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("commercial_activity_categories_company_name").on(
      t.companyId,
      t.name,
    ),
  ],
);

export const commercialActivities = pgTable("commercial_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id),
  categoryId: uuid("category_id").references(
    () => commercialActivityCategories.id,
  ),
  categoryLabel: text("category_label"),
  clientId: uuid("client_id").references(() => clients.id),
  prospectId: uuid("prospect_id").references(() => prospects.id),
  title: text("title").notNull(),
  notes: text("notes"),
  evidenceUrl: text("evidence_url"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const commercialGoalTypes = pgTable(
  "commercial_goal_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    label: text("label").notNull(),
    sourceKind: text("source_kind").default("ACTIVITIES").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("commercial_goal_types_company_code").on(t.companyId, t.code),
  ],
);

export const commercialGoalTargets = pgTable(
  "commercial_goal_targets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    goalTypeId: uuid("goal_type_id")
      .notNull()
      .references(() => commercialGoalTypes.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    targetValue: integer("target_value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("commercial_goal_targets_unique").on(
      t.companyId,
      t.userId,
      t.goalTypeId,
      t.year,
      t.month,
    ),
  ],
);

export const clientFirstOperations = pgTable("client_first_operations", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  attributedUserId: uuid("attributed_user_id")
    .notNull()
    .references(() => users.id),
  quoteId: uuid("quote_id").references(() => quotes.id),
  occurredAt: timestamp("occurred_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const fiscalDocKindEnum = pgEnum("fiscal_doc_kind", [
  "FACTURA",
  "REMISION",
  "NOTA_CREDITO",
]);

export const fiscalDocOriginEnum = pgEnum("fiscal_doc_origin", [
  "FREE",
  "QUOTE",
  "DIAGNOSTIC",
  "WORK_ORDER",
  "SALE",
  "INTERCOMPANY",
]);

export const fiscalDocStatusEnum = pgEnum("fiscal_doc_status", [
  "SOLICITUD_PENDIENTE",
  "PENDIENTE_EMISION",
  "EMITIDA",
  "ERROR_FISCAL",
  "CANCELACION_SOLICITADA",
  "CANCELADA",
]);

export const arStatusEnum = pgEnum("ar_status", [
  "ABIERTA",
  "PARCIAL",
  "SALDADA",
]);

export const apStatusEnum = pgEnum("ap_status", [
  "ABIERTA",
  "PARCIAL",
  "SALDADA",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDIENTE_VALIDACION",
  "VALIDADO",
]);

export const paymentDestinationEnum = pgEnum("payment_destination", [
  "BANCO",
  "EFECTIVO",
  "TARJETA",
]);

export const fiscalDocuments = pgTable(
  "fiscal_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    folioNumber: integer("folio_number").notNull(),
    docKind: fiscalDocKindEnum("doc_kind").notNull(),
    docOrigin: fiscalDocOriginEnum("doc_origin").notNull(),
    status: fiscalDocStatusEnum("status")
      .default("SOLICITUD_PENDIENTE")
      .notNull(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    quoteId: uuid("quote_id").references(() => quotes.id),
    diagnosticId: uuid("diagnostic_id").references(() => diagnostics.id),
    workOrderId: uuid("work_order_id").references(() => workOrders.id),
    saleId: uuid("sale_id").references(() => equipmentSales.id),
    motorId: uuid("motor_id").references(() => motors.id),
    commercialReference: text("commercial_reference"),
    taxLegalNameSnapshot: text("tax_legal_name_snapshot"),
    taxRfcSnapshot: text("tax_rfc_snapshot"),
    taxRegimeSnapshot: text("tax_regime_snapshot"),
    taxZipSnapshot: text("tax_zip_snapshot"),
    subtotalMxn: integer("subtotal_mxn").notNull(),
    discountMxn: integer("discount_mxn").default(0).notNull(),
    ivaMxn: integer("iva_mxn").notNull(),
    totalMxn: integer("total_mxn").notNull(),
    creditDays: integer("credit_days"),
    facturapiInvoiceId: text("facturapi_invoice_id"),
    facturapiUuid: text("facturapi_uuid"),
    idempotencyKey: text("idempotency_key").notNull(),
    lastFiscalError: text("last_fiscal_error"),
    fiscalRetryCount: integer("fiscal_retry_count").default(0).notNull(),
    fiscalSimulated: boolean("fiscal_simulated").default(false).notNull(),
    linkedMirrorDocumentId: uuid("linked_mirror_document_id"),
    cancellationApprovedByUserId: uuid("cancellation_approved_by_user_id").references(
      () => users.id,
    ),
    requestedByUserId: uuid("requested_by_user_id")
      .notNull()
      .references(() => users.id),
    issuedByUserId: uuid("issued_by_user_id").references(() => users.id),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
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
    uniqueIndex("fiscal_documents_company_folio_unique").on(
      t.companyId,
      t.folioNumber,
      t.docKind,
    ),
    uniqueIndex("fiscal_documents_idempotency_unique").on(t.idempotencyKey),
  ],
);

export const fiscalDocumentLines = pgTable("fiscal_document_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  fiscalDocumentId: uuid("fiscal_document_id")
    .notNull()
    .references(() => fiscalDocuments.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").default(0).notNull(),
  concept: text("concept").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  unitPriceMxn: integer("unit_price_mxn").notNull(),
});

export const accountsReceivable = pgTable("accounts_receivable", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  fiscalDocumentId: uuid("fiscal_document_id")
    .notNull()
    .references(() => fiscalDocuments.id),
  originalMxn: integer("original_mxn").notNull(),
  balanceMxn: integer("balance_mxn").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  status: arStatusEnum("status").default("ABIERTA").notNull(),
  linkedApEntryId: uuid("linked_ap_entry_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const accountsPayable = pgTable("accounts_payable", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id),
  fiscalDocumentId: uuid("fiscal_document_id").references(() => fiscalDocuments.id),
  motorId: uuid("motor_id").references(() => motors.id),
  originalMxn: integer("original_mxn").notNull(),
  balanceMxn: integer("balance_mxn").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  status: apStatusEnum("status").default("ABIERTA").notNull(),
  linkedArEntryId: uuid("linked_ar_entry_id"),
  directPurchaseId: uuid("direct_purchase_id"),
  purchaseOrderId: uuid("purchase_order_id"),
  description: text("description"),
  pendingVerification: boolean("pending_verification")
    .default(false)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    folioNumber: integer("folio_number").notNull(),
    clientId: uuid("client_id").references(() => clients.id),
    supplierId: uuid("supplier_id").references(() => suppliers.id),
    isIntercompany: boolean("is_intercompany").default(false).notNull(),
    amountMxn: integer("amount_mxn").notNull(),
    status: paymentStatusEnum("status")
      .default("PENDIENTE_VALIDACION")
      .notNull(),
    destination: paymentDestinationEnum("destination").notNull(),
    receiptReference: text("receipt_reference").notNull(),
    receivedByVendorUserId: uuid("received_by_vendor_user_id").references(
      () => users.id,
    ),
    validatedByUserId: uuid("validated_by_user_id").references(() => users.id),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
    linkedMirrorPaymentId: uuid("linked_mirror_payment_id"),
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
    uniqueIndex("payments_company_folio_unique").on(
      t.companyId,
      t.folioNumber,
    ),
  ],
);

export const paymentAllocations = pgTable("payment_allocations", {
  id: uuid("id").defaultRandom().primaryKey(),
  paymentId: uuid("payment_id")
    .notNull()
    .references(() => payments.id, { onDelete: "cascade" }),
  arEntryId: uuid("ar_entry_id").references(() => accountsReceivable.id),
  apEntryId: uuid("ap_entry_id").references(() => accountsPayable.id),
  amountMxn: integer("amount_mxn").notNull(),
});

export const purchaseDestinationKindEnum = pgEnum("purchase_destination_kind", [
  "WORK_ORDER",
  "MOTOR",
  "INVENTORY",
  "OPERATIONAL",
]);

export const purchasePaymentTermsEnum = pgEnum("purchase_payment_terms", [
  "CONTADO",
  "CREDITO",
]);

export const directPurchaseStatusEnum = pgEnum("direct_purchase_status", [
  "REGISTRADA",
  "PENDIENTE_VALIDAR",
  "PROCESADA",
]);

export const purchaseOrderStatusEnum = pgEnum("purchase_order_status", [
  "PENDIENTE_AUTORIZACION",
  "AUTORIZADA",
  "RECHAZADA",
  "PENDIENTE_PROCESAR",
  "PROCESADA",
  "CANCELADA",
]);

export const financialAccountKindEnum = pgEnum("financial_account_kind", [
  "BANCO",
  "EFECTIVO",
  "TARJETA",
]);

export const financialMovementKindEnum = pgEnum("financial_movement_kind", [
  "INGRESO",
  "EGRESO",
  "TRANSFERENCIA",
]);

export const directPurchases = pgTable(
  "direct_purchases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    folioNumber: integer("folio_number").notNull(),
    status: directPurchaseStatusEnum("status").default("REGISTRADA").notNull(),
    supplierId: uuid("supplier_id").references(() => suppliers.id),
    concept: text("concept").notNull(),
    amountMxn: integer("amount_mxn").notNull(),
    paymentTerms: purchasePaymentTermsEnum("payment_terms").notNull(),
    destinationKind: purchaseDestinationKindEnum("destination_kind").notNull(),
    workOrderId: uuid("work_order_id").references(() => workOrders.id),
    motorId: uuid("motor_id").references(() => motors.id),
    shippingReference: text("shipping_reference"),
    budgetMonthKey: text("budget_month_key").notNull(),
    registeredByUserId: uuid("registered_by_user_id")
      .notNull()
      .references(() => users.id),
    accountsPayableId: uuid("accounts_payable_id"),
    financialMovementId: uuid("financial_movement_id"),
    processedByUserId: uuid("processed_by_user_id").references(() => users.id),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("direct_purchases_company_folio_unique").on(
      t.companyId,
      t.folioNumber,
    ),
  ],
);

export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    folioNumber: integer("folio_number").notNull(),
    status: purchaseOrderStatusEnum("status")
      .default("PENDIENTE_AUTORIZACION")
      .notNull(),
    supplierId: uuid("supplier_id").references(() => suppliers.id),
    concept: text("concept").notNull(),
    authorizedAmountMxn: integer("authorized_amount_mxn").notNull(),
    paymentTerms: purchasePaymentTermsEnum("payment_terms").notNull(),
    destinationKind: purchaseDestinationKindEnum("destination_kind").notNull(),
    workOrderId: uuid("work_order_id").references(() => workOrders.id),
    motorId: uuid("motor_id").references(() => motors.id),
    shippingReference: text("shipping_reference"),
    requestedByUserId: uuid("requested_by_user_id")
      .notNull()
      .references(() => users.id),
    authorizedByUserId: uuid("authorized_by_user_id").references(() => users.id),
    authorizedAt: timestamp("authorized_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    cancellationReason: text("cancellation_reason"),
    accountsPayableId: uuid("accounts_payable_id"),
    financialMovementId: uuid("financial_movement_id"),
    processedByUserId: uuid("processed_by_user_id").references(() => users.id),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("purchase_orders_company_folio_unique").on(
      t.companyId,
      t.folioNumber,
    ),
  ],
);

export const financialAccounts = pgTable("financial_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  kind: financialAccountKindEnum("kind").notNull(),
  name: text("name").notNull(),
  balanceMxn: integer("balance_mxn").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const financialMovements = pgTable(
  "financial_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    folioNumber: integer("folio_number").notNull(),
    kind: financialMovementKindEnum("kind").notNull(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => financialAccounts.id),
    counterAccountId: uuid("counter_account_id").references(
      () => financialAccounts.id,
    ),
    amountMxn: integer("amount_mxn").notNull(),
    category: text("category"),
    description: text("description").notNull(),
    paymentId: uuid("payment_id").references(() => payments.id),
    directPurchaseId: uuid("direct_purchase_id").references(
      () => directPurchases.id,
    ),
    purchaseOrderId: uuid("purchase_order_id").references(
      () => purchaseOrders.id,
    ),
    accountsPayableId: uuid("accounts_payable_id"),
    pendingVerification: boolean("pending_verification")
      .default(false)
      .notNull(),
    regularizedFiscalDocumentId: uuid(
      "regularized_fiscal_document_id",
    ).references(() => fiscalDocuments.id),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("financial_movements_company_folio_unique").on(
      t.companyId,
      t.folioNumber,
    ),
  ],
);

export const employeeHireTypeEnum = pgEnum("employee_hire_type", [
  "NUEVO",
  "MIGRADO",
]);

export const employeeStatusEnum = pgEnum("employee_status", [
  "ACTIVO",
  "BAJA",
]);

export const attendancePunchTypeEnum = pgEnum("attendance_punch_type", [
  "ENTRADA",
  "SALIDA",
]);

export const hrRequestStatusEnum = pgEnum("hr_request_status", [
  "PENDIENTE",
  "PENDIENTE_JEFE",
  "PENDIENTE_CEO",
  "AUTORIZADA",
  "RECHAZADA",
  "PAGADA",
]);

export const overtimeRateEnum = pgEnum("overtime_rate", ["DOBLE", "TRIPLE"]);

export const payrollRunStatusEnum = pgEnum("payroll_run_status", [
  "BORRADOR",
  "AUTORIZADA",
  "PAGADA",
]);

export const payrollRunKindEnum = pgEnum("payroll_run_kind", [
  "SEMANAL",
  "AGUINALDO",
]);

export const commissionStatusEnum = pgEnum("commission_status", [
  "DEVENGADA",
  "PAGADA",
]);

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id),
    legalName: text("legal_name").notNull(),
    hireType: employeeHireTypeEnum("hire_type").default("NUEVO").notNull(),
    hireDate: timestamp("hire_date", { withTimezone: true }).notNull(),
    status: employeeStatusEnum("status").default("ACTIVO").notNull(),
    managerEmployeeId: uuid("manager_employee_id"),
    dailySalaryStampedMxn: integer("daily_salary_stamped_mxn").default(0).notNull(),
    dailySalaryCashMxn: integer("daily_salary_cash_mxn").default(0).notNull(),
    vacationBalanceDays: integer("vacation_balance_days").default(0).notNull(),
    kioskEnabled: boolean("kiosk_enabled").default(true).notNull(),
    attendanceExempt: boolean("attendance_exempt").default(false).notNull(),
    bonusesEligible: boolean("bonuses_eligible").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("employees_company_user_unique").on(t.companyId, t.userId)],
);

export const attendancePunches = pgTable("attendance_punches", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  punchType: attendancePunchTypeEnum("punch_type").notNull(),
  punchedAt: timestamp("punched_at", { withTimezone: true }).defaultNow().notNull(),
  source: text("source").default("KIOSCO").notNull(),
});

export const vacationRequests = pgTable("vacation_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  weekdayDays: integer("weekday_days").notNull(),
  status: hrRequestStatusEnum("status").default("PENDIENTE").notNull(),
  requestedByUserId: uuid("requested_by_user_id")
    .notNull()
    .references(() => users.id),
  resolvedByUserId: uuid("resolved_by_user_id").references(() => users.id),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const overtimeRequests = pgTable("overtime_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  workDate: timestamp("work_date", { withTimezone: true }).notNull(),
  hours: integer("hours").notNull(),
  rateKind: overtimeRateEnum("rate_kind").notNull(),
  status: hrRequestStatusEnum("status").default("PENDIENTE_JEFE").notNull(),
  requestedByUserId: uuid("requested_by_user_id")
    .notNull()
    .references(() => users.id),
  bossApprovedByUserId: uuid("boss_approved_by_user_id").references(
    () => users.id,
  ),
  ceoApprovedByUserId: uuid("ceo_approved_by_user_id").references(() => users.id),
  amountMxn: integer("amount_mxn"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const payrollRuns = pgTable(
  "payroll_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    weekKey: text("week_key").notNull(),
    runKind: payrollRunKindEnum("run_kind").default("SEMANAL").notNull(),
    folioNumber: integer("folio_number").notNull(),
    status: payrollRunStatusEnum("status").default("BORRADOR").notNull(),
    authorizedByUserId: uuid("authorized_by_user_id").references(() => users.id),
    authorizedAt: timestamp("authorized_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("payroll_runs_company_week_unique").on(t.companyId, t.weekKey),
    uniqueIndex("payroll_runs_company_folio_unique").on(
      t.companyId,
      t.folioNumber,
    ),
  ],
);

export const payrollLines = pgTable("payroll_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  payrollRunId: uuid("payroll_run_id")
    .notNull()
    .references(() => payrollRuns.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id),
  concept: text("concept").notNull(),
  amountMxn: integer("amount_mxn").notNull(),
  lineKind: text("line_kind").default("SYSTEM").notNull(),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  vacationRequestId: uuid("vacation_request_id").references(
    () => vacationRequests.id,
  ),
  overtimeRequestId: uuid("overtime_request_id").references(
    () => overtimeRequests.id,
  ),
});

export const commissionAccruals = pgTable("commission_accruals", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  vendorUserId: uuid("vendor_user_id")
    .notNull()
    .references(() => users.id),
  quoteId: uuid("quote_id").references(() => quotes.id),
  periodKey: text("period_key").notNull(),
  amountMxn: integer("amount_mxn").notNull(),
  status: commissionStatusEnum("status").default("DEVENGADA").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const productionEntries = pgTable("production_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  workOrderId: uuid("work_order_id")
    .notNull()
    .references(() => workOrders.id),
  technicianUserId: uuid("technician_user_id")
    .notNull()
    .references(() => users.id),
  hoursTenths: integer("hours_tenths").notNull(),
  note: text("note"),
  recordedAt: timestamp("recorded_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const collectionLogs = pgTable("collection_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  arEntryId: uuid("ar_entry_id")
    .notNull()
    .references(() => accountsReceivable.id, { onDelete: "cascade" }),
  authorUserId: uuid("author_user_id")
    .notNull()
    .references(() => users.id),
  note: text("note").notNull(),
  promiseDate: timestamp("promise_date", { withTimezone: true }),
  nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type IntegrationProvider =
  (typeof integrationProviderEnum.enumValues)[number];
export type ProspectStatus = (typeof prospectStatusEnum.enumValues)[number];
export type QuoteType = (typeof quoteTypeEnum.enumValues)[number];
export type QuoteStatus = (typeof quoteStatusEnum.enumValues)[number];
