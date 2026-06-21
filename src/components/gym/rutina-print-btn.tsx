'use client';

import { pdf } from '@react-pdf/renderer';
import { RutinaPDFDocument, type RutinaForPDF } from './rutina-pdf';
import { Printer } from 'lucide-react';
import { useState } from 'react';

export default function RutinaPrintBtn({
  rutina,
  profesional,
}: {
  rutina: RutinaForPDF;
  profesional: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handlePrint() {
    setLoading(true);
    // Abrir ventana sincrónicamente para evitar bloqueadores de popups
    const win = window.open('', '_blank');
    try {
      const blob = await pdf(
        <RutinaPDFDocument rutina={rutina} profesional={profesional} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      if (win) {
        win.location.href = url;
      }
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch {
      win?.close();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className={`px-3 py-1.5 rounded-xl text-xs font-medium border border-violet-200 text-violet-600 hover:bg-violet-50 transition-colors inline-flex items-center gap-1 ${
        loading ? 'opacity-60 cursor-wait' : 'cursor-pointer'
      }`}
    >
      <Printer size={12} />
      {loading ? 'Generando...' : 'Imprimir'}
    </button>
  );
}
