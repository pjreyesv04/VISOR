-- ====================================================================
-- Migración: Tabla de Digitadores y vinculación con Establecimientos
-- V.I.S.O.R - Ejecutar en Supabase SQL Editor
-- Fecha: 2026-02-11
-- ====================================================================

-- =========================================================
-- 1) TABLA: digitadores
-- =========================================================
CREATE TABLE IF NOT EXISTS digitadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id TEXT NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  apellidos_nombres TEXT NOT NULL,
  dni TEXT DEFAULT NULL,
  celular TEXT DEFAULT NULL,
  ruc TEXT DEFAULT NULL,
  correo TEXT DEFAULT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_digitadores_establecimiento ON digitadores(establecimiento_id);
CREATE INDEX IF NOT EXISTS idx_digitadores_activo ON digitadores(activo);

-- =========================================================
-- 2) Agregar columna digitador_id a supervisiones
-- =========================================================
ALTER TABLE supervisiones
  ADD COLUMN IF NOT EXISTS digitador_id UUID REFERENCES digitadores(id) ON DELETE SET NULL;

-- =========================================================
-- 3) Asegurar que establecimientos tenga columna codigo
-- =========================================================
ALTER TABLE establecimientos
  ADD COLUMN IF NOT EXISTS codigo TEXT DEFAULT NULL;

-- =========================================================
-- 4) RLS para tabla digitadores
-- =========================================================
ALTER TABLE digitadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_authenticated_digitadores" ON digitadores
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- 5) Carga masiva de digitadores desde CSV
--    Se usa tabla temporal para cruzar por código EESS
-- =========================================================
CREATE TEMP TABLE tmp_digitadores_csv (
  codigo_eess TEXT,
  apellidos_nombres TEXT,
  dni TEXT,
  celular TEXT,
  ruc TEXT,
  correo TEXT
);

INSERT INTO tmp_digitadores_csv (codigo_eess, apellidos_nombres, dni, celular, ruc, correo) VALUES
('5814', 'CLEMENTE RODRIGUEZ DARLIN ROLANDO', '46943954', '969288519', '10469439548', 'clementedarlin@gmail.com'),
('5814', 'LOPEZ HUAMAN KELLY FIORELLA', '45448267', '986359034', '10454482676', 'lorena.lh2017@gmail.com'),
('16525', 'COZ JARA MARIA ELENA', '9628373', '933562384', '10096283739', 'mecjpd@gmail.com'),
('5824', 'ESPINAR CHUNGUE IVI PATRICIA', '41781669', '936765237', '10417816696', 'iespinarchunguei@gmail.com'),
('27057', 'APONTE RECIENTES ERNESTO', '75546313', '979812021', '10755463138', 'ernestoaponterecines@gmail.com'),
('14727', 'MACHACA LLANO MARIBEL', '46581522', '925682473', '10465815227', 'maribelmachacallano@gmail.com'),
('5823', 'ÑAÑES CHIROQUE JOSÉ ANTONIO', '47507574', '968416601', '10475075744', 'Joseantonio92@gmail.com'),
('5825', 'OSORIO CASTAGNETTO ELIZABETH VANESA', '10378614', '968416601', '10103786148', 'evoc1977@hotmail.com'),
('5734', 'AGUIRRE GOMEZ KEVIN LUIS', '70324042', NULL, NULL, NULL),
('27244', 'FERNANDEZ FALLA CAMILA NORMA', NULL, NULL, NULL, NULL),
('5735', 'VELASQUEZ VELASQUEZ RENZO MARTIN', '72898003', NULL, '10728980031', NULL),
('5735', 'FERNÁNDEZ QUISPE IMANOL ANTONIO', '73883705', NULL, '10738837059', NULL),
('5735', 'GALLEGOS JARA NILTON ARTURO', NULL, NULL, NULL, NULL),
('5735', 'RODRÍGUEZ QUISPE NICOLE', '71157827', NULL, NULL, NULL),
('11891', 'CHIPANA ESPINOZA GLORIA', NULL, NULL, NULL, NULL),
('5739', 'FERNANDEZ GOMEZ JOSE MAXIMO', NULL, NULL, NULL, NULL),
('5740', 'MARTEL ESPINOZA DEYVID ROBINSON', NULL, NULL, NULL, NULL),
('21104', 'ESTACIO ESPINOZA KATERING MAYUME', NULL, NULL, NULL, NULL),
('5738', 'SALAS ZAITA EDGAR', '47872648', NULL, NULL, NULL),
('5737', 'TERRONES ORE ZULEYMA LIZETH', '43580102', NULL, NULL, NULL),
('5736', 'FERNÁNDEZ ROJAS LESLY JUDITH', '76607449', NULL, NULL, NULL),
('5757', 'GABINO ROJAS BRENDA VALERIN', '44768800', '979672308', '10447688005', 'brendaymafer_24@hotmail.com'),
('5753', 'LA ROSA TORO CRUZ DIANA CAROLINA', '45024652', '954190837', '10450246528', 'ofseg.anuevo@gmail.com'),
('5755', 'VILLACORTA FIESTAS LAURA LILIANA', NULL, NULL, NULL, NULL),
('5755', 'NINA CHUMBIMUNE EDISON DIEGO', '47850226', '947315284', '10478502261', 'edisondiego21@gmail.com'),
('5758', 'LEJABO VILCHERREZ PITER JUNIOR', '72763495', '958630634', '10727634954', 'piter21.plv@gmail.com'),
('5756', 'LEON TORRES CHRISTIAN MARTIN', '8676047', '963859401', '10086760474', 'christianlt68@gmail.com'),
('5761', 'FARROÑAN SOTO JOSÉ LUIS', '45574884', '984736527', '10455748840', 'luisfarronansoto9@gmail.com'),
('5754', 'SANDOVAL ZEVALLOS BRIAN GUSTAVO', '71313875', '923697545', '10713138750', 'ofsegcolliqueiiizona@gmail.com'),
('5760', 'ZEVALLOS VALDIVIEZO DE ARENAS CAROLAIN PAOLA', '47610414', '940165275', '1047610414', 'ofseg.sancarlos@gmail.com'),
('35364', 'RIVADENEIRA GONZALES GABRIELA DEL PILAR', '47733715', '945470212', '10477337151', 'grivadeneirag15@gmail.com'),
('5770', 'CERNA GOMEZ JORDAN ALEXANDER', '74693031', '942468324', '10746930319', 'jordancernagomez@gmail.com'),
('5764', 'ARANGURI BOHORQUEZ NAZIETH JAVIER', '47101846', '933386751', '10471018461', 'aranguri_nkjm91@hotmail.com'),
('5772', 'BOZA FALCÓN JACOB EDUARDO', '71037456', '968144763', '10710374568', 'eduars2012@gmail.com'),
('5772', 'FERNANDEZ VASQUEZ DANIXA', '72686873', '9847348371', '10726868731', 'danixafernandezzz16@gmail.com'),
('5769', 'CAMPOS CHALCO RUBI MAGDIEL', '70808702', '997959987', '10708087021', 'rubichalco@gmail.com'),
('5768', 'CANO ARTEAGA ROSMERY JULIA', '75603549', '961030479', '10756035491', 'rous.15.marzo@gmail.com'),
('5763', 'LOPEZ SUYÓN ENZO JOSÉ', '75111470', '924959253', '1075111370', 'enzo.lopez0309@gmail.com'),
('5767', 'CHUMACERO RODRIGUEZ FRESSCIA JULIETTE', '44668803', '989683535', '10446688036', 'frezhita03@gmail.com'),
('7684', 'MAURICIO FERREYRA LUIS ARMANDO', NULL, NULL, NULL, NULL),
('5765', 'GOICOCHEA PEREZ YAHAIRA MARILYN', '75588204', '960392278', '10755882041', 'yahairagoicochea@gmail.com'),
('5766', 'HUAMAN GALLARDO NOEMI ROCIO', NULL, NULL, NULL, NULL),
('5773', 'ABAD PICON JOSEPH ANGEL', NULL, NULL, NULL, NULL),
('6886', 'TINCEP VASQUEZ CLAUDIA CRISTINA', '75853531', '959749417', '10758535318', 'clautincep10@gmail.com'),
('5792', 'ARANGO DE LA CRUZ MAGALY', '43496675', '977613753', '10434966758', 'jm86_04@hotmail.com'),
('5791', 'PANDO ROCHA MONICA CECILIA', '40647673', '959350190', '10406476737', 'mpando.rocha@gmial.com'),
('5791', 'ROQUE CACEDA KIMBERLY ELIZABETH', '75415034', '907022859', '10754150349', 'kim.pr.11.99@gmail.com'),
('5791', 'CRUZ MARCOS ALEJANDRA ARACELLY', '71625058', '900301846', '10716250585', 'alejandracruzmarcos@gmail.com'),
('5789', 'CAM CARRANZA MAYTÉ MEY LING', '48837343', '922592196', '10488373434', 'meycamcar@hotmail.com'),
('5793', 'JIMENEZ PERALTA ANIBAL JACINTO', '47618552', '930844998', '10476185527', 'anibal_35_80@hotmail.com'),
('5786', 'PRINCIPE DE LA CERNA NOELIA GUICEL', '44165738', '936055747', '10441657388', 'guicel_20@hotmail.com'),
('5796', 'SONDOR CONDOY JESÚS ENRIQUE', '72039153', '959650980', '10720391533', NULL),
('35352', 'VELIZ GONZALES FABRICIO DANIEL', '70470373', '944722513', '10704703738', 'fabricio.veliz1@gmail.com'),
('5790', 'CENTENARIO ZELAYA SUSANA MARIA LUISA', '70313536', '993243925', '10703135361', 'susanaml_21@hotmail.com'),
('5787', 'ZAPATA DIAZ CARLA JULEYSI', '47991423', '928788972', '10479914236', 'carlazapata24@gmail.com'),
('5794', 'VASQUEZ PLASENCIA JHONNATAN MACKEY', '46533534', '902919126', '10465335349', 'jhonnatanmvp@gmail.com'),
('5798', 'CASTILLO MELENDRES DIANA IBETH', NULL, NULL, NULL, NULL),
('5799', 'LOAYZA LOAYZA JOHNATAN VICTOR', NULL, NULL, NULL, NULL),
('5799', 'SIRLUPU ZAFRA EIMI KARELY', NULL, NULL, NULL, NULL),
('5799', 'VEGA OSCCO YAJAIRA ANTOHANE', NULL, NULL, NULL, NULL),
('5807', 'FLORES RENGIFO JOANA RAQUEL', NULL, NULL, NULL, NULL),
('5800', 'TELLO FERNÁNDEZ JULISSA MIRELLA', NULL, NULL, NULL, NULL),
('5800', 'IBAÑEZ FLORES BERTHA LUCIA', NULL, NULL, NULL, NULL),
('5810', 'LATORRE LEANDRO OSCAR VÍCTOR', NULL, NULL, NULL, NULL),
('5802', 'NAVARRO LEZAMA JOSSELYN RUTH', NULL, NULL, NULL, NULL),
('5803', 'QUISPE RAMOS ANTHONY CHRISTIAN', NULL, NULL, NULL, NULL),
('5806', 'TORRES VICENTE DAVID ALEXANDER', NULL, NULL, NULL, NULL),
('5801', 'CALLALLI LLANQUE RONALD WENCESLAO', NULL, NULL, NULL, NULL),
('5801', 'SILVA CANCINO LUIS DANIEL', NULL, NULL, NULL, NULL),
('27247', 'PORRAS ROSALES KEYLA MARIA', NULL, NULL, NULL, NULL),
('5821', 'ARELLANO BERNABE ROXANA GRACIELA', NULL, NULL, NULL, NULL),
('5821', 'MÁRQUEZ GUTIÉRREZ MARINA ELIZABETH', NULL, NULL, NULL, NULL),
('5821', 'ROSALES HUAMANI CIELO NICOLE', NULL, NULL, NULL, NULL),
('5817', 'CARRION ROJAS LUIS ERICK', '48599620', '988328174', '10485996201', 'luiserickcarrionrojas285@gmail.com'),
('5817', 'HIDALGO RUIZ PEDRO', '8025863', '992077079', '10080258637', 'phidalgoruiz@hotmail.com'),
('5817', 'TEJADA RAMIREZ TATIANA MARIBEL', '75490511', '963658578', '10754905111', 'tejadatatiana86@gmail.com'),
('5819', 'ALVARADO LLEMPEN OSCAR MANUEL', '76758247', '971280731', '10767582477', 'oscarmauelall@gmail.com'),
('5820', 'QUEVEDO ASCARZA DAVIS FERNANDO', '45359528', '944920233', '10453595281', 'davisfernandoquevedoascarza@gmail.com'),
('5815', 'SEVILLANO LAFITTE YOMIRA YASMIN', '74775208', '917266880', '10747752082', 'sevillano.yasmin@gmail.com'),
('25226', 'VIGO CHUQUIPIONDO JHENER GONZALO', '47009014', '921722634', '10470090141', 'jhenervigo@gmail.com'),
('29480', 'GONZALES RIOS CESAR WALTER', '45088033', '950727585', '10450880332', 'cgonzalesrios@gmail.com'),
('28405', 'ALVARADO FERNANDEZ NANCY', '70602634', '941542073', '10706026342', 'nancy.rodrigo96@gmail.com'),
('7138', 'GABRIEL HUERTA CYNTHIA ABIGAIL', '45778498', '912834871', '10457784983', 'abiigh16@gmail.com'),
('5816', 'CASMA ESPINOZA YESSABELL', '71787877', '944664168', '10717878774', 'yessabell.05.09@gmail.com'),
('5816', 'DIAZ ZAVALA ALBERTO JESÚS', '70808723', '993412151', '10708087233', 'beto.escorpio.96@gmail.com'),
('5816', 'ROJAS CCORIMANYA JEYSSON ANTHONY', '74199708', '951334268', '10741997083', 'jeyson.3096@gmail.com'),
('7735', 'CASTILLA PARRA JOSE DAVID', '44695360', '993409350', '10446953601', 'JCASTILLAP87@GMAIL.COM'),
('10633', 'CUELLAR PASTOR RICARDO DANIEL', '72969508', '936839319', '10729695080', 'ricardo.cuellar.0409@gmail.com'),
('5818', 'FERNANDEZ REQUEJO KAROL MICHELLE', '71023473', '995850251', '1071023473', 'karol.fernandez0806@gmail.com'),
('5639', 'PÉREZ CARBAJAL JOSÉ JUSTINIANO', NULL, NULL, NULL, NULL),
('5644', 'CASTAÑEDA SANCHEZ IRINA MIRELLA', NULL, NULL, NULL, NULL),
('5644', 'ROJAS LEDESMA CARMEN CLAUDIA', NULL, NULL, NULL, NULL),
('5842', 'RAMOS MÉNDEZ VÍCTOR CÉSAR', NULL, NULL, NULL, NULL),
('5842', 'ROJAS ARAUJO ELIZABETH', NULL, NULL, NULL, NULL),
('5641', 'INGA ZAPATA NILSON PABLO', NULL, NULL, NULL, NULL),
('5642', 'JARAMILLO LOPEZ ANGELLA KARINA', NULL, NULL, NULL, NULL),
('5638', 'DANNIKA IVANNA SANGUINETTI CHAVARRY', NULL, NULL, NULL, NULL),
('5752', 'BALLON Y NAPA MICHAEL', NULL, NULL, NULL, NULL),
('5643', 'PORTUGAL ARANA JACKELYNE PORTUGAL', NULL, NULL, NULL, NULL),
('5745', 'BAZAN SOTOMAYOR MARIA MAGDALENA', NULL, NULL, NULL, NULL),
('5812', 'ROSAS CUZCANO MARIELA', NULL, NULL, NULL, NULL),
('5744', 'DONAYRE MACALUPU JESUS EDSON', NULL, NULL, NULL, NULL),
('5749', 'FLORES VELASQUEZ ADELITA ROSLIN', NULL, NULL, NULL, NULL),
('5742', 'CÉSPEDES ROJAS CAROL VANESSA', NULL, NULL, NULL, NULL),
('5742', 'VELIZ GONZALES DANIELA VALERY', NULL, NULL, NULL, NULL),
('5751', 'RIVERA SULLON LUIS MIGUEL', NULL, NULL, NULL, NULL),
('5805', 'VILLA YUPANQUI MAYRA ZUCET', NULL, NULL, NULL, NULL),
('5743', 'VARGAS TUME ROMY LISSET', NULL, NULL, NULL, NULL),
('5804', 'CALLE CASTILLO KELLY LIZETH', NULL, NULL, NULL, NULL),
('35351', 'GONZALES ZUÑIGA CARLOS', NULL, NULL, NULL, NULL),
('5809', 'LÓPEZ CONCHATUPA XIOMARA EUGENIA', NULL, NULL, NULL, NULL),
('5747', 'ZARATE PINEDA JUAN PABLO', NULL, NULL, NULL, NULL),
('5746', 'TORREBLANCA COLAN JESUS ALBERTO', NULL, NULL, NULL, NULL),
('5748', 'LEON OCHOA LUCIO JESUS', NULL, NULL, NULL, NULL),
('5811', 'FARFAN COBEÑAS JOYCE NICOLE', NULL, NULL, NULL, NULL),
('26017', 'AZA MUÑOZ NORMA MERCEDES', NULL, NULL, NULL, NULL);

-- Insertar digitadores cruzando por código de establecimiento
INSERT INTO digitadores (establecimiento_id, apellidos_nombres, dni, celular, ruc, correo)
SELECT e.id, t.apellidos_nombres, t.dni, t.celular, t.ruc, t.correo
FROM tmp_digitadores_csv t
JOIN establecimientos e ON e.codigo::text = t.codigo_eess;

-- Limpiar tabla temporal
DROP TABLE IF EXISTS tmp_digitadores_csv;

-- =========================================================
-- 6) Comentarios
-- =========================================================
COMMENT ON TABLE digitadores IS 'Digitadores asignados a cada establecimiento de salud';
COMMENT ON COLUMN digitadores.establecimiento_id IS 'FK al establecimiento donde trabaja el digitador';
COMMENT ON COLUMN digitadores.apellidos_nombres IS 'Nombre completo del digitador';
COMMENT ON COLUMN digitadores.activo IS 'Si el digitador está activo o no';
COMMENT ON COLUMN supervisiones.digitador_id IS 'FK al digitador seleccionado para esta supervisión';
