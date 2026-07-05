import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const schema = z.object({
  tipo: z.enum(["confirmacion", "modificacion", "cancelacion", "recordatorio"]),
});

// Marca un turno como notificado por WhatsApp. Se llama cuando Jimena toca el
// botón que abre wa.me (la app no puede saber si el mensaje se envió realmente,
// solo registra que se abrió la conversación).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("turnos")
    .update({
      notificado_wa: true,
      notificado_wa_at: new Date().toISOString(),
      notificado_wa_tipo: parsed.data.tipo,
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
