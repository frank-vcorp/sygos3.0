CREATE TYPE "public"."direct_purchase_status" AS ENUM('REGISTRADA', 'PENDIENTE_VALIDAR', 'PROCESADA');--> statement-breakpoint
CREATE TYPE "public"."financial_account_kind" AS ENUM('BANCO', 'EFECTIVO', 'TARJETA');--> statement-breakpoint
CREATE TYPE "public"."financial_movement_kind" AS ENUM('INGRESO', 'EGRESO', 'TRANSFERENCIA');--> statement-breakpoint
CREATE TYPE "public"."purchase_destination_kind" AS ENUM('WORK_ORDER', 'MOTOR', 'INVENTORY', 'OPERATIONAL');--> statement-breakpoint
CREATE TYPE "public"."purchase_order_status" AS ENUM('PENDIENTE_AUTORIZACION', 'AUTORIZADA', 'RECHAZADA', 'PENDIENTE_PROCESAR', 'PROCESADA', 'CANCELADA');--> statement-breakpoint
CREATE TYPE "public"."purchase_payment_terms" AS ENUM('CONTADO', 'CREDITO');--> statement-breakpoint
CREATE TABLE "direct_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"folio_number" integer NOT NULL,
	"status" "direct_purchase_status" DEFAULT 'REGISTRADA' NOT NULL,
	"supplier_id" uuid,
	"concept" text NOT NULL,
	"amount_mxn" integer NOT NULL,
	"payment_terms" "purchase_payment_terms" NOT NULL,
	"destination_kind" "purchase_destination_kind" NOT NULL,
	"work_order_id" uuid,
	"motor_id" uuid,
	"shipping_reference" text,
	"budget_month_key" text NOT NULL,
	"registered_by_user_id" uuid NOT NULL,
	"accounts_payable_id" uuid,
	"financial_movement_id" uuid,
	"processed_by_user_id" uuid,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"kind" "financial_account_kind" NOT NULL,
	"name" text NOT NULL,
	"balance_mxn" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"folio_number" integer NOT NULL,
	"kind" "financial_movement_kind" NOT NULL,
	"account_id" uuid NOT NULL,
	"counter_account_id" uuid,
	"amount_mxn" integer NOT NULL,
	"category" text,
	"description" text NOT NULL,
	"payment_id" uuid,
	"direct_purchase_id" uuid,
	"purchase_order_id" uuid,
	"accounts_payable_id" uuid,
	"pending_verification" boolean DEFAULT false NOT NULL,
	"regularized_fiscal_document_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"folio_number" integer NOT NULL,
	"status" "purchase_order_status" DEFAULT 'PENDIENTE_AUTORIZACION' NOT NULL,
	"supplier_id" uuid,
	"concept" text NOT NULL,
	"authorized_amount_mxn" integer NOT NULL,
	"payment_terms" "purchase_payment_terms" NOT NULL,
	"destination_kind" "purchase_destination_kind" NOT NULL,
	"work_order_id" uuid,
	"motor_id" uuid,
	"shipping_reference" text,
	"requested_by_user_id" uuid NOT NULL,
	"authorized_by_user_id" uuid,
	"authorized_at" timestamp with time zone,
	"rejection_reason" text,
	"cancellation_reason" text,
	"accounts_payable_id" uuid,
	"financial_movement_id" uuid,
	"processed_by_user_id" uuid,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD COLUMN "direct_purchase_id" uuid;--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD COLUMN "purchase_order_id" uuid;--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD COLUMN "pending_verification" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "direct_purchase_monthly_limit_mxn" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "direct_purchase_individual_limit_mxn" integer;--> statement-breakpoint
ALTER TABLE "direct_purchases" ADD CONSTRAINT "direct_purchases_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_purchases" ADD CONSTRAINT "direct_purchases_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_purchases" ADD CONSTRAINT "direct_purchases_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_purchases" ADD CONSTRAINT "direct_purchases_motor_id_motors_id_fk" FOREIGN KEY ("motor_id") REFERENCES "public"."motors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_purchases" ADD CONSTRAINT "direct_purchases_registered_by_user_id_users_id_fk" FOREIGN KEY ("registered_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_purchases" ADD CONSTRAINT "direct_purchases_processed_by_user_id_users_id_fk" FOREIGN KEY ("processed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_movements" ADD CONSTRAINT "financial_movements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_movements" ADD CONSTRAINT "financial_movements_account_id_financial_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."financial_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_movements" ADD CONSTRAINT "financial_movements_counter_account_id_financial_accounts_id_fk" FOREIGN KEY ("counter_account_id") REFERENCES "public"."financial_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_movements" ADD CONSTRAINT "financial_movements_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_movements" ADD CONSTRAINT "financial_movements_direct_purchase_id_direct_purchases_id_fk" FOREIGN KEY ("direct_purchase_id") REFERENCES "public"."direct_purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_movements" ADD CONSTRAINT "financial_movements_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_movements" ADD CONSTRAINT "financial_movements_regularized_fiscal_document_id_fiscal_documents_id_fk" FOREIGN KEY ("regularized_fiscal_document_id") REFERENCES "public"."fiscal_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_movements" ADD CONSTRAINT "financial_movements_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_motor_id_motors_id_fk" FOREIGN KEY ("motor_id") REFERENCES "public"."motors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_authorized_by_user_id_users_id_fk" FOREIGN KEY ("authorized_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_processed_by_user_id_users_id_fk" FOREIGN KEY ("processed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "direct_purchases_company_folio_unique" ON "direct_purchases" USING btree ("company_id","folio_number");--> statement-breakpoint
CREATE UNIQUE INDEX "financial_movements_company_folio_unique" ON "financial_movements" USING btree ("company_id","folio_number");--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_orders_company_folio_unique" ON "purchase_orders" USING btree ("company_id","folio_number");