-- =============================================
-- Actualizar parámetro 3.3 y 4.2
-- Fecha: 2026-02-16
-- =============================================

-- 3.3: Cambiar pregunta, quitar Si/No, solo cantidad
UPDATE parametros
SET
  descripcion = '¿Cuántos pacientes con P.A arterial Elevada(>140/90) se han registrado?',
  tipo_campo_condicional = 'cantidad',
  condicion_campo = 'siempre',
  etiqueta_campo_condicional = 'Cantidad de Pacientes con P.A >140/90',
  requiere_observacion = false
WHERE codigo = '3.3'
  AND tipo_supervision = 'general';

-- 4.2: Cambiar pregunta, quitar Si/No, cantidad + observaciones
UPDATE parametros
SET
  descripcion = '¿Cuántos pacientes (F) >= 40 años se han atendido en el servicio de Obstetricia?',
  tipo_campo_condicional = 'cantidad',
  condicion_campo = 'siempre',
  etiqueta_campo_condicional = 'Cantidad',
  requiere_observacion = true
WHERE codigo = '4.2'
  AND tipo_supervision = 'general';
