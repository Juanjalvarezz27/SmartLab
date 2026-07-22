"use client";

import { useState, useEffect } from "react";
import { X, Printer, Download } from "lucide-react";
import { toast } from "react-toastify";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import CierreDiarioPDF from "./CierreDiarioPDF";
import HistorialCierresPDF from "./HistorialCierresPDF";

interface ModalPreviewCierrePDFProps {
  tipo: "DIARIO" | "HISTORIAL" | "INDIVIDUAL";
  dataDiario?: any;
  tasaBCV?: number;
  historialData?: any[];
  onClose: () => void;
}

export default function ModalPreviewCierrePDF({ tipo, dataDiario, tasaBCV, historialData, onClose }: ModalPreviewCierrePDFProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getDocComponent = () => {
    if (tipo === "DIARIO" || tipo === "INDIVIDUAL") {
      return <CierreDiarioPDF data={dataDiario} tasaBCV={tasaBCV || 1} />;
    } else {
      return <HistorialCierresPDF historial={historialData || []} />;
    }
  };

  const getFilename = () => {
    if (tipo === "DIARIO" || tipo === "INDIVIDUAL") {
      return `Cierre_Caja_${dataDiario?.fechaTarget || 'Historico'}.pdf`;
    }
    return `Historial_Cierres_Caja.pdf`;
  };

  const handleDownload = async () => {
    const toastId = toast.loading("Preparando descarga...");
    try {
      const blob = await pdf(getDocComponent()).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getFilename();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Delay revoke to ensure it downloads
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.update(toastId, { render: "PDF descargado", type: "success", isLoading: false, autoClose: 3000 });
    } catch {
      toast.update(toastId, { render: "Error al descargar", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const handlePrint = async () => {
    const toastId = toast.loading("Preparando impresión...");
    try {
      const blob = await pdf(getDocComponent()).toBlob();
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
        }, 30000);
      };
    } catch {
      toast.update(toastId, { render: "Error al preparar impresión", type: "error", isLoading: false, autoClose: 3000 });
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
            onClick={handleDownload}
            className="flex items-center gap-2 bg-[#0071E3] text-white hover:bg-[#0077ED] px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <Download size={18} /> Descargar PDF
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-slate-800 hover:bg-red-500 text-white rounded-full transition-colors shadow-md"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* VISOR PDF */}
      <div className="w-full max-w-[850px] flex-1 bg-white rounded-xl overflow-hidden shadow-2xl">
        <PDFViewer width="100%" height="100%" showToolbar={false}>
          {getDocComponent()}
        </PDFViewer>
      </div>
    </div>
  );
}
