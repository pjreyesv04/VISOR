-- =========================================================
-- 1) Identificar los IDs a CONSERVAR (1 por código, el de menor orden)
-- =========================================================
-- Primero eliminar respuestas de los parámetros duplicados que se van a borrar
DELETE FROM respuestas
WHERE parametro_id NOT IN (
  SELECT DISTINCT ON (codigo) id
  FROM parametros
  WHERE codigo IS NOT NULL
  ORDER BY codigo, orden ASC
);

-- Luego eliminar los parámetros duplicados
DELETE FROM parametros
WHERE id NOT IN (
  SELECT DISTINCT ON (codigo) id
  FROM parametros
  WHERE codigo IS NOT NULL
  ORDER BY codigo, orden ASC
);

-- =========================================================
-- 2) Dependencias: 2.1 → 2.2, 2.3 y 2.4
-- Si 2.1 = Sí  → 2.2 y 2.3 activos, 2.4 desactivado
-- Si 2.1 = No  → 2.2 y 2.3 desactivados, 2.4 activo
-- =========================================================

-- 2.2 depende de 2.1 = Sí (se desactiva si 2.1 = No)
UPDATE parametros
SET depende_de_codigo = '2.1', depende_valor = 'si'
WHERE codigo = '2.2';

-- 2.3 depende de 2.1 = Sí (se desactiva si 2.1 = No)
UPDATE parametros
SET depende_de_codigo = '2.1', depende_valor = 'si'
WHERE codigo = '2.3';

-- 2.4 depende de 2.1 = No (se desactiva si 2.1 = Sí)
UPDATE parametros
SET depende_de_codigo = '2.1', depende_valor = 'no'
WHERE codigo = '2.4';
