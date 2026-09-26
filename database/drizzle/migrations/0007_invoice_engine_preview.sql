CREATE TYPE "public"."invoice_status" AS ENUM('UNPAID', 'PARTIAL', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_code" text NOT NULL,
	"student_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"payment_type_id" uuid NOT NULL,
	"period" date NOT NULL,
	"due_date" date NOT NULL,
	"nominal" numeric(14, 2) NOT NULL,
	"discount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"payable" numeric(14, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'UNPAID' NOT NULL,
	"discount_reason" text,
	"notes" text,
	"cancelled_at" timestamp with time zone,
	"cancelled_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_period_first_day" CHECK ("invoices"."period" = date_trunc('month', "invoices"."period")::date),
	CONSTRAINT "invoices_nominal_positive" CHECK ("invoices"."nominal" > 0),
	CONSTRAINT "invoices_discount_non_negative" CHECK ("invoices"."discount" >= 0),
	CONSTRAINT "invoices_discount_not_greater_than_nominal" CHECK ("invoices"."discount" <= "invoices"."nominal"),
	CONSTRAINT "invoices_payable_non_negative" CHECK ("invoices"."payable" >= 0),
	CONSTRAINT "invoices_payable_matches_nominal_discount" CHECK ("invoices"."payable" = "invoices"."nominal" - "invoices"."discount"),
	CONSTRAINT "invoices_discount_reason_required" CHECK (
        "invoices"."discount" = 0
        OR NULLIF(BTRIM("invoices"."discount_reason"), '') IS NOT NULL
      ),
	CONSTRAINT "invoices_cancellation_fields_consistent" CHECK (
        (
          "invoices"."status" = 'CANCELLED'
          AND "invoices"."cancelled_at" IS NOT NULL
          AND NULLIF(BTRIM("invoices"."cancelled_reason"), '') IS NOT NULL
        )
        OR
        (
          "invoices"."status" <> 'CANCELLED'
          AND "invoices"."cancelled_at" IS NULL
          AND "invoices"."cancelled_reason" IS NULL
        )
      )
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_payment_type_id_payment_types_id_fk" FOREIGN KEY ("payment_type_id") REFERENCES "public"."payment_types"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_invoice_code_unique" ON "invoices" USING btree ("invoice_code");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_active_student_year_type_period_unique" ON "invoices" USING btree ("student_id","academic_year_id","payment_type_id","period") WHERE "invoices"."status" <> 'CANCELLED';--> statement-breakpoint
CREATE INDEX "invoices_student_idx" ON "invoices" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "invoices_academic_year_idx" ON "invoices" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "invoices_payment_type_idx" ON "invoices" USING btree ("payment_type_id");--> statement-breakpoint
CREATE INDEX "invoices_period_idx" ON "invoices" USING btree ("period");--> statement-breakpoint
CREATE INDEX "invoices_student_year_period_idx" ON "invoices" USING btree ("student_id","academic_year_id","period");--> statement-breakpoint
CREATE INDEX "invoices_year_payment_type_period_idx" ON "invoices" USING btree ("academic_year_id","payment_type_id","period");