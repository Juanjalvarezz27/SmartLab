"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { pdf } from "@react-pdf/renderer";
import PresupuestoDocument from "../components/presupuestos/PresupuestoDocument";

interface DescargarCotizacionButtonProps {
  dataB64: string;
  nombrePaciente: string;
}

export default function DescargarCotizacionButton({ dataB64, nombrePaciente }: DescargarCotizacionButtonProps) {
  const [mensaje, setMensaje] = useState<{ texto: string; ok: boolean } | null>(null);

  const linkCotizacion = typeof window !== "undefined"
    ? `${window.location.origin}/cotizacion?d=${dataB64}`
    : `/cotizacion?d=${dataB64}`;

  const descargarPDF = async () => {
    setMensaje(null);
    const toastId = toast.loading("Generando PDF...");
    try {
      // Decode data
      const jsonStr = decodeURIComponent(escape(atob(dataB64)));
      const raw = JSON.parse(jsonStr);
      let datosCotizacion;
      
      if (raw.p && raw.e) {
        datosCotizacion = {
          paciente: { nombre: raw.p.n, cedula: raw.p.c, telefono: raw.p.t },
          pruebas: raw.e.map((x: any) => ({ nombre: x[0], precioUSD: x[1], cantidad: x[2] })),
          serviciosExtras: raw.se ? raw.se.map((x: any) => ({ nombre: x[0], precioUSD: x[1], cantidad: x[2] })) : [],
          tasaBCV: raw.b,
          descuento: raw.d,
          subtotal: raw.s,
          total: raw.t
        };
      } else {
        datosCotizacion = raw;
      }
      
      const { paciente, pruebas, serviciosExtras, tasaBCV, descuento, subtotal, total } = datosCotizacion;

      const blob = await pdf(
        <PresupuestoDocument 
          paciente={paciente} 
          pruebas={pruebas} 
          serviciosExtras={serviciosExtras || []}
          tasaBCV={tasaBCV} 
          descuento={descuento} 
          subtotal={subtotal} 
          total={total} 
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Presupuesto_${nombrePaciente ? nombrePaciente.replace(/\s+/g, "_") : "LEYMA"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.update(toastId, { render: "PDF descargado con éxito", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error: any) {
      console.error(error);
      toast.update(toastId, { render: "Error al generar el PDF", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const compartir = () => {
    setMensaje(null);
    const link = linkCotizacion;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: `Presupuesto — ${nombrePaciente || 'LEYMA'}`,
          text: `Laboratorio LEYMA C.A. — Cotización de exámenes para ${nombrePaciente || 'paciente'}.`,
          url: link,
        })
        .catch((err: any) => {
          if (err?.name !== "AbortError") {
            copiarAlPortapapeles(link);
          }
        });
      return;
    }

    copiarAlPortapapeles(link);
  };

  const copiarAlPortapapeles = (texto: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(texto)
        .then(() => setMensaje({ texto: "✅ Enlace copiado al portapapeles", ok: true }))
        .catch(() => setMensaje({ texto: `Copia este enlace: ${texto}`, ok: false }));
    } else {
      setMensaje({ texto: `Copia este enlace: ${texto}`, ok: false });
    }
  };

  const IconDoc = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      strokeLinejoin="round" className="shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );

  const IconShare = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      strokeLinejoin="round" className="shrink-0">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );

  return (
    <div className="flex flex-col items-center gap-3 mt-4">
      <button
        onClick={descargarPDF}
        className="w-full flex items-center justify-center gap-3 px-6 py-4
          text-[14px] sm:text-[15px] font-black uppercase tracking-wider
          rounded-2xl transition-all duration-300 bg-emerald-600 text-white
          hover:bg-emerald-700 hover:shadow-apple-hover hover:-translate-y-0.5
          active:translate-y-0 active:shadow-apple"
      >
        <IconDoc />
        <span>Descargar Presupuesto PDF</span>
      </button>

      <button
        onClick={compartir}
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5
          text-[13px] sm:text-[14px] font-black uppercase tracking-wider
          rounded-2xl transition-all duration-300
          bg-superficie border-2 border-borde text-texto-principal
          hover:border-emerald-600 hover:text-emerald-600 hover:-translate-y-0.5
          active:translate-y-0"
      >
        <IconShare />
        <span>Compartir Enlace</span>
      </button>

      {mensaje && (
        <div className={`w-full rounded-xl p-3 text-center border ${
          mensaje.ok
            ? "bg-green-50 border-green-200/60"
            : "bg-slate-50 border-slate-200/60"
        }`}>
          <p className={`text-sm font-medium break-all ${
            mensaje.ok ? "text-green-700" : "text-slate-600"
          }`}>
            {mensaje.texto}
          </p>
        </div>
      )}
    </div>
  );
}
