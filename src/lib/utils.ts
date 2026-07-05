import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFecha(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatHora(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export function calcularEdad(fechaNacimiento: Date | string): number {
  const nacimiento = typeof fechaNacimiento === "string" ? new Date(fechaNacimiento) : fechaNacimiento;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}

export function calcularSemanaCiclo(fechaInicioRutina: Date | string): number {
  const inicio = typeof fechaInicioRutina === "string" ? new Date(fechaInicioRutina) : fechaInicioRutina;
  const hoy = new Date();
  const diasTranscurridos = Math.floor((hoy.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.floor(diasTranscurridos / 7) + 1, 4);
}

export const COLORES_TRATAMIENTO: Record<string, string> = {
  MASAJES: "bg-blue-100 text-blue-800 border-blue-300",
  REHABILITACION: "bg-green-100 text-green-800 border-green-300",
  DRENAJE_LINFATICO: "bg-purple-100 text-purple-800 border-purple-300",
  DRENAJE_BOTAS: "bg-violet-200 text-violet-900 border-violet-400",
  DRENAJE_KINE: "bg-teal-100 text-teal-800 border-teal-300",
  HIPOPRESIVOS: "bg-orange-100 text-orange-800 border-orange-300",
};

export const ETIQUETAS_TRATAMIENTO: Record<string, string> = {
  MASAJES: "Masajes",
  REHABILITACION: "Rehabilitación",
  DRENAJE_LINFATICO: "Drenaje linfático",
  DRENAJE_BOTAS: "Botas",
  DRENAJE_KINE: "Drenaje + Kinesiología",
  HIPOPRESIVOS: "Hipopresivos",
};

export const ETIQUETAS_ESTADO_TURNO: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  PRESENTE: "Presente",
  AUSENTE: "Ausente",
  CANCELADO: "Cancelado",
};

export const ETIQUETAS_FORMA_PAGO: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  OBRA_SOCIAL: "Obra social",
  MUTUAL: "Mutual",
};

export const DIAS_SEMANA = [
  { value: "LUNES", label: "Lunes" },
  { value: "MARTES", label: "Martes" },
  { value: "MIERCOLES", label: "Miércoles" },
  { value: "JUEVES", label: "Jueves" },
  { value: "VIERNES", label: "Viernes" },
  { value: "SABADO", label: "Sábado" },
];
