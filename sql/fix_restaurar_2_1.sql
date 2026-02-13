-- =========================================================
-- Verificar si 2.1 existe pero está inactivo
-- =========================================================

-- Primero veamos si existe
-- SELECT id, codigo, descripcion, activo, orden FROM parametros WHERE codigo = '2.1';

-- Si existe pero activo=false, activarlo:
UPDATE parametros SET activo = true WHERE codigo = '2.1';

-- Si NO existe (fue borrado), recrearlo:
INSERT INTO parametros (id, seccion, codigo, descripcion, requiere_observacion, orden, activo, tipo_campo_condicional, condicion_campo, etiqueta_campo_condicional, has_tabla_extra, depende_de_codigo, depende_valor)
SELECT
  gen_random_uuid(),
  '2. IP 02-03 Diabetes Mellitus',
  '2.1',
  '¿Cuenta con Equipo Automatizado para realizar HBA1c - microalbuminuria - creatinina sérica?',
  true, 1, true,
  NULL, NULL, NULL,
  NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM parametros WHERE codigo = '2.1');
