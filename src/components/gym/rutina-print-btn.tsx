'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { RutinaPDFDocument, type RutinaForPDF } from './rutina-pdf';
import { Printer } from 'lucide-react';

function semanaCiclo(fechaInicio: string): number {
  const inicio = new Date(fechaInicio + 'T00:00:00');
  const dias = Math.floor((Date.now() - inicio.getTime()) / 86400000);
  return Math.min(Math.max(Math.floor(dias / 7) + 1, 1), 4);
}

export default function RutinaPrintBtn({
  rutina,
  profesional,
}: {
  rutina: RutinaForPDF;
  profesional: string;
}) {
  const semana = semanaCiclo(rutina.fecha_inicio);
  const fecha = new Date().toISOString().slice(0, 10);
  const slug = rutina.paciente.nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const fileName = `rutina-${slug}-semana${semana}-${fecha}.pdf`;

  return (
    <PDFDownloadLink
      document={<RutinaPDFDocument rutina={rutina} profesional={profesional} />}
      fileName={fileName}
      style={{ textDecoration: 'none' }}
    >
      {({ loading }: { loading: boolean }) => (
        <span
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border border-violet-200 text-violet-600 hover:bg-violet-50 transition-colors inline-flex items-center gap-1 ${
            loading ? 'opacity-60 cursor-wait' : 'cursor-pointer'
          }`}
        >
          <Printer size={12} />
          {loading ? 'Generando...' : 'Imprimir'}
        </span>
      )}
    </PDFDownloadLink>
  );
}
