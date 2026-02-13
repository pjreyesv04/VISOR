import jsPDF from "jspdf";
import "jspdf-autotable";

export function exportSupervisionInformaticaPdf(
  supervision,
  respuestas,
  parametros,
  risNombre,
  eessNombre,
  archivamientoRows,
  controlCalidadRows
) {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(13);
  doc.text("ACTA DE SUPERVISIÓN - INFORMÁTICA", 14, 20);

  // Info general
  doc.setFontSize(9);
  doc.text(`N° Correlativo: ${supervision.correlativo ?? "—"}`, 14, 30);
  doc.text(`Sector de Trabajo: ${supervision.sector_trabajo || "—"}`, 14, 35);
  doc.text(`RIS: ${risNombre || "—"}`, 14, 40);
  doc.text(`EE.SS. Supervisado: ${eessNombre || "—"}`, 14, 45);
  doc.text(`Digitador Supervisado: ${supervision.digitador || "—"}`, 14, 50);
  doc.text(`Cel/Correo Locador: ${supervision.cel_correo_locador || "—"}`, 14, 55);
  doc.text(`Médico Jefe: ${supervision.medico_jefe || "—"}`, 14, 60);
  doc.text(`Estado: ${supervision.estado || "—"}`, 140, 30);

  const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString() : "—";
  const fmtTime = (iso) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

  doc.text(`Fecha: ${fmtDate(supervision.fecha)}`, 140, 35);
  doc.text(`Hora Inicio: ${fmtTime(supervision.hora_inicio)}`, 140, 40);
  doc.text(`Hora Fin: ${fmtTime(supervision.hora_fin)}`, 140, 45);

  // Tabla de parámetros/respuestas
  const tableData = parametros
    .filter((p) => p.activo !== false)
    .filter((p) => p.has_tabla_extra !== "tabla_archivamiento" && p.has_tabla_extra !== "tabla_control_calidad")
    .map((p) => {
      const r = respuestas[p.id];
      let detalle = "";
      if (r?.valor_cantidad != null) {
        detalle = String(r.valor_cantidad);
        if (p.etiqueta_campo_condicional?.includes("%")) {
          detalle += "%";
        }
        if (p.etiqueta_campo_condicional?.includes("Mbps")) {
          detalle += " Mbps";
        }
      } else if (r?.valor_texto) {
        detalle = r.valor_texto;
      } else if (r?.valor_fecha) {
        detalle = new Date(r.valor_fecha + "T00:00:00").toLocaleDateString();
      }

      // Determinar si es solo cantidad (sin Si/No)
      const esSoloCantidad =
        p.tipo_campo_condicional === "cantidad" && p.condicion_campo === "siempre";

      return [
        p.codigo || "",
        p.descripcion || "",
        esSoloCantidad ? "—" : r?.valor_bool === true ? "SI" : r?.valor_bool === false ? "NO" : "—",
        detalle,
        r?.observacion || "",
      ];
    });

  doc.autoTable({
    startY: 68,
    head: [["Cód.", "Descripción", "Cumple", "Valor", "Observación"]],
    body: tableData,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 65 },
      2: { cellWidth: 12 },
      3: { cellWidth: 30 },
      4: { cellWidth: 60 },
    },
  });

  // ========== ARCHIVAMIENTO SUPERVISADO ==========
  const archFiltered = (archivamientoRows || []).filter(
    (a) => a.anio || a.nro_caja || a.nro_tomo || a.cantidad_fuas
  );

  if (archFiltered.length > 0) {
    doc.addPage();
    doc.setFontSize(11);
    doc.text("ARCHIVAMIENTO SUPERVISADO", 14, 20);

    const archData = archFiltered.map((a) => [
      a.fila_numero || "",
      a.anio || "",
      a.mes_inicio || "",
      a.mes_fin || "",
      a.nro_caja || "",
      a.nro_tomo || "",
      a.cantidad_foleo ?? "",
      a.cantidad_fuas ?? "",
      a.observacion || "",
    ]);

    doc.autoTable({
      startY: 28,
      head: [["N°", "Año", "Mes Inicio", "Mes Fin", "N° Caja", "N° Tomo", "Foleo", "FUAs", "Obs."]],
      body: archData,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });
  }

  // ========== CONTROL DE CALIDAD ==========
  const ccFiltered = (controlCalidadRows || []).filter(
    (c) => c.fua || c.nombre_profesional || c.cod_prestacional
  );

  if (ccFiltered.length > 0) {
    doc.addPage();
    doc.setFontSize(11);
    doc.text("FICHA DE CONTROL DE CALIDAD DEL REGISTRO DE DIGITACIÓN DE LAS FUAs", 14, 20);

    const ccData = ccFiltered.map((c) => [
      c.fila_numero || "",
      c.fua || "",
      c.fecha_atencion ? new Date(c.fecha_atencion + "T00:00:00").toLocaleDateString() : "",
      c.cod_prestacional || "",
      c.nombre_profesional || "",
      c.observacion || "",
    ]);

    doc.autoTable({
      startY: 28,
      head: [["N°", "FUA", "Fecha Atención", "Cód. Prest.", "Profesional", "Observación"]],
      body: ccData,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      columnStyles: {
        1: { cellWidth: 35 },
        4: { cellWidth: 40 },
      },
    });
  }

  // ========== OTRAS ACTIVIDADES ==========
  let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 30;

  const actividades = supervision.otras_actividades || {};
  const tieneActividades = Object.values(actividades).some((v) => v);

  if (tieneActividades) {
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(10);
    doc.text("OTRAS ACTIVIDADES REALIZADAS POR EL SUPERVISOR INFORMÁTICO", 14, currentY);
    currentY += 6;
    doc.setFontSize(8);
    ["A", "B", "C", "D", "E", "F"].forEach((letra) => {
      if (actividades[letra]) {
        doc.text(`${letra}. ${actividades[letra]}`, 14, currentY, { maxWidth: 180 });
        currentY += 6;
      }
    });
    currentY += 4;
  }

  // ========== OBSERVACIONES Y RECOMENDACIONES ==========
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(10);
  doc.text("OBSERVACIONES EN GENERAL", 14, currentY);
  currentY += 5;
  doc.setFontSize(8);
  doc.text(supervision.observaciones || "Sin observaciones", 14, currentY, { maxWidth: 180 });
  currentY += 20;

  if (currentY > 260) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(10);
  doc.text("RECOMENDACIONES", 14, currentY);
  currentY += 5;
  doc.setFontSize(8);
  doc.text(supervision.recomendaciones || "Sin recomendaciones", 14, currentY, { maxWidth: 180 });

  doc.save(`supervision_informatica_${supervision.correlativo || supervision.id}.pdf`);
}
