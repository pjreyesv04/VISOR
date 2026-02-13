-- ====================================================================
-- Migración V1.2.1 - Mejoras al Acta de Supervisión
-- V.I.S.O.R - Ejecutar en Supabase SQL Editor
-- Fecha: 2026-02-12
-- ====================================================================

-- =========================================================
-- 1) PARÁMETRO 1.1: Fecha siempre visible con etiqueta dinámica
--    Sí → "Fecha de la capacitación" + tabla participantes
--    No → "Fecha a realizar la capacitación" (sin tabla)
-- =========================================================
UPDATE parametros
SET condicion_campo = 'siempre'
WHERE codigo = '1.1';

-- =========================================================
-- 2) DEPENDENCIAS 2.1 → 2.2, 2.3
--    Si 2.1=Sí → 2.2 y 2.3 activos, 2.4 desactivado
--    Si 2.1=No → 2.2 y 2.3 desactivados, 2.4 activo
-- =========================================================
UPDATE parametros
SET depende_de_codigo = '2.1', depende_valor = 'si'
WHERE codigo = '2.2';

UPDATE parametros
SET depende_de_codigo = '2.1', depende_valor = 'si'
WHERE codigo = '2.3';

-- 2.4 ya tiene depende_de_codigo='2.1', depende_valor='no' (no cambia)

-- =========================================================
-- 3) REESTRUCTURAR 2.2: Tabla de reactivos e insumos
--    Cambiar descripción, limpiar campo condicional, agregar tabla extra
-- =========================================================
UPDATE parametros
SET
  descripcion = '¿Cuenta con reactivos e insumos?',
  tipo_campo_condicional = NULL,
  condicion_campo = NULL,
  etiqueta_campo_condicional = NULL,
  has_tabla_extra = 'tabla_reactivos'
WHERE codigo = '2.2';

-- Nueva tabla para reactivos e insumos (3 filas: HBA1c, Microalbuminuria, Creatinina)
CREATE TABLE IF NOT EXISTS reactivos_insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervision_id UUID NOT NULL REFERENCES supervisiones(id) ON DELETE CASCADE,
  nombre_reactivo TEXT NOT NULL,
  disponible BOOLEAN DEFAULT NULL,
  fecha_abastecimiento DATE DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reactivos_supervision ON reactivos_insumos(supervision_id);

ALTER TABLE reactivos_insumos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_authenticated_reactivos" ON reactivos_insumos;
CREATE POLICY "allow_all_authenticated_reactivos" ON reactivos_insumos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- 4) TABLA 7.1: Agregar columnas receta, boleta, profesional, gratuidad
-- =========================================================
ALTER TABLE verificacion_fua_hc ADD COLUMN IF NOT EXISTS receta TEXT DEFAULT '';
ALTER TABLE verificacion_fua_hc ADD COLUMN IF NOT EXISTS boleta TEXT DEFAULT '';
ALTER TABLE verificacion_fua_hc ADD COLUMN IF NOT EXISTS profesional TEXT DEFAULT '';
ALTER TABLE verificacion_fua_hc ADD COLUMN IF NOT EXISTS gratuidad BOOLEAN DEFAULT NULL;

-- =========================================================
-- 5) Comentarios
-- =========================================================
COMMENT ON TABLE reactivos_insumos IS 'Reactivos e insumos del parámetro 2.2 (HBA1c, Microalbuminuria, Creatinina)';
COMMENT ON COLUMN verificacion_fua_hc.receta IS 'N° de Receta';
COMMENT ON COLUMN verificacion_fua_hc.boleta IS 'N° de Boleta';
COMMENT ON COLUMN verificacion_fua_hc.profesional IS 'Nombre del Profesional';
COMMENT ON COLUMN verificacion_fua_hc.gratuidad IS 'true=Cumple, false=No cumple';
