"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { ETIQUETAS_TRATAMIENTO, ETIQUETAS_FORMA_PAGO } from "@/lib/utils";

type Cobro = {
  id: string;
  importe: number;
  forma_pago: string;
  estado: string;
  fecha_pago: string | null;
  nro_recibo: number | null;
  notas: string | null;
};

type Turno = {
  id: string;
  fecha: string;
  hora_inicio: string;
  tipo_tratamiento: string;
  paciente: { id: string; nombre: string };
  cobro: Cobro[] | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  turno: Turno | null;
};

const FORMAS_PAGO = ["EFECTIVO", "TRANSFERENCIA", "OBRA_SOCIAL", "MUTUAL"] as const;
const ESTADOS_PAGO = [
  { value: "PAGADO", label: "Pagado" },
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "PARCIAL", label: "Parcial" },
] as const;

export function CobroModal({ isOpen, onClose, onSuccess, turno }: Props) {
  const cobroExistente = turno?.cobro?.[0] ?? null;
  const editando = !!cobroExistente;

  const [importe, setImporte] = useState("");
  const [formaPago, setFormaPago] = useState<string>("EFECTIVO");
  const [estado, setEstado] = useState("PAGADO");
  const [fechaPago, setFechaPago] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !turno) return;
    if (cobroExistente) {
      setImporte(String(cobroExistente.importe));
      setFormaPago(cobroExistente.forma_pago);
      setEstado(cobroExistente.estado);
      setFechaPago(cobroExistente.fecha_pago ?? "");
      setNotas(cobroExistente.notas ?? "");
    } else {
      setImporte("");
      setFormaPago("EFECTIVO");
      setEstado("PAGADO");
      setFechaPago(new Date().toISOString().slice(0, 10));
      setNotas("");
    }
    setError("");
  }, [isOpen, turno, cobroExistente]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!turno) return;
    const importeNum = parseFloat(importe.replace(",", "."));
    if (isNaN(importeNum) || importeNum <= 0) { setError("Importe inválido"); return; }
    setError("");
    setLoading(true);
    try {
      let res: Response;
      if (editando && cobroExistente) {
        res = await fetch(`/api/kine/cobros/${cobroExistente.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ importe: importeNum, formaPago, estado, fechaPago: fechaPago || null, notas }),
        });
      } else {
        res = await fetch("/api/kine/cobros", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            turnoId: turno.id,
            pacienteId: turno.paciente.id,
            importe: importeNum,
            formaPago,
            estado,
            fechaPago: fechaPago || null,
            notas,
          }),
        });
      }
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al guardar"); return; }
      onSuccess();
      onClose();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar() {
    if (!cobroExistente || !confirm("¿Eliminar este cobro?")) return;
    setLoading(true);
    try {
      await fetch(`/api/kine/cobros/${cobroExistente.id}`, { method: "DELETE" });
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !turno) return null;

  const fechaTurno = turno.fecha.slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {editando ? "Editar cobro" : "Registrar cobro"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-2">
          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 space-y-1">
            <p className="font-semibold text-gray-900">{turno.paciente.nombre}</p>
            <p>{fechaTurno.split("-").reverse().join("/")} · {turno.hora_inicio.slice(0, 5)} · {ETIQUETAS_TRATAMIENTO[turno.tipo_tratamiento] ?? turno.tipo_tratamiento}</p>
            {editando && cobroExistente?.nro_recibo && (
              <p className="text-indigo-600 font-medium">Recibo #{cobroExistente.nro_recibo}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Importe ($) <span className="text-red-500">*</span></label>
            <input
              type="text"
              inputMode="decimal"
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
              required
              placeholder="Ej: 5000"
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Forma de pago</label>
            <div className="grid grid-cols-2 gap-2">
              {FORMAS_PAGO.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormaPago(f)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    formaPago === f
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {ETIQUETAS_FORMA_PAGO[f]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ESTADOS_PAGO.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de pago</label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">{error}</div>
          )}

          <div className="flex gap-2">
            {editando && (
              <button type="button" onClick={handleEliminar} disabled={loading}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50">
                Eliminar
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {editando ? "Guardar" : "Registrar cobro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
