-- ====================================================================
-- SEED: Parámetros del Acta de Supervisión Informática
-- Ejecutar DESPUÉS de migration_informatico_v1.sql
-- ====================================================================

-- SECCIÓN A: ASPECTOS INFORMÁTICOS DE LA OFICINA DE SEGUROS
INSERT INTO parametros (id, seccion, codigo, descripcion, requiere_observacion, orden, activo, tipo_campo_condicional, condicion_campo, etiqueta_campo_condicional, tipo_supervision)
VALUES
(gen_random_uuid(), 'A. Aspectos Informáticos de la Oficina de Seguros', 'A.1',
 'Los Equipos Informáticos (CPU, Monitor, Teclado, Mouse) de la Oficina de Seguros se encuentran operativos.',
 true, 1, true, NULL, NULL, NULL, 'informatico'),

(gen_random_uuid(), 'A. Aspectos Informáticos de la Oficina de Seguros', 'A.2',
 'La red Local en la Oficina de Seguros se encuentra Ordenada. (CABLES DE RED Y SWITCH)',
 true, 2, true, NULL, NULL, NULL, 'informatico'),

(gen_random_uuid(), 'A. Aspectos Informáticos de la Oficina de Seguros', 'A.3',
 'Cuenta con acceso a Internet, velocidad y estado. (VERIFICAR HISTORIAL DE NAVEGACIÓN ADJUNTAR PANTALLAZO)',
 true, 3, true, 'cantidad', 'si', 'Velocidad (Mbps)', 'informatico'),

(gen_random_uuid(), 'A. Aspectos Informáticos de la Oficina de Seguros', 'A.4',
 'Porcentaje de uso de tóner de la impresora Brother al día de supervisión.',
 true, 4, true, 'cantidad', 'siempre', '% de Tóner', 'informatico'),

(gen_random_uuid(), 'A. Aspectos Informáticos de la Oficina de Seguros', 'A.5',
 'Porcentaje de uso de tambor de la impresora Brother al día de supervisión.',
 true, 5, true, 'cantidad', 'siempre', '% de Tambor', 'informatico'),

(gen_random_uuid(), 'A. Aspectos Informáticos de la Oficina de Seguros', 'A.6',
 'El ambiente donde se encuentra ubicado la Oficina de Seguros del establecimiento de Salud está ordenada.',
 true, 6, true, NULL, NULL, NULL, 'informatico'),

(gen_random_uuid(), 'A. Aspectos Informáticos de la Oficina de Seguros', 'A.7',
 'El ambiente donde se encuentra ubicado la Oficina de Seguros del establecimiento de Salud es accesible para la Atención del Asegurado.',
 true, 7, true, NULL, NULL, NULL, 'informatico'),

(gen_random_uuid(), 'A. Aspectos Informáticos de la Oficina de Seguros', 'A.8',
 'El digitador de la Oficina de Seguros cuenta con el Cuaderno de Asistencia.',
 true, 8, true, NULL, NULL, NULL, 'informatico');

-- SECCIÓN B: ARFSIS/SIGEPS/SIASIS/SGA (APLICATIVOS DE CONTROL Y REGISTRO DE FUA'S)
INSERT INTO parametros (id, seccion, codigo, descripcion, requiere_observacion, orden, activo, tipo_supervision)
VALUES
(gen_random_uuid(), 'B. ARFSIS/SIGEPS/SIASIS/SGA', 'B.1',
 'El digitador de la Oficina de Seguros del establecimiento de salud cuenta con acceso a los sistemas SIASIS/SIGEPS/SGA. (VERIFICAR EL ACCESO)',
 true, 1, true, 'informatico'),

(gen_random_uuid(), 'B. ARFSIS/SIGEPS/SIASIS/SGA', 'B.2',
 'El digitador de la Oficina de Seguros del establecimiento de salud, viene realizando correctamente sus envíos y carga de producción según el cronograma establecido. (EVIDENCIAR ENVÍOS)',
 true, 2, true, 'informatico'),

(gen_random_uuid(), 'B. ARFSIS/SIGEPS/SIASIS/SGA', 'B.3',
 'El sistema ARFSIS se encuentra actualizado (EJECUTABLE, BASE DE MAESTROS, CATÁLOGO DE MAESTRO Y ASEGURADO). (ANEXAR PANTALLAZO)',
 true, 3, true, 'informatico'),

(gen_random_uuid(), 'B. ARFSIS/SIGEPS/SIASIS/SGA', 'B.4',
 'Al momento de la supervisión, el digitador presenta inconvenientes con los sistemas informáticos (ARFSIS, SIASIS/SIGEPS, SGA). (ANEXAR EVIDENCIA)',
 true, 4, true, 'informatico');

-- SECCIÓN C: ATENCIONES DEL DIGITADOR (CANTIDAD)
INSERT INTO parametros (id, seccion, codigo, descripcion, requiere_observacion, orden, activo, tipo_campo_condicional, condicion_campo, etiqueta_campo_condicional, tipo_supervision)
VALUES
(gen_random_uuid(), 'C. Atenciones del Digitador', 'C.1',
 'Cantidad de atenciones realizadas al día de la supervisión.',
 false, 1, true, 'cantidad', 'siempre', 'Cantidad', 'informatico'),

(gen_random_uuid(), 'C. Atenciones del Digitador', 'C.2',
 'Cantidad de consultas realizadas al día de la supervisión.',
 false, 2, true, 'cantidad', 'siempre', 'Cantidad', 'informatico'),

(gen_random_uuid(), 'C. Atenciones del Digitador', 'C.3',
 'Cantidad de afiliaciones realizadas al día de la supervisión.',
 false, 3, true, 'cantidad', 'siempre', 'Cantidad', 'informatico'),

(gen_random_uuid(), 'C. Atenciones del Digitador', 'C.4',
 'Cantidad de cambios de domicilios realizados al día de la supervisión.',
 false, 4, true, 'cantidad', 'siempre', 'Cantidad', 'informatico'),

(gen_random_uuid(), 'C. Atenciones del Digitador', 'C.5',
 'Cantidad de sepelios recepcionados por el digitador al día de la supervisión. (COPIA DEL FORMATO 4)',
 false, 5, true, 'cantidad', 'siempre', 'Cantidad', 'informatico');

-- SECCIÓN D: REPORTE ARFSIS/SGA (CANTIDAD)
INSERT INTO parametros (id, seccion, codigo, descripcion, requiere_observacion, orden, activo, tipo_campo_condicional, condicion_campo, etiqueta_campo_condicional, tipo_supervision)
VALUES
(gen_random_uuid(), 'D. Reporte ARFSIS/SGA', 'D.1',
 'Cantidad digitada de FUAs en el sistema ARFSIS al día de supervisión. (DIGITADOR SUPERVISADO)',
 false, 1, true, 'cantidad', 'siempre', 'Cantidad', 'informatico'),

(gen_random_uuid(), 'D. Reporte ARFSIS/SGA', 'D.2',
 'Cantidad digitada de FUAs anuladas en la APP Seguros al día de supervisión. (DIGITADOR SUPERVISADO)',
 false, 2, true, 'cantidad', 'siempre', 'Cantidad', 'informatico');

-- SECCIÓN E: FORMATOS (SI/NO)
INSERT INTO parametros (id, seccion, codigo, descripcion, requiere_observacion, orden, activo, tipo_supervision)
VALUES
(gen_random_uuid(), 'E. Formatos', 'E.1',
 'El digitador tiene actualizado el registro de control de FUAs que entrega a las distintas áreas. (COPIA DEL FORMATO 1)',
 true, 1, true, 'informatico'),

(gen_random_uuid(), 'E. Formatos', 'E.2',
 'El digitador tiene actualizado el registro de devolución de FUAs que proporcionan las áreas correspondientes. (COPIA DEL FORMATO 2)',
 true, 2, true, 'informatico'),

(gen_random_uuid(), 'E. Formatos', 'E.3',
 'El digitador registra las FUAs observadas y subsanación de las mismas cuando realiza el control de calidad. (COPIA DEL FORMATO 3)',
 true, 3, true, 'informatico');

-- SECCIÓN F: ARCHIVAMIENTO DE FUA'S (SI/NO)
INSERT INTO parametros (id, seccion, codigo, descripcion, requiere_observacion, orden, activo, tipo_supervision)
VALUES
(gen_random_uuid(), 'F. Archivamiento de FUAs', 'F.1',
 'Las FUAs correspondiente a los años 2025-2026 del establecimiento de salud se encuentran correctamente archivadas por fecha de atención.',
 true, 1, true, 'informatico'),

(gen_random_uuid(), 'F. Archivamiento de FUAs', 'F.2',
 'Las FUAs correspondiente a los años 2025-2026 del establecimiento de salud se encuentran correctamente foliadas por fecha de atención.',
 true, 2, true, 'informatico');

-- SECCIÓN G: REPORTE DE ARCHIVAMIENTO (CANTIDAD + TABLA)
INSERT INTO parametros (id, seccion, codigo, descripcion, requiere_observacion, orden, activo, tipo_campo_condicional, condicion_campo, etiqueta_campo_condicional, has_tabla_extra, tipo_supervision)
VALUES
(gen_random_uuid(), 'G. Reporte de Archivamiento', 'G.1',
 'Cantidad de FUAs archivadas al día de la supervisión.',
 false, 1, true, 'cantidad', 'siempre', 'Cantidad', NULL, 'informatico'),

(gen_random_uuid(), 'G. Reporte de Archivamiento', 'G.2',
 'Cantidad de folio de FUAs al día de la supervisión.',
 false, 2, true, 'cantidad', 'siempre', 'Cantidad', NULL, 'informatico'),

(gen_random_uuid(), 'G. Reporte de Archivamiento', 'G.3',
 'Archivamiento Supervisado',
 false, 3, true, NULL, NULL, NULL, 'tabla_archivamiento', 'informatico');

-- SECCIÓN H: FICHA DE CONTROL DE CALIDAD (TABLA)
INSERT INTO parametros (id, seccion, codigo, descripcion, requiere_observacion, orden, activo, has_tabla_extra, tipo_supervision)
VALUES
(gen_random_uuid(), 'H. Ficha de Control de Calidad del Registro de Digitación de las FUAs', 'H.1',
 'Ficha de Control de Calidad del Registro de Digitación de las FUAs',
 false, 1, true, 'tabla_control_calidad', 'informatico');
