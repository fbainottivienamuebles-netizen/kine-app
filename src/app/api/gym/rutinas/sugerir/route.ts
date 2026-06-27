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

// Grupos musculares (tal como se guardan en la biblioteca) que componen cada
// categoría conceptual del plan de rutina.
const CATEGORIAS: Record<string, string[]> = {
  core: ["Core"],
  pierna: ["Piernas", "Glúteos"],
  brazo: ["Brazos", "Pecho", "Hombros"],
  espalda: ["Espalda"],
  zona_media: ["Core"],
};

const CATEGORIA_LABEL: Record<string, string> = {
  core: "core",
  pierna: "pierna",
  brazo: "brazo",
  espalda: "espalda",
  zona_media: "zona media",
};

// Plan de slots por etapa. Cada slot define las categorías aceptables (se elige
// la primera que tenga ejercicios disponibles). { match: i } obliga a usar la
// MISMA categoría que se eligió en el slot i (ej: 1ª etapa, brazo→brazo / pierna→pierna).
type SlotSpec = { categorias: string[] } | { match: number };

const PLAN_ETAPAS: Record<string, SlotSpec[]> = {
  ENTRADA_CALOR: [
    { categorias: ["core"] },
    { categorias: ["core"] },
    { categorias: ["pierna", "brazo"] },
  ],
  PRIMERA_ETAPA: [
    { categorias: ["brazo", "pierna"] },
    { match: 0 },
  ],
  SEGUNDA_ETAPA: [
    { categorias: ["pierna"] },
    { categorias: ["core", "espalda"] },
  ],
  TERCERA_ETAPA: [
    { categorias: ["brazo"] },
    { categorias: ["brazo"] },
  ],
  TRABAJO_FINAL: [
    { categorias: ["brazo"] },
    { categorias: ["espalda", "zona_media"] },
  ],
};

function mismoGrupo(a: string | null, b: string): boolean {
  if (!a) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

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

  const nivelPaciente: string =
    (pacienteResult.data as { nivel_entrenamiento?: string | null } | null)?.nivel_entrenamiento ?? "basico";
  const nivelesPermitidos = NIVELES_PERMITIDOS[nivelPaciente] ?? ["basico"];
  type RutinaHistorial = { id: string; ejercicios: Array<{ ejercicio_id: string | null; etapa: string }> };
  const rutinas: RutinaHistorial[] = (rutinasResult.data as RutinaHistorial[] | null) ?? [];
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
    const plan = PLAN_ETAPAS[etapa] ?? [];
    const cantidad = plan.length || (CANTIDAD_POR_ETAPA[etapa] ?? 2);

    // Ejercicios de esta etapa (todavía se filtran por nivel/grupo más abajo).
    const enEtapa = biblioteca.filter(
      (e) => Array.isArray(e.etapas) && e.etapas.includes(etapa)
    );

    // Ids usados en las últimas `ventana` rutinas para esta etapa (para no repetir).
    const usadosEnVentana = (ventana: number) =>
      ventana <= 0
        ? new Set<string>()
        : new Set<string>(
            rutinas
              .slice(0, ventana)
              .flatMap((r) =>
                r.ejercicios
                  .filter((e) => e.etapa === etapa && e.ejercicio_id)
                  .map((e) => e.ejercicio_id as string)
              )
          );

    // Filtra por nivel del paciente; si no alcanza, amplía a todos los niveles
    // (la biblioteca puede no tener ejercicios al nivel exacto del paciente).
    const filtrarPorNivel = (pool: typeof biblioteca) => {
      const preferidos = pool.filter(
        (e) => Array.isArray(e.niveles) && e.niveles.some((n) => nivelesPermitidos.includes(n))
      );
      if (preferidos.length > 0) return preferidos;
      return pool.filter(
        (e) => Array.isArray(e.niveles) && e.niveles.some((n) => TODOS_NIVELES.includes(n))
      );
    };

    // Elige un ejercicio prefiriendo los no usados en el historial reciente.
    const elegirUno = (candidatos: typeof biblioteca) => {
      for (const ventana of [3, 2, 1, 0]) {
        const usados = usadosEnVentana(ventana);
        const pool = candidatos.filter((e) => !usados.has(e.id));
        if (pool.length > 0) return shuffle(pool)[0];
      }
      return null;
    };

    const seleccionados: typeof biblioteca = [];
    const categoriasElegidas: (string | null)[] = [];

    for (let i = 0; i < plan.length; i++) {
      const slot = plan[i];

      // Categorías aceptables para este slot (resolviendo dependencias { match }).
      let categoriasSlot: string[];
      if ("match" in slot) {
        const refCat = categoriasElegidas[slot.match];
        const refSlot = plan[slot.match];
        categoriasSlot = refCat ? [refCat] : ("categorias" in refSlot ? refSlot.categorias : []);
      } else {
        categoriasSlot = slot.categorias;
      }

      let elegido: (typeof biblioteca)[number] | null = null;
      let categoriaElegida: string | null = null;

      // Probar cada categoría aceptable (en orden aleatorio) hasta encontrar ejercicio.
      for (const categoria of shuffle(categoriasSlot)) {
        const grupos = CATEGORIAS[categoria] ?? [];
        const candidatos = filtrarPorNivel(
          enEtapa.filter(
            (e) =>
              !yaSeleccionados.has(e.id) &&
              grupos.some((g) => mismoGrupo(e.grupo_muscular, g))
          )
        );
        const c = elegirUno(candidatos);
        if (c) {
          elegido = c;
          categoriaElegida = categoria;
          break;
        }
      }

      // Fallback: si no hay ejercicios del grupo pedido, completar con cualquiera de la etapa.
      if (!elegido) {
        const c = elegirUno(filtrarPorNivel(enEtapa.filter((e) => !yaSeleccionados.has(e.id))));
        if (c) {
          elegido = c;
          if (categoriasSlot.length > 0) {
            const nombres = categoriasSlot.map((cat) => CATEGORIA_LABEL[cat] ?? cat).join(" o ");
            avisos.push(
              `En ${ETAPA_LABELS[etapa] ?? etapa} no hay ejercicios de ${nombres}; se completó con otro grupo.`
            );
          }
        }
      }

      if (elegido) {
        seleccionados.push(elegido);
        categoriasElegidas.push(categoriaElegida);
        yaSeleccionados.add(elegido.id);
      } else {
        categoriasElegidas.push(null);
      }
    }

    if (seleccionados.length < cantidad) {
      avisos.push(
        `No hay suficientes ejercicios cargados para ${ETAPA_LABELS[etapa] ?? etapa}. Considerá agregar más ejercicios a la biblioteca para esa etapa.`
      );
    }

    rutinaSugerida[etapa] = seleccionados;
  }

  return NextResponse.json({
    rutina: rutinaSugerida,
    avisos: [...new Set(avisos)],
    nivelPaciente,
    biblioteca: soloEtapa ? undefined : biblioteca,
  });
}
