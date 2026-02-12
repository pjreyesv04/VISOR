import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

export default function DigitadorManagement() {
  const [digitadores, setDigitadores] = useState([]);
  const [establecimientos, setEstablecimientos] = useState([]);
  const [risList, setRisList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterRis, setFilterRis] = useState("");
  const [filterEess, setFilterEess] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos"); // todos | activos | inactivos
  const [searchText, setSearchText] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    apellidos_nombres: "",
    dni: "",
    celular: "",
    ruc: "",
    correo: "",
    establecimiento_id: "",
    activo: true,
  });
  const [saving, setSaving] = useState(false);

  // Modal eliminar
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);

    const [risRes, eessRes, digRes] = await Promise.all([
      supabase.from("ris").select("id, nombre").order("nombre"),
      supabase.from("establecimientos").select("id, nombre, ris_id").order("nombre"),
      supabase
        .from("digitadores")
        .select("id, apellidos_nombres, dni, celular, ruc, correo, activo, establecimiento_id, created_at")
        .order("apellidos_nombres"),
    ]);

    if (risRes.error) toast.error("Error cargando RIS");
    if (eessRes.error) toast.error("Error cargando establecimientos");
    if (digRes.error) toast.error("Error cargando digitadores");

    setRisList(risRes.data || []);
    setEstablecimientos(eessRes.data || []);
    setDigitadores(digRes.data || []);
    setLoading(false);
  };

  // Establecimientos filtrados por RIS (para el filtro)
  const eessFiltradosPorRis = filterRis
    ? establecimientos.filter((e) => e.ris_id === filterRis)
    : establecimientos;

  // Filtrar digitadores
  const filtered = digitadores.filter((d) => {
    // Filtro por estado
    if (filterEstado === "activos" && !d.activo) return false;
    if (filterEstado === "inactivos" && d.activo) return false;

    // Filtro por establecimiento
    if (filterEess && d.establecimiento_id !== filterEess) return false;

    // Filtro por RIS (a través del establecimiento)
    if (filterRis && !filterEess) {
      const est = establecimientos.find((e) => e.id === d.establecimiento_id);
      if (!est || est.ris_id !== filterRis) return false;
    }

    // Búsqueda por texto
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const match =
        (d.apellidos_nombres || "").toLowerCase().includes(q) ||
        (d.dni || "").toLowerCase().includes(q) ||
        (d.correo || "").toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const getEessNombre = (eessId) => {
    const e = establecimientos.find((x) => x.id === eessId);
    return e?.nombre || "—";
  };

  const getRisNombreByEess = (eessId) => {
    const e = establecimientos.find((x) => x.id === eessId);
    if (!e) return "—";
    const r = risList.find((x) => x.id === e.ris_id);
    return r?.nombre || "—";
  };

  // CRUD
  const openCreate = () => {
    setEditing(null);
    setFormData({
      apellidos_nombres: "",
      dni: "",
      celular: "",
      ruc: "",
      correo: "",
      establecimiento_id: eessFiltradosPorRis[0]?.id || "",
      activo: true,
    });
    setShowModal(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setFormData({
      apellidos_nombres: d.apellidos_nombres || "",
      dni: d.dni || "",
      celular: d.celular || "",
      ruc: d.ruc || "",
      correo: d.correo || "",
      establecimiento_id: d.establecimiento_id || "",
      activo: d.activo ?? true,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.apellidos_nombres.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!formData.establecimiento_id) {
      toast.error("Debe seleccionar un establecimiento");
      return;
    }

    setSaving(true);

    const payload = {
      apellidos_nombres: formData.apellidos_nombres.trim(),
      dni: formData.dni.trim() || null,
      celular: formData.celular.trim() || null,
      ruc: formData.ruc.trim() || null,
      correo: formData.correo.trim() || null,
      establecimiento_id: formData.establecimiento_id,
      activo: formData.activo,
    };

    if (editing) {
      const { error } = await supabase.from("digitadores").update(payload).eq("id", editing.id);
      if (error) {
        toast.error("Error: " + error.message);
      } else {
        toast.success("Digitador actualizado");
        setShowModal(false);
        fetchAll();
      }
    } else {
      const { error } = await supabase.from("digitadores").insert([payload]);
      if (error) {
        toast.error("Error: " + error.message);
      } else {
        toast.success("Digitador creado");
        setShowModal(false);
        fetchAll();
      }
    }

    setSaving(false);
  };

  const toggleActivo = async (d) => {
    const nuevoEstado = !d.activo;
    const { error } = await supabase.from("digitadores").update({ activo: nuevoEstado }).eq("id", d.id);
    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success(nuevoEstado ? "Digitador activado" : "Digitador desactivado");
      fetchAll();
    }
  };

  const confirmDelete = (d) => {
    setDeleting(d);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("digitadores").delete().eq("id", deleting.id);
    if (error) {
      toast.error("Error al eliminar: " + error.message);
    } else {
      toast.success("Digitador eliminado");
      setShowDeleteModal(false);
      setDeleting(null);
      fetchAll();
    }
  };

  // Establecimientos para el formulario modal (filtrados por RIS si hay filtro activo)
  const eessParaModal = formData._risModal
    ? establecimientos.filter((e) => e.ris_id === formData._risModal)
    : establecimientos;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Gestión de Digitadores</h4>
        <div className="d-flex gap-2">
          <span className="badge bg-primary align-self-center">{filtered.length} registros</span>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            + Nuevo Digitador
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label mb-0" style={{ fontSize: "0.8rem" }}>RIS</label>
              <select
                className="form-select form-select-sm"
                value={filterRis}
                onChange={(e) => { setFilterRis(e.target.value); setFilterEess(""); }}
              >
                <option value="">Todos</option>
                {risList.map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label mb-0" style={{ fontSize: "0.8rem" }}>Establecimiento</label>
              <select
                className="form-select form-select-sm"
                value={filterEess}
                onChange={(e) => setFilterEess(e.target.value)}
                disabled={eessFiltradosPorRis.length === 0}
              >
                <option value="">Todos</option>
                {eessFiltradosPorRis.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label mb-0" style={{ fontSize: "0.8rem" }}>Estado</label>
              <select
                className="form-select form-select-sm"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label mb-0" style={{ fontSize: "0.8rem" }}>Buscar</label>
              <input
                className="form-control form-control-sm"
                placeholder="Nombre, DNI o correo..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-4">
              <div className="spinner-border spinner-border-sm text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-4 text-muted">No hay digitadores que coincidan con los filtros</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ fontSize: "0.88rem" }}>
                <thead className="table-light">
                  <tr>
                    <th>Apellidos y Nombres</th>
                    <th>DNI</th>
                    <th>Establecimiento</th>
                    <th>RIS</th>
                    <th>Celular</th>
                    <th>Correo</th>
                    <th className="text-center">Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id} className={!d.activo ? "table-secondary" : ""}>
                      <td className="fw-semibold">{d.apellidos_nombres}</td>
                      <td>{d.dni || "—"}</td>
                      <td>{getEessNombre(d.establecimiento_id)}</td>
                      <td>{getRisNombreByEess(d.establecimiento_id)}</td>
                      <td>{d.celular || "—"}</td>
                      <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {d.correo || "—"}
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge ${d.activo ? "bg-success" : "bg-secondary"}`}
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleActivo(d)}
                          title="Clic para cambiar estado"
                        >
                          {d.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-primary" onClick={() => openEdit(d)} title="Editar">
                            Editar
                          </button>
                          <button className="btn btn-outline-danger" onClick={() => confirmDelete(d)} title="Eliminar">
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title">
                    {editing ? "Editar Digitador" : "Nuevo Digitador"}
                  </h6>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Apellidos y Nombres *</label>
                      <input
                        className="form-control"
                        value={formData.apellidos_nombres}
                        onChange={(e) => setFormData({ ...formData, apellidos_nombres: e.target.value })}
                        placeholder="Apellidos y nombres completos"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">DNI</label>
                      <input
                        className="form-control"
                        value={formData.dni}
                        onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                        placeholder="N° DNI"
                        maxLength={8}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Celular</label>
                      <input
                        className="form-control"
                        value={formData.celular}
                        onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                        placeholder="N° Celular"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">RUC</label>
                      <input
                        className="form-control"
                        value={formData.ruc}
                        onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                        placeholder="N° RUC"
                      />
                    </div>

                    <div className="col-md-8">
                      <label className="form-label">Correo</label>
                      <input
                        className="form-control"
                        type="email"
                        value={formData.correo}
                        onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                        placeholder="correo@ejemplo.com"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Estado</label>
                      <select
                        className="form-select"
                        value={formData.activo ? "true" : "false"}
                        onChange={(e) => setFormData({ ...formData, activo: e.target.value === "true" })}
                      >
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                    </div>

                    {/* RIS selector para filtrar establecimientos en el modal */}
                    <div className="col-md-5">
                      <label className="form-label">RIS (filtro)</label>
                      <select
                        className="form-select"
                        value={formData._risModal || ""}
                        onChange={(e) => setFormData({ ...formData, _risModal: e.target.value, establecimiento_id: "" })}
                      >
                        <option value="">Todos los RIS</option>
                        {risList.map((r) => (
                          <option key={r.id} value={r.id}>{r.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-7">
                      <label className="form-label">Establecimiento *</label>
                      <select
                        className="form-select"
                        value={formData.establecimiento_id}
                        onChange={(e) => setFormData({ ...formData, establecimiento_id: e.target.value })}
                      >
                        <option value="">Seleccione establecimiento...</option>
                        {eessParaModal.map((e) => (
                          <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSave}>
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Confirmar Eliminación */}
      {showDeleteModal && deleting && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered modal-sm">
              <div className="modal-content">
                <div className="modal-header bg-danger text-white">
                  <h6 className="modal-title">Confirmar Eliminación</h6>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)} />
                </div>
                <div className="modal-body">
                  <p className="mb-1">¿Está seguro de eliminar al digitador:</p>
                  <p className="fw-bold">{deleting.apellidos_nombres}</p>
                  <p className="text-danger" style={{ fontSize: "0.85rem" }}>
                    Esta acción no se puede deshacer. Si el digitador tiene supervisiones asociadas, considere desactivarlo en su lugar.
                  </p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowDeleteModal(false)}>
                    Cancelar
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
