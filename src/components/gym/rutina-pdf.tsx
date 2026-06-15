'use client';

import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

export type EjercicioForPDF = {
  id: string;
  ejercicio_id: string | null;
  nombre_libre: string | null;
  etapa: string;
  orden: number;
  series_s1: number | null; reps_s1: number | null;
  series_s2: number | null; reps_s2: number | null;
  series_s3: number | null; reps_s3: number | null;
  series_s4: number | null; reps_s4: number | null;
  notas: string | null;
  ejercicio: {
    id: string;
    nombre: string;
    grupo_muscular: string | null;
    nivel: string;
    imagen_url: string | null;
  } | null;
};

export type RutinaForPDF = {
  id: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado: string;
  paciente: { id: string; nombre: string };
  ejercicios: EjercicioForPDF[];
};

const ETAPAS = [
  { key: 'ENTRADA_CALOR',  label: 'ENTRADA EN CALOR',            color: '#D97706', bg: '#FFFBEB' },
  { key: 'PRIMERA_ETAPA',  label: 'ETAPA 1 — Fuerza inicial',    color: '#0EA5E9', bg: '#F0F9FF' },
  { key: 'SEGUNDA_ETAPA',  label: 'ETAPA 2 — Fuerza intermedio', color: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'TERCERA_ETAPA',  label: 'ETAPA 3 — Fuerza avanzado',   color: '#EC4899', bg: '#FFF1F8' },
  { key: 'TRABAJO_FINAL',  label: 'TRABAJO FINAL — Vuelta a la calma', color: '#10B981', bg: '#F0FDF4' },
] as const;

const SEMANA_COLS = [
  { header: '#0EA5E9', activeBg: '#DBEAFE', activeText: '#0EA5E9' },
  { header: '#8B5CF6', activeBg: '#EDE9FE', activeText: '#8B5CF6' },
  { header: '#EC4899', activeBg: '#FCE7F3', activeText: '#EC4899' },
  { header: '#10B981', activeBg: '#D1FAE5', activeText: '#059669' },
];

function semanaCiclo(fechaInicio: string): number {
  const inicio = new Date(fechaInicio + 'T00:00:00');
  const dias = Math.floor((Date.now() - inicio.getTime()) / 86400000);
  return Math.min(Math.max(Math.floor(dias / 7) + 1, 1), 4);
}

function formatFecha(f: string) {
  return f.split('-').reverse().join('/');
}

const S = StyleSheet.create({
  page: {
    padding: 28,
    paddingBottom: 42,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1E293B',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  patientName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#1E293B' },
  dateText: { fontSize: 8, color: '#64748B', marginTop: 2 },
  weekText: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#8B5CF6' },
  divider: { borderBottomWidth: 2, borderBottomColor: '#8B5CF6', marginBottom: 8 },
  etapaBlock: { marginBottom: 6 },
  etapaHdr: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 3, marginBottom: 3 },
  etapaHdrText: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  exRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2, borderRadius: 3, minHeight: 38 },
  imgCell: {
    width: 38, height: 38,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
    flexShrink: 0,
  },
  imgPlaceholderText: { fontSize: 6, color: '#94A3B8', textAlign: 'center' },
  nameCell: { flex: 1, justifyContent: 'center', paddingRight: 4, paddingVertical: 4 },
  exName: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#1E293B', marginBottom: 1 },
  exNote: { fontSize: 7.5, color: '#64748B' },
  weeksTable: { width: 185, flexShrink: 0, paddingVertical: 3 },
  weeksHeader: { flexDirection: 'row', marginBottom: 2 },
  weeksValues: { flexDirection: 'row' },
  wkHdrCell: { flex: 1, borderRadius: 2, marginHorizontal: 1, paddingVertical: 3, alignItems: 'center' },
  wkHdrText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  wkValCell: { flex: 1, borderRadius: 2, marginHorizontal: 1, paddingVertical: 3, alignItems: 'center' },
  wkValText: { fontSize: 7.5, color: '#475569' },
  wkValActiveText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 14, left: 28, right: 28, textAlign: 'center', fontSize: 8, color: '#94A3B8' },
});

export function RutinaPDFDocument({
  rutina,
  profesional,
}: {
  rutina: RutinaForPDF;
  profesional: string;
}) {
  const semana = semanaCiclo(rutina.fecha_inicio);
  const hoy = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <Document>
      <Page size="A5" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <View>
            <Text style={S.patientName}>{rutina.paciente.nombre}</Text>
            <Text style={S.dateText}>{hoy}</Text>
          </View>
          <Text style={S.weekText}>Semana {semana} de 4</Text>
        </View>

        {/* Divider */}
        <View style={S.divider} />

        {/* Stages */}
        {ETAPAS.map((etapa) => {
          const items = rutina.ejercicios
            .filter((e) => e.etapa === etapa.key)
            .sort((a, b) => a.orden - b.orden);
          if (!items.length) return null;

          return (
            <View key={etapa.key} style={S.etapaBlock}>
              <View style={[S.etapaHdr, { backgroundColor: etapa.color }]}>
                <Text style={S.etapaHdrText}>{etapa.label}</Text>
              </View>

              {items.map((ej) => {
                const nombre = ej.ejercicio?.nombre ?? ej.nombre_libre ?? 'Ejercicio';
                const imgUrl = ej.ejercicio?.imagen_url ?? null;
                const grupo = ej.ejercicio?.grupo_muscular ?? null;

                return (
                  <View key={ej.id} style={[S.exRow, { backgroundColor: etapa.bg }]}>
                    {/* Image */}
                    <View style={S.imgCell}>
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
                          style={{ width: 34, height: 34, borderRadius: 4 }}
                        />
                      ) : (
                        <Text style={S.imgPlaceholderText}>{grupo ?? 'EJ'}</Text>
                      )}
                    </View>

                    {/* Name + note */}
                    <View style={S.nameCell}>
                      <Text style={S.exName}>{nombre}</Text>
                      {ej.notas ? <Text style={S.exNote}>{ej.notas}</Text> : null}
                    </View>

                    {/* Weeks table */}
                    <View style={S.weeksTable}>
                      <View style={S.weeksHeader}>
                        {SEMANA_COLS.map((sc, i) => (
                          <View key={i} style={[S.wkHdrCell, { backgroundColor: sc.header }]}>
                            <Text style={S.wkHdrText}>
                              S{i + 1}{i + 1 === semana ? ' *' : ''}
                            </Text>
                          </View>
                        ))}
                      </View>
                      <View style={S.weeksValues}>
                        {([1, 2, 3, 4] as const).map((s) => {
                          const series = ej[`series_s${s}` as keyof EjercicioForPDF] as number | null;
                          const reps = ej[`reps_s${s}` as keyof EjercicioForPDF] as number | null;
                          const isActive = s === semana;
                          const sc = SEMANA_COLS[s - 1];
                          return (
                            <View
                              key={s}
                              style={[S.wkValCell, isActive ? { backgroundColor: sc.activeBg } : {}]}
                            >
                              <Text
                                style={
                                  isActive
                                    ? [S.wkValActiveText, { color: sc.activeText }]
                                    : S.wkValText
                                }
                              >
                                {series ?? '-'}x{reps ?? '-'}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* Footer */}
        <Text style={S.footer}>
          {profesional} — Rutina valida hasta {formatFecha(rutina.fecha_vencimiento)}
        </Text>
      </Page>
    </Document>
  );
}
