"use client";

import { useState } from "react";

interface DescargarPDFButtonProps {
  ordenId: number;
  nombrePaciente: string;
}

export default function DescargarPDFButton({ ordenId, nombrePaciente }: DescargarPDFButtonProps) {
  const [mensaje, setMensaje] = useState<{ texto: string; ok: boolean } | null>(null);

  const pdfUrl = `/api/resultados/pdf/${ordenId}`;
  const linkValidacion = typeof window !== "undefined"
    ? `${window.location.origin}/validar/${ordenId}`
    : `/validar/${ordenId}`;

  // -----------------------------------------------------------------
  // VER PDF
  // Sin ningún await antes de window.open — si hay await, Android y
  // algunos navegadores bloquean la apertura como "popup no autorizado"
  // y la pantalla queda cargando indefinidamente.
  // -----------------------------------------------------------------
  const verPDF = () => {
    setMensaje(null);

    // Navegar en la misma pestaña — NUNCA es bloqueado por ningún navegador.
    // (window.open a nueva pestaña puede ser bloqueado por iOS Safari, WebView, etc.)
    // El botón "atrás" del browser regresa a esta página.
    window.location.href = pdfUrl;
  };

  // -----------------------------------------------------------------
  // COMPARTIR
  // navigator.share() debe llamarse SIN await previo en Android.
  // No intentamos compartir el archivo PDF (requiere fetch async),
  // compartimos el link de validación que el receptor puede abrir.
  // -----------------------------------------------------------------
  const compartir = () => {
    setMensaje(null);
    const link = typeof window !== "undefined"
      ? `${window.location.origin}/validar/${ordenId}`
      : linkValidacion;

    // Caso 1: Web Share API disponible (iOS Safari, Android Chrome, etc.)
    if (typeof navigator !== "undefined" && navigator.share) {
      // IMPORTANTE: llamada síncrona. No hay await antes de esto.
      navigator
        .share({
          title: `Resultados — ${nombrePaciente}`,
          text: `Laboratorio LEYMA C.A. — Resultados de ${nombrePaciente} listos para ver.`,
          url: link,
        })
        .catch((err: any) => {
          // "AbortError" = el usuario cerró el menú sin compartir — no es un error real
          if (err?.name !== "AbortError") {
            copiarAlPortapapeles(link);
          }
        });
      return;
    }

    // Caso 2: Sin Web Share API (desktop Chrome/Firefox)
    copiarAlPortapapeles(link);
  };

  const copiarAlPortapapeles = (texto: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(texto)
        .then(() => setMensaje({ texto: "✅ Enlace copiado al portapapeles", ok: true }))
        .catch(() => setMensaje({ texto: `Copia este enlace: ${texto}`, ok: false }));
    } else {
      // Fallback final para browsers muy antiguos
      setMensaje({ texto: `Copia este enlace: ${texto}`, ok: false });
    }
  };

  // ---------- ÍCONOS ----------
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

      {/* BOTÓN PRINCIPAL: Ver PDF */}
      <button
        onClick={verPDF}
        className="w-full flex items-center justify-center gap-3 px-6 py-4
          text-[14px] sm:text-[15px] font-black uppercase tracking-wider
          rounded-2xl transition-all duration-300 bg-primario text-white
          hover:bg-[#005bb5] hover:shadow-apple-hover hover:-translate-y-0.5
          active:translate-y-0 active:shadow-apple"
      >
        <IconDoc />
        <span>Ver Resultados en PDF</span>
      </button>

      {/* BOTÓN SECUNDARIO: Compartir */}
      <button
        onClick={compartir}
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5
          text-[13px] sm:text-[14px] font-black uppercase tracking-wider
          rounded-2xl transition-all duration-300
          bg-superficie border-2 border-borde text-texto-principal
          hover:border-primario hover:text-primario hover:-translate-y-0.5
          active:translate-y-0"
      >
        <IconShare />
        <span>Compartir</span>
      </button>

      {/* MENSAJE DE FEEDBACK */}
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
