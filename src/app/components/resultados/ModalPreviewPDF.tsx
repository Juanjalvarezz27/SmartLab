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
  const [formatoImpresion, setFormatoImpresion] = useState<"LETTER" | "A5">("LETTER");
  
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
    window.open(`/api/resultados/pdf/${orden.id}?formato=${formatoImpresion}`, "_blank");
  };

  // Impresión: usa blob local solo para el iframe (solo desktop)
  const handlePrint = async () => {
    const toastId = toast.loading("Preparando impresión...");
    try {
      const blob = await pdf(
        <ReporteDocument orden={orden} fechaImpresa={fechaImpresa} qrCodeUrl={qrCodeUrl} formato={formatoImpresion} />
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

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center p-4 sm:p-8 bg-[#1D1D1F]/95">
      {/* BARRA DE HERRAMIENTAS */}
      <div className="w-full max-w-[850px] flex justify-between items-center bg-[#2D2D2F] p-4 rounded-2xl mb-6 shrink-0 shadow-lg border border-white/10">
        <div className="flex gap-3 items-center">
          {/* SELECTOR DE FORMATO */}
          <div className="flex bg-[#1D1D1F] p-1 rounded-xl border border-white/10 mr-2">
            <button
              onClick={() => setFormatoImpresion("LETTER")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                formatoImpresion === "LETTER" ? "bg-white text-black" : "text-slate-400 hover:text-white"
              }`}
            >
              CARTA
            </button>
            <button
              onClick={() => setFormatoImpresion("A5")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                formatoImpresion === "A5" ? "bg-white text-black" : "text-slate-400 hover:text-white"
              }`}
            >
              A5
            </button>
          </div>
          
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
          <ReporteDocument orden={orden} fechaImpresa={fechaImpresa} qrCodeUrl={qrCodeUrl} formato={formatoImpresion} />
        </PDFViewer>
      </div>


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