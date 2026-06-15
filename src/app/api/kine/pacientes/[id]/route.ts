import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const updateSchema = z.object({
  nombre: z.string().min(1).optional(),
  dni: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  fechaNacimiento: z.string().optional().nullable(),
  obraSocial: z.string().optional().nullable(),
  nroAfiliado: z.string().optional().nullable(),
  diagnostico: z.string().optional().nullable(),
  tratamientos: z
    .array(z.enum(["MASAJES", "REHABILITACION", "DRENAJE_LINFATICO", "DRENAJE_BOTAS", "DRENAJE_KINE", "HIPOPRESIVOS"]))
    .optional(),
  observaciones: z.string().optional().nullable(),
  activo: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("pacientes_kine").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { nombre, dni, telefono, email, fechaNacimiento, obraSocial, nroAfiliado, diagnostico, tratamientos, observaciones, activo } =
    parsed.data;

  const updates: Record<string, unknown> = {};
  if (nombre !== undefined) updates.nombre = nombre;
  if (dni !== undefined) updates.dni = dni;
  if (telefono !== undefined) updates.telefono = telefono || null;
  if (email !== undefined) updates.email = email || null;
  if (fechaNacimiento !== undefined) updates.fecha_nacimiento = fechaNacimiento || null;
  if (obraSocial !== undefined) updates.obra_social = obraSocial || null;
  if (nroAfiliado !== undefined) updates.nro_afiliado = nroAfiliado || null;
  if (diagnostico !== undefined) updates.diagnostico = diagnostico || null;
  if (tratamientos !== undefined) updates.tratamientos = tratamientos;
  if (observaciones !== undefined) updates.observaciones = observaciones || null;
  if (activo !== undefined) updates.activo = activo;

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("pacientes_kine").update(updates).eq("id", id).select().single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Ya existe un paciente con ese DNI" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("pacientes_kine").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") return NextResponse.json({ error: "El paciente tiene turnos o cobros registrados y no puede eliminarse" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
