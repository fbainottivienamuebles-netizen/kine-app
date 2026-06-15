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
  activoKine: z.boolean().optional(),
  nroAfiliado: z.string().optional().nullable(),
  diagnostico: z.string().optional().nullable(),
  tratamientos: z.array(z.enum(["MASAJES","REHABILITACION","DRENAJE_LINFATICO","DRENAJE_BOTAS","DRENAJE_KINE","HIPOPRESIVOS"])).optional(),
  observaciones: z.string().optional().nullable(),
  activoGym: z.boolean().optional(),
  contactoEmergencia: z.string().optional().nullable(),
  observacionesMedicas: z.string().optional().nullable(),
  diasAsignados: z.array(z.enum(["LUNES","MARTES","MIERCOLES","JUEVES","VIERNES","SABADO"])).optional(),
  fechaInicioGym: z.string().optional().nullable(),
  estadoGym: z.enum(["ACTIVO","INACTIVO","VACACIONES"]).optional(),
  activo: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("pacientes").select("*").eq("id", id).single();
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

  const d = parsed.data;
  const updates: Record<string, unknown> = {};
  if (d.nombre !== undefined) updates.nombre = d.nombre;
  if (d.dni !== undefined) updates.dni = d.dni || null;
  if (d.telefono !== undefined) updates.telefono = d.telefono || null;
  if (d.email !== undefined) updates.email = d.email || null;
  if (d.fechaNacimiento !== undefined) updates.fecha_nacimiento = d.fechaNacimiento || null;
  if (d.obraSocial !== undefined) updates.obra_social = d.obraSocial || null;
  if (d.activoKine !== undefined) updates.activo_kine = d.activoKine;
  if (d.nroAfiliado !== undefined) updates.nro_afiliado = d.nroAfiliado || null;
  if (d.diagnostico !== undefined) updates.diagnostico = d.diagnostico || null;
  if (d.tratamientos !== undefined) updates.tratamientos = d.tratamientos;
  if (d.observaciones !== undefined) updates.observaciones = d.observaciones || null;
  if (d.activoGym !== undefined) updates.activo_gym = d.activoGym;
  if (d.contactoEmergencia !== undefined) updates.contacto_emergencia = d.contactoEmergencia || null;
  if (d.observacionesMedicas !== undefined) updates.observaciones_medicas = d.observacionesMedicas || null;
  if (d.diasAsignados !== undefined) updates.dias_asignados = d.diasAsignados;
  if (d.fechaInicioGym !== undefined) updates.fecha_inicio_gym = d.fechaInicioGym || null;
  if (d.estadoGym !== undefined) updates.estado_gym = d.estadoGym;
  if (d.activo !== undefined) updates.activo = d.activo;

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("pacientes").update(updates).eq("id", id).select().single();

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
  const { error } = await supabase.from("pacientes").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") return NextResponse.json({ error: "El paciente tiene registros asociados y no puede eliminarse" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
