-- ====================================================================
-- MIGRATION: Módulo de Supervisión Informática
-- Agrega soporte para formularios paralelos de supervisión IT
-- Ejecutar en Supabase SQL Editor
-- ====================================================================

-- 1) Agregar columna 'tipo' a supervisiones
ALTER TABLE supervisiones
ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'medico_auditor';

-- Crear índice para filtrado rápido
CREATE INDEX IF NOT EXISTS idx_supervisiones_tipo ON supervisiones(tipo);

-- 2) Campos específicos IT en el encabezado
ALTER TABLE supervisiones
ADD COLUMN IF NOT EXISTS sector_trabajo TEXT,
ADD COLUMN IF NOT EXISTS cel_correo_locador TEXT,
ADD COLUMN IF NOT EXISTS otras_actividades JSONB DEFAULT '{"A":"","B":"","C":"","D":"","E":"","F":""}'::jsonb;

-- 3) Agregar tipo_supervision a parametros
ALTER TABLE parametros
ADD COLUMN IF NOT EXISTS tipo_supervision VARCHAR(50) DEFAULT 'medico_auditor';

CREATE INDEX IF NOT EXISTS idx_parametros_tipo_supervision ON parametros(tipo_supervision);

-- 4) Tabla: Archivamiento Supervisado (10 filas por supervisión)
CREATE TABLE IF NOT EXISTS archivamiento_supervisado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervision_id UUID NOT NULL REFERENCES supervisiones(id) ON DELETE CASCADE,
  fila_numero INTEGER NOT NULL CHECK (fila_numero BETWEEN 1 AND 10),
  anio INTEGER,
  mes_inicio TEXT,
  mes_fin TEXT,
  nro_caja TEXT,
  nro_tomo TEXT,
  cantidad_foleo INTEGER,
  cantidad_fuas INTEGER,
  observacion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supervision_id, fila_numero)
);

CREATE INDEX IF NOT EXISTS idx_archivamiento_supervision ON archivamiento_supervisado(supervision_id);

-- 5) Tabla: Control de Calidad de FUAs (40 filas por supervisión)
CREATE TABLE IF NOT EXISTS control_calidad_fua (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervision_id UUID NOT NULL REFERENCES supervisiones(id) ON DELETE CASCADE,
  fila_numero INTEGER NOT NULL CHECK (fila_numero BETWEEN 1 AND 40),
  fua TEXT,
  fecha_atencion DATE,
  cod_prestacional TEXT,
  nombre_profesional TEXT,
  observacion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supervision_id, fila_numero)
);

CREATE INDEX IF NOT EXISTS idx_control_calidad_supervision ON control_calidad_fua(supervision_id);

-- 6) RLS para tablas nuevas
ALTER TABLE archivamiento_supervisado ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_calidad_fua ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_authenticated_archivamiento" ON archivamiento_supervisado;
CREATE POLICY "allow_all_authenticated_archivamiento" ON archivamiento_supervisado
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_authenticated_control_calidad" ON control_calidad_fua;
CREATE POLICY "allow_all_authenticated_control_calidad" ON control_calidad_fua
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7) Actualizar constraint de roles en user_profiles
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_role_check
CHECK (role IN ('admin', 'auditor', 'viewer', 'supervisor_informatico'));
