import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const estado = searchParams.get("estado") ?? "";

  const supabase = createServiceClient();
  let query = supabase
    .from("pacientes")
    .select("id, nombre, telefono, dias_asignados, fecha_inicio_gym, estado_gym, obra_social, fecha_nacimiento, nivel_entrenamiento")
    .eq("activo_gym", true)
    .order("nombre", { ascending: true });

  if (q) query = query.ilike("nombre", `%${q}%`);
  if (estado) query = query.eq("estado_gym", estado);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
