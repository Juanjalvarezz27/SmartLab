"use client";

import { X, Download, Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { PDFViewer, PDFDownloadLink, pdf } from "@react-pdf/renderer";
import { toast } from "react-toastify";
import ConstanciaPDF from "./ConstanciaPDF";

export default function ModalConstancia({ orden, onClose }: { orden: any; onClose: () => void }) {
  const [isClient, setIsClient] = useState(false);
  
  // Estados para el modal de correo
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");

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

  const confirmarEnvioCorreo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes("@")) {
      toast.error("Correo electrónico inválido.");
      return;
    }

    setShowEmailModal(false);
    const toastId = toast.loading("Enviando correo...");
    try {
      // 1. Generar el Blob del PDF
      const blob = await pdf(<ConstanciaPDF orden={orden} />).toBlob();

      // 2. Convertir a Base64
      const buffer = await blob.arrayBuffer();
      const base64String = Buffer.from(buffer).toString("base64");

      // 3. Enviar al endpoint
      const mensaje = `Hola ${orden.paciente.nombreCompleto},\n\nAdjunto encontrarás la constancia solicitada en el Laboratorio LEYMA C.A.\n\n¡Cualquier consulta estamos a tu orden. Feliz día!`;

      const res = await fetch("/api/enviar-correo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          subject: `Constancia de Laboratorio LEYMA C.A. - Orden #${orden.id}`,
          message: mensaje,
          fileName: nombreArchivo,
          pdfBase64: base64String,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar el correo.");

      toast.update(toastId, { render: "Correo enviado exitosamente", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error: any) {
      toast.update(toastId, { render: error.message || "Error al enviar el correo", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

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
              onClick={() => {
                setEmailInput(orden.paciente.correo || "");
                setShowEmailModal(true);
              }}
              className="flex items-center gap-2 bg-amber-500 text-white hover:bg-amber-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 shadow-md shadow-amber-500/20"
            >
              <Mail size={16} strokeWidth={2.5} /> Enviar Correo
            </button>
            
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            
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

      {/* MODAL PARA CORREO */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-amber-500 text-white p-5 flex items-center gap-3">
              <Mail size={24} />
              <h3 className="font-bold text-lg">Enviar constancia por correo</h3>
            </div>
            
            <form onSubmit={confirmarEnvioCorreo} className="p-6">
              <p className="text-slate-600 text-sm font-medium mb-4">
                Ingresa la dirección de correo electrónico a la que deseas enviar la constancia.
              </p>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Correo del paciente
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="ejemplo@gmail.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  autoFocus
                  required
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20 transition-all hover:-translate-y-0.5"
                >
                  Enviar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}