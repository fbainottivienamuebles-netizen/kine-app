"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, CheckCircle2, Clock, Loader2, X } from "lucide-react";
import { ETIQUETAS_FORMA_PAGO } from "@/lib/utils";

type PacienteGym = { id: string; nombre: string; estado: string };
type CuotaGym = {
  id: string;
  paciente_gym_id: string;
  periodo_mes: number;
  periodo_anio: number;
  importe: number;
  forma_pago: string;
  estado: string;
  fecha_pago: string | null;
  notas: string | null;
  paciente: PacienteGym;
};

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const FORMAS_PAGO = ["EFECTIVO","TRANSFERENCIA","OBRA_SOCIAL","MUTUAL"] as const;

type ModalState = { pacienteId: string; nombre: string; cuota: CuotaGym | null } | null;

export default function CobranzaGymPage() {
  const [pacientes, setPacientes] = useState<PacienteGym[]>([]);
  const [cuotas, setCuotas] = useState<CuotaGym[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(() => new Date().getMonth() + 1);
  const [anio, setAnio] = useState(() => new Date().getFullYear());
  const [modal, setModal] = useState<ModalState>(null);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [importe, setImporte] = useState("");
  const [formaPago, setFormaPago] = useState("EFECTIVO");
  const [fechaPago, setFechaPago] = useState("");
  const [notas, setNotas] = useState("");
  const [modalError, setModalError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/gym/pacientes?estado=ACTIVO"),
        fetch(`/api/gym/cobros?mes=${mes}&anio=${anio}`),
      ]);
      const [p, c] = await Promise.all([pRes.json(), cRes.json()]);
      setPacientes(Array.isArray(p) ? p : []);
      setCuotas(Array.isArray(c) ? c : []);
    } catch { setPacientes([]); setCuotas([]); }
    finally { setLoading(false); }
  }, [mes, anio]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function abrirModal(p: PacienteGym) {
    const cuota = cuotas.find((c) => c.paciente_gym_id === p.id) ?? null;
    setModal({ pacienteId: p.id, nombre: p.nombre, cuota });
    setImporte(cuota ? String(cuota.importe) : "");
    setFormaPago(cuota?.forma_pago ?? "EFECTIVO");
    setFechaPago(cuota?.fecha_pago ?? new Date().toISOString().slice(0, 10));
    setNotas(cuota?.notas ?? "");
    setModalError("");
  }

  async function handleGuardar() {
    if (!modal) return;
    const importeNum = parseFloat(importe.replace(",", "."));
    if (isNaN(importeNum) || importeNum <= 0) { setModalError("Importe inválido"); return; }
    setSaving(true);
    setModalError("");
    try {
      let res: Response;
      if (modal.cuota) {
        res = await fetch(`/api/gym/cobros/${modal.cuota.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ importe: importeNum, formaPago, estado: "PAGADO", fechaPago: fechaPago || null, notas }),
        });
      } else {
        res = await fetch("/api/gym/cobros", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pacienteGymId: modal.pacienteId, periodoMes: mes, periodoAnio: anio, importe: importeNum, formaPago, estado: "PAGADO", fechaPago: fechaPago || null, notas }),
        });
      }
      if (!res.ok) { const d = await res.json(); setModalError(d.error ?? "Error"); return; }
      await fetchData();
      setModal(null);
    } finally {
      setSaving(false);
    }
  }

  const cuotaMap = Object.fromEntries(cuotas.map((c) => [c.paciente_gym_id, c]));
  const totalCobrado = cuotas.filter((c) => c.estado === "PAGADO").reduce((acc, c) => acc + Number(c.importe), 0);
  const sinPagar = pacientes.filter((p) => !cuotaMap[p.id] || cuotaMap[p.id].estado !== "PAGADO").length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cobranza</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gimnasio · Cuotas mensuales</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Cobrado</p>
          <p className="text-2xl font-bold text-emerald-600">${totalCobrado.toLocaleString("es-AR")}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Sin pagar</p>
          <p className="text-2xl font-bold text-amber-500">{sinPagar}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Miembros activos</p>
          <p className="text-2xl font-bold text-gray-800">{pacientes.length}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={mes} onChange={(e) => setMes(Number(e.target.value))}
          className="px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
          {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={anio} onChange={(e) => setAnio(Number(e.target.value))}
          className="px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
          {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">Cargando...</div>
      ) : pacientes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <DollarSign size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hay miembros activos</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Miembro</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Importe</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Forma</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Fecha pago</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pacientes.map((p) => {
                const cuota = cuotaMap[p.id];
                const pagado = cuota?.estado === "PAGADO";
                return (
                  <tr key={p.id} onClick={() => abrirModal(p)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {cuota ? `$${Number(cuota.importe).toLocaleString("es-AR")}` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {cuota ? (ETIQUETAS_FORMA_PAGO[cuota.forma_pago] ?? cuota.forma_pago) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {cuota?.fecha_pago ? cuota.fecha_pago.slice(0, 10).split("-").reverse().join("/") : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {pagado ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                          <CheckCircle2 size={11} /> Pagado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                          <Clock size={11} /> Pendiente
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal inline */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Registrar cuota</h2>
                <p className="text-sm text-gray-500">{modal.nombre} · {MESES[mes - 1]} {anio}</p>
              </div>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Importe ($)</label>
                <input type="text" inputMode="decimal" value={importe} onChange={(e) => setImporte(e.target.value)}
                  placeholder="Ej: 15000"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Forma de pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {FORMAS_PAGO.map((f) => (
                    <button key={f} type="button" onClick={() => setFormaPago(f)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                        formaPago === f ? "bg-emerald-600 text-white border-emerald-600" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}>
                      {ETIQUETAS_FORMA_PAGO[f]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de pago</label>
                <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              {modalError && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">{modalError}</div>}
              <div className="flex gap-2 pt-1">
                <div className="flex-1" />
                <button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleGuardar} disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {modal.cuota ? "Actualizar" : "Registrar pago"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
