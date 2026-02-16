-- =============================================
-- Migración: DNI firmantes + Actualizar parámetro 7.1
-- Fecha: 2026-02-16
-- =============================================

-- 1) Agregar columnas DNI para cada firmante en supervisiones
ALTER TABLE supervisiones
ADD COLUMN IF NOT EXISTS dni_supervisor text,
ADD COLUMN IF NOT EXISTS dni_digitador text,
ADD COLUMN IF NOT EXISTS dni_medico_jefe text;

-- 2) Parámetro 7.1: quitar Si/No (solo tabla verificación FUA vs HC)
--    La tabla se muestra siempre sin necesidad de seleccionar Si/No
UPDATE parametros
SET
  tipo_campo_condicional = NULL,
  condicion_campo = NULL,
  etiqueta_campo_condicional = NULL,
  requiere_observacion = false
WHERE codigo = '7.1'
  AND tipo_supervision = 'general';
