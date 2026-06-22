'use client';

import type { RutinaForPDF, EjercicioForPDF } from './rutina-pdf';

const ETAPAS = [
  { key: 'ENTRADA_CALOR',  label: 'ENTRADA EN CALOR',            color: '#D97706', bg: '#FFFBEB' },
  { key: 'PRIMERA_ETAPA',  label: 'ETAPA 1 — Fuerza inicial',    color: '#0EA5E9', bg: '#F0F9FF' },
  { key: 'SEGUNDA_ETAPA',  label: 'ETAPA 2 — Fuerza intermedio', color: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'TERCERA_ETAPA',  label: 'ETAPA 3 — Fuerza avanzado',   color: '#EC4899', bg: '#FFF1F8' },
  { key: 'TRABAJO_FINAL',  label: 'TRABAJO FINAL — Vuelta a la calma', color: '#10B981', bg: '#F0FDF4' },
];

const SEMANA_COLS = [
  { header: '#0EA5E9', activeBg: '#DBEAFE', activeText: '#0EA5E9' },
  { header: '#8B5CF6', activeBg: '#EDE9FE', activeText: '#8B5CF6' },
  { header: '#EC4899', activeBg: '#FCE7F3', activeText: '#EC4899' },
  { header: '#10B981', activeBg: '#D1FAE5', activeText: '#059669' },
];

// Ancho fijo de cada columna S1-S4 (mismo en todas las etapas → alineación garantizada)
const S_COL = '40pt';

function semanaCiclo(fechaInicio: string): number {
  const inicio = new Date(fechaInicio + 'T00:00:00');
  const dias = Math.floor((Date.now() - inicio.getTime()) / 86400000);
  return Math.min(Math.max(Math.floor(dias / 7) + 1, 1), 4);
}

function formatFecha(f: string) {
  return f.split('-').reverse().join('/');
}

function colgroup(): string {
  return `<colgroup><col><col style="width:${S_COL}"><col style="width:${S_COL}"><col style="width:${S_COL}"><col style="width:${S_COL}"></colgroup>`;
}

function semHeaderRow(semana: number): string {
  const cells = SEMANA_COLS.map((sc, i) => {
    const active = i + 1 === semana;
    return `<td style="background:${sc.header};color:#fff;font-weight:bold;font-size:8.5pt;text-align:center;padding:2px 3px;border-radius:2px;">${active ? `S${i + 1}✱` : `S${i + 1}`}</td>`;
  }).join('');
  return `<tr><td></td>${cells}</tr>`;
}

function ejercicioRow(ej: EjercicioForPDF, semana: number): string {
  const nombre = ej.ejercicio?.nombre ?? ej.nombre_libre ?? 'Ejercicio';
  const nota = ej.notas
    ? `<div style="font-size:8pt;color:#64748B;margin-top:1px;">${ej.notas}</div>`
    : '';

  const valueCells = ([1, 2, 3, 4] as const).map((s) => {
    const series = ej[`series_s${s}` as keyof EjercicioForPDF] as number | null;
    const reps   = ej[`reps_s${s}` as keyof EjercicioForPDF] as number | null;
    const active = s === semana;
    const sc = SEMANA_COLS[s - 1];
    const style = active
      ? `background:${sc.activeBg};color:${sc.activeText};font-weight:bold;`
      : `color:#1E293B;background:#fff;`;
    return `<td style="${style}font-size:10pt;text-align:center;padding:3px 2px;border-radius:2px;border-bottom:1.5pt solid #C4B5FD;">${series ?? '-'}×${reps ?? '-'}</td>`;
  }).join('');

  return `
    <tr>
      <td style="background:#fff;padding:3px 6px;vertical-align:middle;border-bottom:1.5pt solid #C4B5FD;">
        <div style="font-weight:bold;font-size:10.5pt;color:#1E293B;overflow-wrap:break-word;word-break:break-word;">${nombre}</div>${nota}
      </td>
      ${valueCells}
    </tr>`;
}

function colHTML(rutina: RutinaForPDF, profesional: string, semana: number, hoy: string): string {
  const etapasHTML = ETAPAS.map((etapa) => {
    const items = rutina.ejercicios
      .filter((e) => e.etapa === etapa.key)
      .sort((a, b) => a.orden - b.orden);
    if (!items.length) return '';

    const rows = items.map((ej) => ejercicioRow(ej, semana)).join('');

    return `
      <div style="margin-bottom:5pt;">
        <div style="background:${etapa.color};color:#fff;font-weight:bold;font-size:8.5pt;padding:2px 7px;border-radius:2px;margin-bottom:2px;">${etapa.label}</div>
        <table style="width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;">
          ${colgroup()}
          <thead>${semHeaderRow(semana)}</thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }).join('');

  return `
    <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between;min-width:0;">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4pt;">
          <div>
            <div style="font-size:12pt;font-weight:bold;color:#1E293B;">${rutina.paciente.nombre}</div>
            <div style="font-size:7pt;color:#64748B;margin-top:1px;">${hoy}</div>
          </div>
          <div style="font-size:10pt;font-weight:bold;color:#8B5CF6;white-space:nowrap;padding-left:8px;">Semana ${semana} de 4</div>
        </div>
        <div style="border-bottom:2px solid #8B5CF6;margin-bottom:5pt;"></div>
        ${etapasHTML}
      </div>
      <div style="border-top:0.5pt solid #E2E8F0;margin-top:6pt;padding-top:3pt;text-align:center;font-size:6.5pt;color:#94A3B8;">
        ${profesional} — Rutina válida hasta ${formatFecha(rutina.fecha_vencimiento)}
      </div>
    </div>`;
}

function buildPrintHTML(rutina1: RutinaForPDF, rutina2: RutinaForPDF, profesional: string): string {
  const semana1 = semanaCiclo(rutina1.fecha_inicio);
  const semana2 = semanaCiclo(rutina2.fecha_inicio);
  const hoy = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const col1 = colHTML(rutina1, profesional, semana1, hoy);
  const col2 = colHTML(rutina2, profesional, semana2, hoy);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Rutinas</title>
  <style>
    @page { size: A4 landscape; margin: 6mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    body { font-family: Helvetica, Arial, sans-serif; font-size: 9pt; color: #1E293B; }
    .page { display: flex; flex-direction: row; }
    .sep { flex-shrink: 0; width: 0; border-left: 1px dashed #CBD5E1; margin: 0 10mm; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print" style="padding:10px;text-align:center;">
    <button onclick="window.print()" style="padding:8px 20px;font-size:14px;background:#8B5CF6;color:#fff;border:none;border-radius:8px;cursor:pointer;">
      Imprimir
    </button>
  </div>
  <div class="page">
    ${col1}
    <div class="sep"></div>
    ${col2}
  </div>
  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;
}

export function printRutinas(rutina1: RutinaForPDF, rutina2: RutinaForPDF | null, profesional: string): void {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(buildPrintHTML(rutina1, rutina2 ?? rutina1, profesional));
  win.document.close();
}
