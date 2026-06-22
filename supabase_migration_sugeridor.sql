-- ============================================================
-- Migración: Sugeridor Inteligente de Rutinas
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar columnas nuevas a biblioteca_ejercicios
ALTER TABLE biblioteca_ejercicios
  ADD COLUMN IF NOT EXISTS niveles text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS etapas text[] DEFAULT '{}';

-- 2. Migrar datos existentes: nivel → niveles
--    (Solo si el ejercicio aún no tiene niveles asignados)
UPDATE biblioteca_ejercicios
SET niveles = ARRAY[
  CASE nivel
    WHEN 'BAJO'  THEN 'basico'
    WHEN 'MEDIO' THEN 'intermedio'
    WHEN 'ALTO'  THEN 'avanzado'
    ELSE 'basico'
  END
]
WHERE nivel IS NOT NULL
  AND (niveles IS NULL OR niveles = '{}');

-- 3. Agregar nivel_entrenamiento a pacientes
ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS nivel_entrenamiento text NOT NULL DEFAULT 'basico';

-- Verificación (opcional)
SELECT
  COUNT(*) as total_ejercicios,
  COUNT(*) FILTER (WHERE array_length(niveles, 1) > 0) as con_niveles,
  COUNT(*) FILTER (WHERE array_length(etapas, 1) > 0) as con_etapas
FROM biblioteca_ejercicios
WHERE activo = true;
