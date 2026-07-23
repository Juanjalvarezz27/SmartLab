"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PaymentBlocker() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Si la ruta incluye "resultados", no mostramos el bloqueo
  if (pathname?.includes("/resultados")) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        pointerEvents: 'auto'
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '32rem',
          width: '100%',
          padding: '2rem',
          textAlign: 'center',
          borderTop: '4px solid #ef4444'
        }}
      >
        <div style={{ margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '4rem', width: '4rem', borderRadius: '9999px', backgroundColor: '#fee2e2', marginBottom: '1.5rem' }}>
          <svg style={{ height: '2.5rem', width: '2.5rem', color: '#dc2626' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
          Sistema Inaccesible por falta de pago
        </h2>
        <div style={{ backgroundColor: '#fef2f2', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#991b1b', fontWeight: 500 }}>
            Hasta no realizar el pago de la mensualidad, el sistema no puede ser desbloqueado manualmente.
          </p>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
          Este sistema está conectado directamente con la cuenta bancaria del desarrollador por motivos de seguridad y validación automática.
        </p>
      </div>
    </div>
  );
}
