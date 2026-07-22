"use client";

import { Truck, Building2, Syringe, CheckCircle2 } from "lucide-react";

interface ServicioExtra {
  id: number;
  nombre: string;
  precioUSD: number;
  activo: boolean;
  cantidad?: number;
}

interface ServiciosExtrasProps {
  catalogo: ServicioExtra[];
  seleccionados: ServicioExtra[];
  onCambio: (seleccionados: ServicioExtra[]) => void;
  tasaBCV: number;
}

// Elige un icono basado en palabras clave del nombre
const getIconoServicio = (nombre: string) => {
  const n = nombre.toLowerCase();
  if (n.includes("domicilio")) return Truck;
  if (n.includes("hospitalaria") || n.includes("hospital")) return Building2;
  return Syringe;
};

export default function ServiciosExtras({
  catalogo,
  seleccionados,
  onCambio,
  tasaBCV,
}: ServiciosExtrasProps) {
  const toggleServicio = (servicio: ServicioExtra) => {
    const yaEsta = seleccionados.some((s) => s.id === servicio.id);
    if (yaEsta) {
      onCambio(seleccionados.filter((s) => s.id !== servicio.id));
    } else {
      onCambio([...seleccionados, { ...servicio, cantidad: 1 }]);
    }
  };

  const updateCantidad = (servicio: ServicioExtra, cantidad: number) => {
    if (cantidad <= 0) {
      onCambio(seleccionados.filter((s) => s.id !== servicio.id));
      return;
    }
    onCambio(seleccionados.map(s => s.id === servicio.id ? { ...s, cantidad } : s));
  };

  const totalServicios = seleccionados.reduce((acc, s) => acc + (s.precioUSD * (s.cantidad || 1)), 0);

  if (catalogo.length === 0) return null;

  return (
    <section className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-8 mb-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold shrink-0">
          2
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1D1D1F]">Servicios de Extracción</h2>
          <p className="text-[13px] text-slate-400 font-medium mt-0.5">
            Seleccione si aplica. Estos servicios suman al total de la orden pero no generan resultados médicos.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {catalogo.map((servicio) => {
          const sel = seleccionados.find((s) => s.id === servicio.id);
          const activo = !!sel;
          const cantidad = sel?.cantidad || 1;
          const Icono = getIconoServicio(servicio.nombre);

          return (
            <div
              key={servicio.id}
              onClick={() => toggleServicio(servicio)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleServicio(servicio);
                }
              }}
              className={`
                relative flex items-center justify-between gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer
                ${activo
                  ? "border-amber-400 bg-amber-50 shadow-[0_0_0_4px_rgba(245,158,11,0.08)]"
                  : "border-slate-200 bg-[#F5F5F7]/60 hover:border-slate-300 hover:bg-white"
                }
              `}
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Icono */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    activo ? "bg-amber-500 text-white" : "bg-slate-200/80 text-slate-500"
                  }`}
                >
                  <Icono size={22} strokeWidth={2} />
                </div>

                {/* Texto */}
                <div className="flex flex-col flex-1 min-w-0">
                  <p className={`text-[15px] font-bold leading-tight ${activo ? "text-amber-900" : "text-[#1D1D1F]"}`}>
                    {servicio.nombre}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-lg font-black ${activo ? "text-amber-600" : "text-slate-600"}`}>
                      ${servicio.precioUSD.toFixed(2)}
                    </span>
                    <span className={`text-xs font-bold whitespace-nowrap ${activo ? "text-amber-500" : "text-slate-400"}`}>
                      (Bs {(servicio.precioUSD * tasaBCV).toLocaleString("es-VE", { minimumFractionDigits: 2 })})
                    </span>
                  </div>
                </div>
              </div>

              {/* Controles de cantidad o Check */}
              {activo ? (
                <div 
                  className="flex items-center gap-3 bg-white rounded-xl border border-amber-200 p-1.5 shrink-0 shadow-sm" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <button type="button" onClick={() => updateCantidad(servicio, cantidad - 1)} className="w-8 h-8 flex items-center justify-center text-amber-600 hover:bg-amber-100 rounded-lg font-black text-lg transition-colors">-</button>
                  <span className="text-base font-black w-6 text-center text-amber-900">{cantidad}</span>
                  <button type="button" onClick={() => updateCantidad(servicio, cantidad + 1)} className="w-8 h-8 flex items-center justify-center text-amber-600 hover:bg-amber-100 rounded-lg font-black text-lg transition-colors">+</button>
                </div>
              ) : (
                <CheckCircle2
                  size={24}
                  strokeWidth={2.5}
                  className="text-slate-300 shrink-0 opacity-50 mr-2"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Subtotal de servicios si hay alguno seleccionado */}
      {seleccionados.length > 0 && (
        <div className="mt-4 flex items-center justify-end gap-3 animate-in fade-in duration-200">
          <span className="text-[12px] font-bold text-amber-600 uppercase tracking-widest">
            {seleccionados.length} servicio{seleccionados.length > 1 ? "s" : ""} seleccionado{seleccionados.length > 1 ? "s" : ""}
          </span>
          <div className="h-4 w-px bg-amber-200" />
          <span className="text-base font-black text-amber-700">
            +${totalServicios.toFixed(2)}
          </span>
        </div>
      )}
    </section>
  );
}
