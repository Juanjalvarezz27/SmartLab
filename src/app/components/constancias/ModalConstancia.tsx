"use client";

import { X, Download, Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { PDFViewer, PDFDownloadLink, pdf } from "@react-pdf/renderer";
import ConstanciaPDF from "./ConstanciaPDF";

export default function ModalConstancia({ orden, onClose }: { orden: any; onClose: () => void }) {
  const [isClient, setIsClient] = useState(false);

  // Evitar errores de SSR en Next.js forzando la carga en el cliente
  useEffect(() => {
    setIsClient(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  if (!orden) return null;

  const nombreArchivo = `Constancia_${orden.paciente.nombreCompleto.replace(/\s+/g, "_")}_Orden_${orden.id}.pdf`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1D1D1F]/60 p-4 sm:p-6">
      <div className="bg-[#F5F5F7] w-full max-w-4xl h-[90vh] flex flex-col rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* HEADER DE CONTROLES */}
        <div className="bg-white p-5 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-black text-xl text-[#1D1D1F]">Documento de Constancia</h3>
            <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">Orden N° {orden.id.toString().padStart(5, '0')}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {isClient && (
              <PDFDownloadLink document={<ConstanciaPDF orden={orden} />} fileName={nombreArchivo}>
                {({ loading }) => (
                  <button
                    disabled={loading}
                    className="flex items-center gap-2 bg-[#0071E3] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0077ED] transition-all hover:-translate-y-0.5 shadow-md shadow-[#0071E3]/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Preparando...
                      </>
                    ) : (
                      <>
                        <Download size={16} strokeWidth={2.5} /> Descargar PDF
                      </>
                    )}
                  </button>
                )}
              </PDFDownloadLink>
            )}

            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* VISOR INCORPORADO EN EL MODAL */}
        <div className="flex-1 bg-slate-500/10 p-4">
          {isClient ? (
            <PDFViewer width="100%" height="100%" className="rounded-2xl border border-slate-200/60 shadow-inner" showToolbar={true}>
              <ConstanciaPDF orden={orden} />
            </PDFViewer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-bold gap-2">
              <Loader2 className="animate-spin text-[#0071E3]" size={32} />
              Generando vista previa...
            </div>
          )}
        </div>

      </div>

    </div>
  );
}