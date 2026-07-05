// Utilidades para enviar turnos por WhatsApp usando wa.me (Click to Chat).
// Todas las funciones son puras: seguras para usar tanto en cliente como en
// servidor (no dependen de window ni de la red).

import { ETIQUETAS_TRATAMIENTO } from "./utils";
import { CONSULTORIO } from "./consultorio";

export type TipoNotificacionWa = "confirmacion" | "modificacion" | "cancelacion" | "recordatorio";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/**
 * Normaliza un teléfono argentino al formato internacional que usa WhatsApp:
 * 54 + 9 + código de área (sin 0) + número (sin 15).
 * El "9" es obligatorio para celulares argentinos en wa.me / WhatsApp.
 * Devuelve null si no hay dígitos suficientes para ser un número válido.
 */
export function formatearTelefonoAr(telefono: string | null | undefined): string | null {
  if (!telefono) return null;
  let tel = telefono.replace(/\D/g, ""); // solo dígitos
  if (!tel) return null;
  if (tel.startsWith("54")) tel = tel.slice(2); // sacar código de país si vino
  if (tel.startsWith("9")) tel = tel.slice(1);  // sacar el 9 de celular si ya venía
  if (tel.startsWith("0")) tel = tel.slice(1);  // sacar 0 inicial del área
  if (tel.startsWith("15")) tel = tel.slice(2); // sacar 15 si quedó al inicio
  if (tel.length < 8) return null;              // muy corto para ser válido
  return "549" + tel;                            // 54 (país) + 9 (celular) + área + número
}

/** Devuelve true si el paciente tiene un teléfono usable para WhatsApp. */
export function tieneWhatsApp(telefono: string | null | undefined): boolean {
  return formatearTelefonoAr(telefono) !== null;
}

function partesFecha(fecha: string) {
  // fecha viene como "YYYY-MM-DD". Parseamos manual para evitar el corrimiento
  // de día que produce new Date("YYYY-MM-DD") al interpretarlo como UTC.
  const [y, m, d] = fecha.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return { diaSemana: DIAS[dt.getDay()], dia: d, mes: MESES[m - 1], anio: y };
}

type DatosMensaje = {
  nombrePaciente: string;
  fecha: string;       // "YYYY-MM-DD"
  horaInicio: string;  // "HH:MM" o "HH:MM:SS"
  tipoTratamiento: string;
};

/** Arma el texto del mensaje según la situación (confirmación / modificación / cancelación). */
export function construirMensajeWa(tipo: TipoNotificacionWa, datos: DatosMensaje): string {
  const { diaSemana, dia, mes, anio } = partesFecha(datos.fecha);
  const nombre = datos.nombrePaciente.trim().split(/\s+/)[0]; // solo el primer nombre
  const hora = datos.horaInicio.slice(0, 5);
  const tratamiento = ETIQUETAS_TRATAMIENTO[datos.tipoTratamiento] ?? datos.tipoTratamiento;
  const tel = CONSULTORIO.telefono;
  const firma = `${CONSULTORIO.nombre} ${CONSULTORIO.emoji}`;

  if (tipo === "cancelacion") {
    return `Hola ${nombre} 👋

Te aviso que tu turno del ${diaSemana} ${dia} de ${mes} a las ${hora} hs fue cancelado.

Comunicate al ${tel} para coordinar un nuevo turno cuando quieras.

¡Hasta pronto! — ${firma}`;
  }

  if (tipo === "recordatorio") {
    return `Hola ${nombre} 👋

Te recuerdo tu turno para el ${diaSemana} ${dia} de ${mes} a las ${hora} hs:

💆 ${tratamiento}

Ante cualquier cambio, avisame al ${tel}.

¡Te espero! — ${firma}`;
  }

  const encabezado =
    tipo === "modificacion"
      ? "Te aviso que tu turno fue modificado:"
      : "Te confirmo tu turno en el consultorio:";
  const cierre = tipo === "modificacion" ? "consulta" : "cambio";

  return `Hola ${nombre} 👋

${encabezado}

📅 ${diaSemana} ${dia} de ${mes} de ${anio}
🕐 ${hora} hs
💆 ${tratamiento}

Ante cualquier ${cierre}, comunicate al ${tel}.

¡Hasta pronto! — ${firma}`;
}

/** Construye la URL wa.me con el número internacional y el mensaje codificado. */
export function buildWhatsAppUrl(numeroInternacional: string, mensaje: string): string {
  return `https://wa.me/${numeroInternacional}?text=${encodeURIComponent(mensaje)}`;
}
