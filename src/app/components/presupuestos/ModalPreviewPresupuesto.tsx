"use client";

import { useState, useEffect } from "react";
import { X, Printer, Download } from "lucide-react";
import { toast } from "react-toastify";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { MessageCircle } from "lucide-react";
import PresupuestoDocument from "./PresupuestoDocument";
import ModalAsistenteWhatsApp from "../ModalAsistenteWhatsApp";

interface ModalPreviewPresupuestoProps {
  paciente: { nombre: string, cedula: string, telefono?: string };
  pruebas: any[];
  serviciosExtras?: any[];
  tasaBCV: number;
  descuento: number;
  subtotal: number;
  total: number;
  onClose: () => void;
}

export default function ModalPreviewPresupuesto({ 
  paciente, 
  pruebas, 
  serviciosExtras = [],
  tasaBCV, 
  descuento, 
  subtotal, 
  total, 
  onClose 
}: ModalPreviewPresupuestoProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [telefonoManual, setTelefonoManual] = useState<string>("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDownload = async () => {
    try {
      const blob = await pdf(
        <PresupuestoDocument 
          paciente={paciente} 
          pruebas={pruebas} 
          serviciosExtras={serviciosExtras}
          tasaBCV={tasaBCV} 
          descuento={descuento} 
          subtotal={subtotal} 
          total={total} 
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Presupuesto_${paciente.nombre ? paciente.nombre.replace(/\s+/g, "_") : "LEYMA"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al descargar el presupuesto");
    }
  };

  const handlePrint = async () => {
    const toastId = toast.loading("Preparando impresión...");
    try {
      const blob = await pdf(
        <PresupuestoDocument 
          paciente={paciente} 
          pruebas={pruebas} 
          serviciosExtras={serviciosExtras}
          tasaBCV={tasaBCV} 
          descuento={descuento} 
          subtotal={subtotal} 
          total={total} 
        />
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
    let numeroStr = paciente.telefono || "";
    
    // Si no ingresó número en el formulario, se lo pedimos por un prompt
    if (!numeroStr || numeroStr.trim() === "") {
      const inputTelefono = window.prompt("Ingrese el número de teléfono del paciente (Ej. 04121234567):");
      if (!inputTelefono) {
        toast.warning("Envío cancelado: Se requiere un número de teléfono.");
        return;
      }
      numeroStr = inputTelefono;
    }
    
    setTelefonoManual(numeroStr);
    setShowWhatsAppModal(true);
  };

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center p-4 sm:p-8 bg-[#1D1D1F]/95">
      <div className="w-full max-w-[850px] flex justify-between items-center bg-[#2D2D2F] p-4 rounded-2xl mb-6 shrink-0 shadow-lg border border-white/10">
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white text-[#1D1D1F] hover:bg-slate-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <Printer size={18} /> Imprimir Presupuesto
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-[#0071E3] text-white hover:bg-[#0077ED] px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <Download size={18} /> Descargar
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

      <div className="w-full max-w-[850px] flex-1 bg-white rounded-xl overflow-hidden shadow-2xl">
        <PDFViewer width="100%" height="100%" showToolbar={true}>
          <PresupuestoDocument 
            paciente={paciente} 
            pruebas={pruebas} 
            serviciosExtras={serviciosExtras}
            tasaBCV={tasaBCV} 
            descuento={descuento} 
            subtotal={subtotal} 
            total={total} 
          />
        </PDFViewer>
      </div>

      {/* MODAL ASISTENTE WHATSAPP */}
      {showWhatsAppModal && (() => {
        // Generar enlace antes de pasarlo al modal
        const data = {
          p: { n: paciente.nombre, c: paciente.cedula, t: paciente.telefono },
          e: pruebas.map(pr => [pr.nombre, pr.precioUSD, pr.cantidad || 1]),
          se: serviciosExtras.map(s => [s.nombre, s.precioUSD, s.cantidad || 1]),
          b: tasaBCV,
          d: descuento,
          s: subtotal,
          t: total
        };
        const jsonStr = JSON.stringify(data);
        const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
        const url = `${window.location.origin}/cotizacion?d=${base64}`;

        return (
          <ModalAsistenteWhatsApp 
            isOpen={showWhatsAppModal}
            onClose={() => setShowWhatsAppModal(false)}
            pacienteNombre={paciente.nombre || 'estimado paciente'}
            telefono={telefonoManual || paciente.telefono || ""}
            tipoMensaje="presupuesto"
            datosAdicionales={{ link: url }}
          />
        );
      })()}
    </div>
  );
}
