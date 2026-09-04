ALTER TABLE "Tenant"
ADD COLUMN IF NOT EXISTS "cancel_pin_hash" TEXT;
