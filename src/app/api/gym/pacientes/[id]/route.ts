import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const updateSchema = z.object({
  nombre: z.string().min(1).optional(),
  fechaNacimiento: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  contactoEmergencia: z.string().optional().nullable(),
  obraSocial: z.string().optional().nullable(),
  observacionesMedicas: z.string().optional().nullable(),
  diasAsignados: z.array(z.enum(["LUNES","MARTES","MIERCOLES","JUEVES","VIERNES","SABADO"])).optional(),
  fechaInicio: z.string().optional(),
  estado: z.enum(["ACTIVO","INACTIVO","VACACIONES"]).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("pacientes_gym").select("*").eq("id", id).single();
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

  const { nombre, fechaNacimiento, telefono, contactoEmergencia, obraSocial, observacionesMedicas, diasAsignados, fechaInicio, estado } = parsed.data;
  const updates: Record<string, unknown> = {};
  if (nombre !== undefined) updates.nombre = nombre;
  if (fechaNacimiento !== undefined) updates.fecha_nacimiento = fechaNacimiento || null;
  if (telefono !== undefined) updates.telefono = telefono || null;
  if (contactoEmergencia !== undefined) updates.contacto_emergencia = contactoEmergencia || null;
  if (obraSocial !== undefined) updates.obra_social = obraSocial || null;
  if (observacionesMedicas !== undefined) updates.observaciones_medicas = observacionesMedicas || null;
  if (diasAsignados !== undefined) updates.dias_asignados = diasAsignados;
  if (fechaInicio !== undefined) updates.fecha_inicio = fechaInicio;
  if (estado !== undefined) updates.estado = estado;

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("pacientes_gym").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
