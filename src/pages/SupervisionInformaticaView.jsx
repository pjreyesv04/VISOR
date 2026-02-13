import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";

function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const k = keyFn(item) ?? "SIN_SECCION";
    acc[k] = acc[k] || [];
    acc[k].push(item);
    return acc;
  }, {});
}

export default function SupervisionInformaticaView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [supervision, setSupervision] = useState(null);
  const [risNombre, setRisNombre] = useState("");
  const [eessNombre, setEessNombre] = useState("");
  const [auditorNombre, setAuditorNombre] = useState("");
  const [parametros, setParametros] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [evidencias, setEvidencias] = useState([]);
  const [firmaUrls, setFirmaUrls] = useState({ supervisor: null, digitador: null, medicoJefe: null });
  const [archivamientoRows, setArchivamientoRows] = useState([]);
  const [controlCalidadRows, setControlCalidadRows] = useState([]);

  const seccionesAgrupadas = useMemo(() => {
    const activos = (parametros || []).filter((p) => p.activo !== false);
    const grouped = groupBy(activos, (p) => p.seccion || "SIN_SECCION");
    Object.keys(grouped).forEach((k) => {
      grouped[k] = grouped[k].sort((a, b) => (a.orden ?? 9999) - (b.orden ?? 9999));
    });
    return grouped;
  }, [parametros]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Supervisión
      const { data: sup } = await supabase
        .from("supervisiones")
        .select("*, auditor:user_profiles!auditor_id(nombre)")
        .eq("id", id)
        .single();

      if (!sup) { setLoading(false); return; }
      setSupervision(sup);
      setAuditorNombre(sup.auditor_eliminado ? `Eliminado (${sup.auditor_nombre_eliminado || "Desconocido"})` : sup.auditor?.nombre || "—");

      // RIS / EESS
      const { data: ris } = await supabase.from("ris").select("nombre").eq("id", sup.ris_id).single();
      setRisNombre(ris?.nombre || "");
      const { data: est } = await supabase.from("establecimientos").select("nombre").eq("id", sup.establecimiento_id).single();
      setEessNombre(est?.nombre || "");

      // Parámetros IT
      const { data: params } = await supabase
        .from("parametros")
        .select("id,seccion,codigo,descripcion,requiere_observacion,orden,activo,tipo_campo_condicional,condicion_campo,etiqueta_campo_condicional,has_tabla_extra")
        .eq("tipo_supervision", "informatico")
        .order("seccion").order("orden");
      setParametros(params || []);

      // Respuestas
      const { data: resp } = await supabase
        .from("respuestas")
        .select("parametro_id,valor_bool,observacion,valor_fecha,valor_cantidad,valor_cantidad_2,valor_cantidad_3,valor_texto")
        .eq("supervision_id", id);
      const map = {};
      (resp || []).forEach((r) => { map[r.parametro_id] = r; });
      setRespuestas(map);

      // Archivamiento
      const { data: archData } = await supabase
        .from("archivamiento_supervisado").select("*")
        .eq("supervision_id", id).order("fila_numero");
      setArchivamientoRows(archData || []);

      // Control Calidad
      const { data: ccData } = await supabase
        .from("control_calidad_fua").select("*")
        .eq("supervision_id", id).order("fila_numero");
      setControlCalidadRows(ccData || []);

      // Evidencias
      const { data: evData } = await supabase
        .from("evidencias").select("id,archivo_url,tipo,created_at,descripcion")
        .eq("supervision_id", id).order("created_at", { ascending: false });
      const withSigned = [];
      for (const ev of (evData || [])) {
        let signedUrl = null;
        try {
          const { data: sdata } = await supabase.storage.from("evidencias").createSignedUrl(ev.archivo_url, 3600);
          signedUrl = sdata?.signedUrl || null;
        } catch { /* ignore */ }
        withSigned.push({ ...ev, signedUrl });
      }
      setEvidencias(withSigned);

      // Firmas
      const makeFirmaUrl = async (path) => {
        if (!path) return null;
        const { data } = await supabase.storage.from("firmas").createSignedUrl(path, 3600);
        return data?.signedUrl || null;
      };
      setFirmaUrls({
        supervisor: await makeFirmaUrl(sup.firma_url),
        digitador: await makeFirmaUrl(sup.firma_digitador_url),
        medicoJefe: await makeFirmaUrl(sup.firma_medico_jefe_url),
      });

      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" />
        <p className="mt-2 text-muted">Cargando supervisión informática...</p>
      </div>
    );
  }

  if (!supervision) {
    return <div className="alert alert-danger">No se encontró la supervisión.</div>;
  }

  const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString() : "—");
  const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

  const estadoBadge = (estado) => {
    const map = { borrador: "bg-warning text-dark", completado: "bg-success", revisado: "bg-primary" };
    return map[estado] || "bg-secondary";
  };

  const marcarRevisado = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("supervisiones")
      .update({ estado: "revisado", revisado_por: userData?.user?.id, revisado_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error("Error al marcar como revisado"); }
    else { toast.success("Supervisión marcada como revisada"); nav("/supervisiones-informatica"); }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Cabecera */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h5 className="mb-1">ACTA DE SUPERVISIÓN — INFORMÁTICA</h5>
              <div className="text-muted">
                <strong>N:</strong> {supervision.correlativo ?? "—"} |{" "}
                <strong>RIS:</strong> {risNombre || "—"} |{" "}
                <strong>EESS:</strong> {eessNombre || "—"}
              </div>
            </div>
            <div className="text-end">
              <span className={`badge ${estadoBadge(supervision.estado)} mb-1`}>{supervision.estado}</span>
              <div style={{ fontSize: "0.85rem" }}>
                <div><strong>Fecha:</strong> {fmt(supervision.fecha)}</div>
                <div><strong>Inicio:</strong> {fmtTime(supervision.hora_inicio)}</div>
                <div><strong>Fin:</strong> {fmtTime(supervision.hora_fin)}</div>
              </div>
            </div>
          </div>
          <hr />
          <div className="row g-3">
            <div className="col-md-3">
              <small className="text-muted">Supervisor Informático</small>
              <div className="fw-semibold">{auditorNombre}</div>
            </div>
            <div className="col-md-3">
              <small className="text-muted">Sector de Trabajo</small>
              <div className="fw-semibold">{supervision.sector_trabajo || "—"}</div>
            </div>
            <div className="col-md-3">
              <small className="text-muted">Médico Jefe</small>
              <div className="fw-semibold">{supervision.medico_jefe || "—"}</div>
            </div>
            <div className="col-md-3">
              <small className="text-muted">Digitador</small>
              <div className="fw-semibold">{supervision.digitador || "—"}</div>
            </div>
            {supervision.cel_correo_locador && (
              <div className="col-md-6">
                <small className="text-muted">Cel/Correo Locador</small>
                <div className="fw-semibold">{supervision.cel_correo_locador}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Evaluación */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <h6>Aspectos de Evaluación</h6>
          <hr />
          {Object.keys(seccionesAgrupadas).length === 0 ? (
            <p className="text-muted">No hay parámetros registrados.</p>
          ) : (
            Object.entries(seccionesAgrupadas).map(([seccion, items]) => (
              <div key={seccion} className="mb-4">
                <div className="fw-bold text-uppercase mb-2" style={{ fontSize: "0.85rem", letterSpacing: "0.4px" }}>{seccion}</div>
                {items.map((p) => {
                  const r = respuestas[p.id];
                  const isTableOnly = p.has_tabla_extra === "tabla_archivamiento" || p.has_tabla_extra === "tabla_control_calidad";
                  const isCantidadOnly = p.tipo_campo_condicional === "cantidad" && p.condicion_campo === "siempre" && !p.has_tabla_extra;
                  return (
                    <div key={p.id} className="d-flex justify-content-between align-items-start border-bottom py-2">
                      <div style={{ flex: 1 }}>
                        <div>{p.codigo ? `${p.codigo}. ` : ""}{p.descripcion}</div>
                        {r?.valor_cantidad != null && (
                          <small className="text-info d-block mt-1">
                            <strong>{p.etiqueta_campo_condicional || "Cantidad"}:</strong> {r.valor_cantidad}
                          </small>
                        )}
                        {r?.valor_texto && (
                          <small className="text-info d-block mt-1">
                            <strong>{p.etiqueta_campo_condicional || "Detalle"}:</strong> {r.valor_texto}
                          </small>
                        )}
                        {r?.observacion && (
                          <small className="text-muted d-block mt-1">Obs: {r.observacion}</small>
                        )}
                      </div>
                      {!isTableOnly && !isCantidadOnly && (
                        <div className="ms-3">
                          {r?.valor_bool === true && <span className="badge bg-success">SI</span>}
                          {r?.valor_bool === false && <span className="badge bg-danger">NO</span>}
                          {r?.valor_bool == null && <span className="badge bg-secondary">—</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Archivamiento Supervisado */}
      {archivamientoRows.length > 0 && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <h6>Archivamiento Supervisado</h6>
            <hr />
            <div className="table-responsive">
              <table className="table table-bordered table-sm" style={{ fontSize: "0.82rem" }}>
                <thead className="table-light">
                  <tr>
                    <th>N°</th><th>Año</th><th>Mes Inicio</th><th>Mes Fin</th><th>N° Caja</th><th>N° Tomo</th><th>Cant. Foleo</th><th>Cant. FUAs</th><th>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {archivamientoRows.map((a) => (
                    <tr key={a.fila_numero}>
                      <td>{a.fila_numero}</td><td>{a.anio || "—"}</td><td>{a.mes_inicio || "—"}</td><td>{a.mes_fin || "—"}</td>
                      <td>{a.nro_caja || "—"}</td><td>{a.nro_tomo || "—"}</td><td>{a.cantidad_foleo ?? "—"}</td><td>{a.cantidad_fuas ?? "—"}</td><td>{a.observacion || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Control de Calidad */}
      {controlCalidadRows.length > 0 && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <h6>Ficha de Control de Calidad del Registro de Digitación de las FUAs</h6>
            <hr />
            <div className="table-responsive">
              <table className="table table-bordered table-sm" style={{ fontSize: "0.82rem" }}>
                <thead className="table-light">
                  <tr>
                    <th>N°</th><th>FUA</th><th>Fecha Atención</th><th>Cód. Prest.</th><th>Nombre Profesional</th><th>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {controlCalidadRows.map((c) => (
                    <tr key={c.fila_numero}>
                      <td>{c.fila_numero}</td><td>{c.fua || "—"}</td>
                      <td>{c.fecha_atencion ? new Date(c.fecha_atencion + "T00:00:00").toLocaleDateString() : "—"}</td>
                      <td>{c.cod_prestacional || "—"}</td><td>{c.nombre_profesional || "—"}</td><td>{c.observacion || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Otras Actividades */}
      {supervision.otras_actividades && Object.values(supervision.otras_actividades).some((v) => v) && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <h6>Otras Actividades del Supervisor Informático</h6>
            <hr />
            {["A", "B", "C", "D", "E", "F"].map((letra) =>
              supervision.otras_actividades[letra] ? (
                <div key={letra} className="mb-2">
                  <strong>{letra}.</strong> {supervision.otras_actividades[letra]}
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Observaciones y Recomendaciones */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <h6>Observaciones y Recomendaciones</h6>
          <hr />
          <div className="mb-3">
            <small className="text-muted">Observaciones en General</small>
            <div className="border rounded p-2 bg-light" style={{ minHeight: 60 }}>
              {supervision.observaciones || "Sin observaciones"}
            </div>
          </div>
          <div>
            <small className="text-muted">Recomendaciones</small>
            <div className="border rounded p-2 bg-light" style={{ minHeight: 60 }}>
              {supervision.recomendaciones || "Sin recomendaciones"}
            </div>
          </div>
        </div>
      </div>

      {/* Evidencias */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <h6>Evidencias ({evidencias.length})</h6>
          <hr />
          {evidencias.length === 0 ? (
            <p className="text-muted">No hay evidencias registradas.</p>
          ) : (
            <div className="list-group">
              {evidencias.map((ev) => (
                <div key={ev.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-semibold" style={{ fontSize: "0.85rem" }}>{ev.archivo_url.split("/").slice(-1)[0]}</div>
                    <small className="text-muted">{ev.tipo || "archivo"} — {ev.created_at ? new Date(ev.created_at).toLocaleString() : ""}</small>
                  </div>
                  {ev.signedUrl && (
                    <a className="btn btn-sm btn-outline-primary" href={ev.signedUrl} target="_blank" rel="noreferrer">Abrir</a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Firmas */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <h6>Firmas</h6>
          <hr />
          <div className="row g-3">
            {[
              { label: "Médico Jefe del EESS", url: firmaUrls.medicoJefe },
              { label: "Locador de Servicio OFSEG", url: firmaUrls.digitador },
              { label: "Supervisor Informático OFSEG", url: firmaUrls.supervisor },
            ].map((f) => (
              <div key={f.label} className="col-md-4 text-center">
                <div className="border rounded bg-light d-flex align-items-center justify-content-center" style={{ height: 150 }}>
                  {f.url ? (
                    <img src={f.url} alt={f.label} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  ) : (
                    <span className="text-muted">Sin firma</span>
                  )}
                </div>
                <small className="text-muted">{f.label}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="d-flex gap-2 mb-4 no-print">
        <button className="btn btn-outline-secondary" onClick={() => nav("/supervisiones-informatica")}>Volver</button>
        <button className="btn btn-outline-dark" onClick={() => window.print()}>Imprimir / PDF</button>
        {isAdmin && supervision.estado === "completado" && (
          <button className="btn btn-success" onClick={marcarRevisado}>Marcar como Revisada</button>
        )}
      </div>
    </div>
  );
}
