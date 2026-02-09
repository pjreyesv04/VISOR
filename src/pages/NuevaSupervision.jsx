import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function NuevaSupervision() {
  const nav = useNavigate();
  const [ris, setRis] = useState([]);
  const [eess, setEess] = useState([]);
  const [risId, setRisId] = useState("");
  const [eessId, setEessId] = useState("");
  // Usar fecha local sin conversión de zona horaria
  const getLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [fecha, setFecha] = useState(getLocalDate());
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase.from("ris").select("id,nombre").order("nombre")
      .then(({ data, error }) => {
        if (error) setErr(error.message);
        setRis(data || []);
      });
  }, []);

  useEffect(() => {
    if (!risId) { setEess([]); setEessId(""); return; }
    supabase.from("establecimientos").select("id,nombre").eq("ris_id", risId).order("nombre")
      .then(({ data, error }) => {
        if (error) setErr(error.message);
        setEess(data || []);
      });
  }, [risId]);

  const crear = async () => {
    setErr("");
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return setErr("Sesión no válida");

    const { data, error } = await supabase
      .from("supervisiones")
      .insert([{
        auditor_id: user.id,
        ris_id: risId,
        establecimiento_id: eessId,
        fecha,
        hora_inicio: new Date().toISOString(),
        estado: "borrador"
      }])
      .select("id")
      .single();

    if (error) return setErr(error.message);
    nav(`/supervision/${data.id}`);
  };

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <h4>Nueva supervisión</h4>

      <div className="row mt-3 g-3">
        <div className="col-md-4">
          <label className="form-label">RIS</label>
          <select className="form-select" value={risId} onChange={(e) => setRisId(e.target.value)}>
            <option value="">Seleccione...</option>
            {ris.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
        </div>

        <div className="col-md-5">
          <label className="form-label">Establecimiento</label>
          <select className="form-select" value={eessId} onChange={(e) => setEessId(e.target.value)} disabled={!risId}>
            <option value="">Seleccione...</option>
            {eess.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label">Fecha</label>
          <input type="date" className="form-control" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>

      {err && <div className="alert alert-danger mt-3">{err}</div>}

      <button className="btn btn-primary mt-3" disabled={!risId || !eessId} onClick={crear}>
        Crear y continuar
      </button>
    </div>
  );
}
