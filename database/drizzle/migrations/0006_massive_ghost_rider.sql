CREATE TABLE "payment_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"payment_type_id" uuid NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_rates_amount_positive" CHECK ("payment_rates"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "payment_rates" ADD CONSTRAINT "payment_rates_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payment_rates" ADD CONSTRAINT "payment_rates_payment_type_id_payment_types_id_fk" FOREIGN KEY ("payment_type_id") REFERENCES "public"."payment_types"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_rates_active_year_type_unique" ON "payment_rates" USING btree ("academic_year_id","payment_type_id") WHERE "payment_rates"."is_active" = true;