-- Migración: registro de notificaciones por WhatsApp en turnos (Fase 1 — botón wa.me)
-- Ejecutar en el SQL Editor de Supabase.

ALTER TABLE "turnos"
  ADD COLUMN IF NOT EXISTS "notificado_wa"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "notificado_wa_at"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "notificado_wa_tipo" TEXT;
