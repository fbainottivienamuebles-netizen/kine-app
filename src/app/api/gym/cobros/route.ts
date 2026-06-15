import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const cobroSchema = z.object({
  pacienteGymId: z.string().min(1),
  periodoMes: z.number().int().min(1).max(12),
  periodoAnio: z.number().int().min(2020),
  importe: z.number().positive(),
  formaPago: z.enum(["EFECTIVO","TRANSFERENCIA","OBRA_SOCIAL","MUTUAL"]),
  estado: z.enum(["PENDIENTE","PAGADO","VENCIDO"]).default("PAGADO"),
  fechaPago: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes");
  const anio = searchParams.get("anio");
  const estadoFilter = searchParams.get("estado");

  const supabase = createServiceClient();
  let query = supabase
    .from("cobros_gym")
    .select("*, paciente:pacientes(id, nombre, dias_asignados, estado)")
    .order("periodo_anio", { ascending: false })
    .order("periodo_mes", { ascending: false });

  if (mes) query = query.eq("periodo_mes", parseInt(mes));
  if (anio) query = query.eq("periodo_anio", parseInt(anio));
  if (estadoFilter) query = query.eq("estado", estadoFilter);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = cobroSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { pacienteGymId, periodoMes, periodoAnio, importe, formaPago, estado, fechaPago, notas } = parsed.data;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("cobros_gym")
    .upsert(
      {
        id: randomUUID(),
        paciente_gym_id: pacienteGymId,
        periodo_mes: periodoMes,
        periodo_anio: periodoAnio,
        importe,
        forma_pago: formaPago,
        estado,
        fecha_pago: fechaPago || null,
        notas: notas || null,
      },
      { onConflict: "paciente_gym_id,periodo_mes,periodo_anio" }
    )
    .select("*, paciente:pacientes(id, nombre)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
