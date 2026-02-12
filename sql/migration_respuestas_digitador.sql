-- ====================================================================
-- Migración: Tabla respuestas por digitador (Secciones 6.1, 6.2)
-- V.I.S.O.R - Ejecutar en Supabase SQL Editor
-- Fecha: 2026-02-12
-- ====================================================================

-- =========================================================
-- 1) TABLA: respuestas_digitador
--    Almacena respuestas Sí/No por digitador para parámetros
--    como 6.1 y 6.2 donde cada digitador tiene su propia fila
-- =========================================================
CREATE TABLE IF NOT EXISTS respuestas_digitador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervision_id UUID NOT NULL REFERENCES supervisiones(id) ON DELETE CASCADE,
  parametro_id TEXT NOT NULL REFERENCES parametros(id) ON DELETE CASCADE,
  digitador_id UUID NOT NULL REFERENCES digitadores(id) ON DELETE CASCADE,
  valor_bool BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supervision_id, parametro_id, digitador_id)
);

CREATE INDEX IF NOT EXISTS idx_resp_dig_supervision ON respuestas_digitador(supervision_id);
CREATE INDEX IF NOT EXISTS idx_resp_dig_parametro ON respuestas_digitador(parametro_id);

-- =========================================================
-- 2) RLS
-- =========================================================
ALTER TABLE respuestas_digitador ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_authenticated_resp_dig" ON respuestas_digitador;
CREATE POLICY "allow_all_authenticated_resp_dig" ON respuestas_digitador
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- 3) Agregar nuevo tipo de tabla extra: 'tabla_digitadores'
-- =========================================================
ALTER TABLE parametros DROP CONSTRAINT IF EXISTS chk_tipo_campo_condicional;
ALTER TABLE parametros
  ADD CONSTRAINT chk_tipo_campo_condicional
  CHECK (tipo_campo_condicional IS NULL OR tipo_campo_condicional IN (
    'fecha', 'cantidad', 'texto', 'cantidad_multiple',
    'tabla_participantes', 'texto_persona'
  ));

-- =========================================================
-- 4) Marcar parámetros 6.1 y 6.2 para usar tabla_digitadores
--    y limpiar el campo condicional de texto que ya no se necesita
-- =========================================================
UPDATE parametros
SET
  has_tabla_extra = 'tabla_digitadores',
  tipo_campo_condicional = NULL,
  condicion_campo = NULL,
  etiqueta_campo_condicional = NULL
WHERE codigo IN ('6.1', '6.2');

COMMENT ON TABLE respuestas_digitador IS 'Respuestas Sí/No individuales por digitador para parámetros tipo 6.1, 6.2';
COMMENT ON COLUMN respuestas_digitador.digitador_id IS 'FK al digitador que responde';
COMMENT ON COLUMN respuestas_digitador.valor_bool IS 'true=Sí, false=No, null=sin respuesta';
