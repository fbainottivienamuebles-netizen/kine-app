// Configuración del consultorio usada en los mensajes de WhatsApp.
//
// TODO (Fase futura — Settings): mover esto a una tabla de configuración
// editable desde la app para que Jimena pueda cambiar el teléfono sin deploy.
// Por ahora vive acá y se puede sobreescribir con variables de entorno
// (deben empezar con NEXT_PUBLIC_ para estar disponibles en el cliente).

export const CONSULTORIO = {
  /** Teléfono que aparece como contacto de Jimena en los mensajes. */
  telefono: process.env.NEXT_PUBLIC_TELEFONO_CONSULTORIO || "3415488051",
  /** Firma con el nombre profesional. */
  nombre: process.env.NEXT_PUBLIC_NOMBRE_CONSULTORIO || "Jimena Salamano, Kinesióloga",
  /** Emoji decorativo al final de la firma. */
  emoji: process.env.NEXT_PUBLIC_EMOJI_FIRMA || "🌿",
};
