import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";

const ETAPAS_ORDENADAS = [
  "ENTRADA_CALOR",
  "PRIMERA_ETAPA",
  "SEGUNDA_ETAPA",
  "TERCERA_ETAPA",
  "TRABAJO_FINAL",
] as const;

const CANTIDAD_POR_ETAPA: Record<string, number> = {
  ENTRADA_CALOR: 3,
  PRIMERA_ETAPA: 2,
  SEGUNDA_ETAPA: 2,
  TERCERA_ETAPA: 2,
  TRABAJO_FINAL: 2,
};

const NIVELES_PERMITIDOS: Record<string, string[]> = {
  basico: ["basico"],
  intermedio: ["basico", "intermedio"],
  avanzado: ["basico", "intermedio", "avanzado"],
};

const TODOS_NIVELES = ["basico", "intermedio", "avanzado"];

const ETAPA_LABELS: Record<string, string> = {
  ENTRADA_CALOR: "entrada en calor",
  PRIMERA_ETAPA: "1ª etapa",
  SEGUNDA_ETAPA: "2ª etapa",
  TERCERA_ETAPA: "3ª etapa",
  TRABAJO_FINAL: "trabajo final",
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const pacienteId: string = body.pacienteId;
  const soloEtapa: string | undefined = body.etapa;
  const excluirIdsParam: string[] = body.excluirIds ?? [];

  if (!pacienteId) return NextResponse.json({ error: "pacienteId requerido" }, { status: 400 });

  const supabase = createServiceClient();

  const [pacienteResult, rutinasResult, bibliotecaResult] = await Promise.all([
    supabase.from("pacientes").select("nivel_entrenamiento").eq("id", pacienteId).single(),
    supabase
      .from("rutinas")
      .select("id, ejercicios:ejercicios_rutina(ejercicio_id, etapa)")
      .eq("paciente_gym_id", pacienteId)
      .order("fecha_inicio", { ascending: false })
      .limit(3),
    supabase
      .from("biblioteca_ejercicios")
      .select("id, nombre, grupo_muscular, imagen_url, niveles, etapas")
      .eq("activo", true),
  ]);

  if (bibliotecaResult.error || !bibliotecaResult.data) {
    return NextResponse.json({ error: "Error al cargar biblioteca" }, { status: 500 });
  }

  const nivelPaciente: string = (pacienteResult.data as any)?.nivel_entrenamiento ?? "basico";
  const nivelesPermitidos = NIVELES_PERMITIDOS[nivelPaciente] ?? ["basico"];
  const rutinas: Array<{ id: string; ejercicios: Array<{ ejercicio_id: string | null; etapa: string }> }> =
    (rutinasResult.data as any[]) ?? [];
  const biblioteca = bibliotecaResult.data as Array<{
    id: string;
    nombre: string;
    grupo_muscular: string | null;
    imagen_url: string | null;
    niveles: string[] | null;
    etapas: string[] | null;
  }>;

  const etapasAGenerar = soloEtapa ? [soloEtapa] : [...ETAPAS_ORDENADAS];
  const rutinaSugerida: Record<string, typeof biblioteca> = {};
  const avisos: string[] = [];
  const yaSeleccionados = new Set<string>(excluirIdsParam);

  for (const etapa of etapasAGenerar) {
    const cantidad = CANTIDAD_POR_ETAPA[etapa] ?? 2;

    // Step 1: filter by stage
    const enEtapa = biblioteca.filter(
      (e) => Array.isArray(e.etapas) && e.etapas.includes(etapa) && !yaSeleccionados.has(e.id)
    );

    // Step 2: filter by patient level. If the preferred levels don't yield enough
    // exercises, broaden the pool to all levels so the stage isn't left empty
    // (the library may not have exercises tagged at the patient's exact level).
    const construirCandidatos = (niveles: string[]) =>
      enEtapa.filter((e) => Array.isArray(e.niveles) && e.niveles.some((n) => niveles.includes(n)));

    let candidatos = construirCandidatos(nivelesPermitidos);
    if (candidatos.length < cantidad) {
      const ampliados = construirCandidatos(TODOS_NIVELES);
      if (ampliados.length > candidatos.length) candidatos = ampliados;
    }

    // Step 3 & 4: try decreasing history windows
    let seleccionados: typeof candidatos = [];
    let suficientes = false;

    for (const ventana of [3, 2, 1, 0]) {
      let pool = candidatos;

      if (ventana > 0) {
        const usadosEnEtapa = new Set<string>(
          rutinas
            .slice(0, ventana)
            .flatMap((r) =>
              r.ejercicios
                .filter((e) => e.etapa === etapa && e.ejercicio_id)
                .map((e) => e.ejercicio_id as string)
            )
        );
        pool = candidatos.filter((e) => !usadosEnEtapa.has(e.id));
      }

      if (pool.length >= cantidad) {
        seleccionados = shuffle(pool).slice(0, cantidad);
        suficientes = true;
        break;
      }
    }

    if (!suficientes) {
      seleccionados = shuffle(candidatos).slice(0, cantidad);
      if (seleccionados.length < cantidad) {
        avisos.push(
          `No hay suficientes ejercicios cargados para ${ETAPA_LABELS[etapa] ?? etapa}. Considerá agregar más ejercicios a la biblioteca para esa etapa.`
        );
      }
    }

    rutinaSugerida[etapa] = seleccionados;
    seleccionados.forEach((e) => yaSeleccionados.add(e.id));
  }

  return NextResponse.json({
    rutina: rutinaSugerida,
    avisos,
    nivelPaciente,
    biblioteca: soloEtapa ? undefined : biblioteca,
  });
}
