import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const cobroSchema = z.object({
  turnoId: z.string().min(1),
  pacienteId: z.string().min(1),
  importe: z.number().positive(),
  formaPago: z.enum(["EFECTIVO", "TRANSFERENCIA", "OBRA_SOCIAL", "MUTUAL"]),
  estado: z.enum(["PENDIENTE", "PAGADO", "PARCIAL"]).default("PAGADO"),
  fechaPago: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const estadoPago = searchParams.get("estado");

  const supabase = createServiceClient();
  let query = supabase
    .from("turnos")
    .select(`
      id, fecha, hora_inicio, tipo_tratamiento, estado, usa_botas,
      paciente:pacientes(id, nombre, dni),
      cobro:cobros_kine(id, importe, forma_pago, estado, fecha_pago, nro_recibo, notas)
    `)
    .not("estado", "in", "(CANCELADO,AUSENTE)")
    .order("fecha", { ascending: false })
    .order("hora_inicio", { ascending: true });

  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let result = data ?? [];
  if (estadoPago === "PENDIENTE") {
    result = result.filter((t) => !(t.cobro as unknown as Array<unknown>)?.length);
  } else if (estadoPago === "PAGADO") {
    result = result.filter((t) => (t.cobro as unknown as Array<{ estado: string }>)?.[0]?.estado === "PAGADO");
  }

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = cobroSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { turnoId, pacienteId, importe, formaPago, estado, fechaPago, notas } = parsed.data;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("cobros_kine")
    .insert({
      id: randomUUID(),
      turno_id: turnoId,
      paciente_id: pacienteId,
      importe,
      forma_pago: formaPago,
      estado,
      fecha_pago: fechaPago || null,
      notas: notas || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Ya existe un cobro para ese turno" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
