import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const updateSchema = z.object({
  importe: z.number().positive().optional(),
  formaPago: z.enum(["EFECTIVO","TRANSFERENCIA","OBRA_SOCIAL","MUTUAL"]).optional(),
  estado: z.enum(["PENDIENTE","PAGADO","VENCIDO"]).optional(),
  fechaPago: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.importe !== undefined) updates.importe = d.importe;
  if (d.formaPago !== undefined) updates.forma_pago = d.formaPago;
  if (d.estado !== undefined) updates.estado = d.estado;
  if (d.fechaPago !== undefined) updates.fecha_pago = d.fechaPago || null;
  if (d.notas !== undefined) updates.notas = d.notas || null;

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("cobros_gym").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
