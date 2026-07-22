"use client";

import { useState, useEffect } from "react";
import { fetchJSON } from "@/lib/fetchWithRetry";
import { X, Printer, MessageCircle, Mail } from "lucide-react";
import { toast } from "react-toastify";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import QRCodeNode from "qrcode";
import ReporteDocument from "./ReporteDocument";
import ModalAsistenteWhatsApp from "../ModalAsistenteWhatsApp";

interface ModalPreviewPDFProps {
  orden: any;
  onClose: () => void;
}

export default function ModalPreviewPDF({ orden, onClose }: ModalPreviewPDFProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [fechaImpresa, setFechaImpresa] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  
  // Estados para el modal de correo
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  // Estados para el asistente de WhatsApp
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const ahora = new Date();
    setFechaImpresa(
      ahora.toLocaleDateString("es-VE", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/Caracas" }) +
      "  |  " +
      ahora.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "America/Caracas" })
    );

    const generarQR = async () => {
      try {
        const urlValidacion = `${window.location.origin}/validar/${orden.id}`;
        const base64Data = await QRCodeNode.toDataURL(urlValidacion, {
          margin: 1,
          width: 200,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        setQrCodeUrl(base64Data);
      } catch (err: any) {
        console.error("Error generando QR", err);
      }
    };

    if (orden?.id) generarQR();
  }, [orden]);

  // Abre el PDF del servidor en nueva pestaña — el navegador lo muestra nativamente
  const handleVerPDF = () => {
    window.open(`/api/resultados/pdf/${orden.id}`, "_blank");
  };

  // Impresión: usa blob local solo para el iframe (solo desktop)
  const handlePrint = async () => {
    const toastId = toast.loading("Preparando impresión...");
    try {
      const blob = await pdf(
        <ReporteDocument orden={orden} fechaImpresa={fechaImpresa} qrCodeUrl={qrCodeUrl} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        toast.dismiss(toastId);
        setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(iframe);
        }, 30_000);
      };
    } catch {
      toast.update(toastId, { render: "Error al preparar impresión", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const enviarWhatsApp = () => {
    if (!orden.paciente.telefono) {
      toast.warning("El paciente no tiene número de teléfono registrado.");
      return;
    }
    setShowWhatsAppModal(true);
  };

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
      const blob = await pdf(
        <ReporteDocument orden={orden} fechaImpresa={fechaImpresa} qrCodeUrl={qrCodeUrl} />
      ).toBlob();

      // 2. Convertir a Base64
      const buffer = await blob.arrayBuffer();
      const base64String = Buffer.from(buffer).toString("base64");

      // 3. Enviar al endpoint
      const link = `${window.location.origin}/validar/${orden.id}`;
      const mensaje = `Hola ${orden.paciente.nombreCompleto},\n\nAdjunto encontrarás tus resultados de laboratorio.\n\nTambién puedes verificarlos en línea en el siguiente enlace:\n${link}\n\n¡Cualquier consulta estamos a tu orden. Feliz día!`;
      
      const fileName = `Resultados_${orden.paciente.nombreCompleto.replace(/\s+/g, "_")}_#${orden.id}.pdf`;

      await fetchJSON("/api/enviar-correo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          subject: `Resultados de Laboratorio LEYMA C.A. - Orden #${orden.id}`,
          message: mensaje,
          fileName,
          pdfBase64: base64String,
        }),
      });

      toast.update(toastId, { render: "Correo enviado exitosamente", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error: any) {
      toast.update(toastId, { render: error.message || "Error al enviar el correo", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center p-4 sm:p-8 bg-[#1D1D1F]/95">
      {/* BARRA DE HERRAMIENTAS */}
      <div className="w-full max-w-[850px] flex justify-between items-center bg-[#2D2D2F] p-4 rounded-2xl mb-6 shrink-0 shadow-lg border border-white/10">
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white text-[#1D1D1F] hover:bg-slate-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            <Printer size={18} /> Imprimir
          </button>
          <button
            onClick={handleVerPDF}
            className="flex items-center gap-2 bg-[#0071E3] text-white hover:bg-[#0077ED] px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <X size={18} className="rotate-45" /> Abrir PDF
          </button>
          <button
            onClick={enviarWhatsApp}
            className="flex items-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <MessageCircle size={18} /> Enviar WS
          </button>
          <button
            onClick={() => {
              setEmailInput(orden.paciente.correo || "");
              setShowEmailModal(true);
            }}
            className="flex items-center gap-2 bg-amber-500 text-white hover:bg-amber-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <Mail size={18} /> Correo
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-slate-800 hover:bg-red-500 text-white rounded-full transition-colors shadow-md"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* VISOR PDF (solo funciona bien en desktop/Chrome) */}
      <div className="w-full max-w-[850px] flex-1 bg-white rounded-xl overflow-hidden shadow-2xl">
        <PDFViewer width="100%" height="100%" showToolbar={false}>
          <ReporteDocument orden={orden} fechaImpresa={fechaImpresa} qrCodeUrl={qrCodeUrl} />
        </PDFViewer>
      </div>

      {/* MODAL PARA CORREO */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-amber-500 text-white p-5 flex items-center gap-3">
              <Mail size={24} />
              <h3 className="font-bold text-lg">Enviar documento por correo</h3>
            </div>
            
            <form onSubmit={confirmarEnvioCorreo} className="p-6">
              <p className="text-slate-600 text-sm font-medium mb-4">
                Ingresa la dirección de correo electrónico a la que deseas enviar el PDF de resultados.
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

      {/* MODAL ASISTENTE WHATSAPP */}
      <ModalAsistenteWhatsApp 
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        pacienteNombre={orden.paciente.nombreCompleto}
        telefono={orden.paciente.telefono || ""}
        tipoMensaje="resultados"
        datosAdicionales={{ link: `${window.location.origin}/validar/${orden.id}` }}
      />
    </div>
  );
}