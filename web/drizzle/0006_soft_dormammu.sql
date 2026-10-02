CREATE TYPE "public"."ap_status" AS ENUM('ABIERTA', 'PARCIAL', 'SALDADA');--> statement-breakpoint
CREATE TYPE "public"."ar_status" AS ENUM('ABIERTA', 'PARCIAL', 'SALDADA');--> statement-breakpoint
CREATE TYPE "public"."fiscal_doc_kind" AS ENUM('FACTURA', 'REMISION', 'NOTA_CREDITO');--> statement-breakpoint
CREATE TYPE "public"."fiscal_doc_origin" AS ENUM('FREE', 'QUOTE', 'DIAGNOSTIC', 'WORK_ORDER', 'SALE', 'INTERCOMPANY');--> statement-breakpoint
CREATE TYPE "public"."fiscal_doc_status" AS ENUM('SOLICITUD_PENDIENTE', 'PENDIENTE_EMISION', 'EMITIDA', 'ERROR_FISCAL', 'CANCELACION_SOLICITADA', 'CANCELADA');--> statement-breakpoint
CREATE TYPE "public"."payment_destination" AS ENUM('BANCO', 'EFECTIVO', 'TARJETA');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDIENTE_VALIDACION', 'VALIDADO');--> statement-breakpoint
CREATE TABLE "accounts_payable" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"fiscal_document_id" uuid,
	"motor_id" uuid,
	"original_mxn" integer NOT NULL,
	"balance_mxn" integer NOT NULL,
	"due_date" timestamp with time zone,
	"status" "ap_status" DEFAULT 'ABIERTA' NOT NULL,
	"linked_ar_entry_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts_receivable" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"fiscal_document_id" uuid NOT NULL,
	"original_mxn" integer NOT NULL,
	"balance_mxn" integer NOT NULL,
	"due_date" timestamp with time zone,
	"status" "ar_status" DEFAULT 'ABIERTA' NOT NULL,
	"linked_ap_entry_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"ar_entry_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"note" text NOT NULL,
	"promise_date" timestamp with time zone,
	"next_follow_up_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiscal_document_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fiscal_document_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"concept" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_mxn" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiscal_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"folio_number" integer NOT NULL,
	"doc_kind" "fiscal_doc_kind" NOT NULL,
	"doc_origin" "fiscal_doc_origin" NOT NULL,
	"status" "fiscal_doc_status" DEFAULT 'SOLICITUD_PENDIENTE' NOT NULL,
	"client_id" uuid NOT NULL,
	"quote_id" uuid,
	"diagnostic_id" uuid,
	"work_order_id" uuid,
	"sale_id" uuid,
	"motor_id" uuid,
	"commercial_reference" text,
	"tax_legal_name_snapshot" text,
	"tax_rfc_snapshot" text,
	"tax_regime_snapshot" text,
	"tax_zip_snapshot" text,
	"subtotal_mxn" integer NOT NULL,
	"discount_mxn" integer DEFAULT 0 NOT NULL,
	"iva_mxn" integer NOT NULL,
	"total_mxn" integer NOT NULL,
	"credit_days" integer,
	"facturapi_invoice_id" text,
	"facturapi_uuid" text,
	"idempotency_key" text NOT NULL,
	"last_fiscal_error" text,
	"fiscal_retry_count" integer DEFAULT 0 NOT NULL,
	"linked_mirror_document_id" uuid,
	"cancellation_approved_by_user_id" uuid,
	"requested_by_user_id" uuid NOT NULL,
	"issued_by_user_id" uuid,
	"issued_at" timestamp with time zone,
	"created_by_actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"ar_entry_id" uuid,
	"ap_entry_id" uuid,
	"amount_mxn" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"folio_number" integer NOT NULL,
	"client_id" uuid,
	"supplier_id" uuid,
	"is_intercompany" boolean DEFAULT false NOT NULL,
	"amount_mxn" integer NOT NULL,
	"status" "payment_status" DEFAULT 'PENDIENTE_VALIDACION' NOT NULL,
	"destination" "payment_destination" NOT NULL,
	"receipt_reference" text NOT NULL,
	"received_by_vendor_user_id" uuid,
	"validated_by_user_id" uuid,
	"validated_at" timestamp with time zone,
	"linked_mirror_payment_id" uuid,
	"created_by_actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_fiscal_document_id_fiscal_documents_id_fk" FOREIGN KEY ("fiscal_document_id") REFERENCES "public"."fiscal_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_motor_id_motors_id_fk" FOREIGN KEY ("motor_id") REFERENCES "public"."motors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_fiscal_document_id_fiscal_documents_id_fk" FOREIGN KEY ("fiscal_document_id") REFERENCES "public"."fiscal_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_logs" ADD CONSTRAINT "collection_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_logs" ADD CONSTRAINT "collection_logs_ar_entry_id_accounts_receivable_id_fk" FOREIGN KEY ("ar_entry_id") REFERENCES "public"."accounts_receivable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_logs" ADD CONSTRAINT "collection_logs_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_document_lines" ADD CONSTRAINT "fiscal_document_lines_fiscal_document_id_fiscal_documents_id_fk" FOREIGN KEY ("fiscal_document_id") REFERENCES "public"."fiscal_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_documents" ADD CONSTRAINT "fiscal_documents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_documents" ADD CONSTRAINT "fiscal_documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_documents" ADD CONSTRAINT "fiscal_documents_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_documents" ADD CONSTRAINT "fiscal_documents_diagnostic_id_diagnostics_id_fk" FOREIGN KEY ("diagnostic_id") REFERENCES "public"."diagnostics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_documents" ADD CONSTRAINT "fiscal_documents_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_documents" ADD CONSTRAINT "fiscal_documents_sale_id_equipment_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."equipment_sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_documents" ADD CONSTRAINT "fiscal_documents_motor_id_motors_id_fk" FOREIGN KEY ("motor_id") REFERENCES "public"."motors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_documents" ADD CONSTRAINT "fiscal_documents_cancellation_approved_by_user_id_users_id_fk" FOREIGN KEY ("cancellation_approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_documents" ADD CONSTRAINT "fiscal_documents_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_documents" ADD CONSTRAINT "fiscal_documents_issued_by_user_id_users_id_fk" FOREIGN KEY ("issued_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_documents" ADD CONSTRAINT "fiscal_documents_created_by_actor_user_id_users_id_fk" FOREIGN KEY ("created_by_actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_ar_entry_id_accounts_receivable_id_fk" FOREIGN KEY ("ar_entry_id") REFERENCES "public"."accounts_receivable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_ap_entry_id_accounts_payable_id_fk" FOREIGN KEY ("ap_entry_id") REFERENCES "public"."accounts_payable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_vendor_user_id_users_id_fk" FOREIGN KEY ("received_by_vendor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_validated_by_user_id_users_id_fk" FOREIGN KEY ("validated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_actor_user_id_users_id_fk" FOREIGN KEY ("created_by_actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fiscal_documents_company_folio_unique" ON "fiscal_documents" USING btree ("company_id","folio_number","doc_kind");--> statement-breakpoint
CREATE UNIQUE INDEX "fiscal_documents_idempotency_unique" ON "fiscal_documents" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_company_folio_unique" ON "payments" USING btree ("company_id","folio_number");