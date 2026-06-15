import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const updateSchema = z.object({
  importe: z.number().positive().optional(),
  formaPago: z.enum(["EFECTIVO", "TRANSFERENCIA", "OBRA_SOCIAL", "MUTUAL"]).optional(),
  estado: z.enum(["PENDIENTE", "PAGADO", "PARCIAL"]).optional(),
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

  const { importe, formaPago, estado, fechaPago, notas } = parsed.data;
  const updates: Record<string, unknown> = {};
  if (importe !== undefined) updates.importe = importe;
  if (formaPago !== undefined) updates.forma_pago = formaPago;
  if (estado !== undefined) updates.estado = estado;
  if (fechaPago !== undefined) updates.fecha_pago = fechaPago || null;
  if (notas !== undefined) updates.notas = notas || null;

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("cobros_kine").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("cobros_kine").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
