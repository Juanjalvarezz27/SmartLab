"use client";

import { useState, useRef, useEffect } from "react";
import { X, Save, Loader2, Receipt, ChevronDown, Check } from "lucide-react";
import { toast } from "react-toastify";

interface ModalRegistrarGastoProps {
  metodosPago: any[];
  tasaBCV: number; // Recibimos la tasa desde la página principal
  onClose: () => void;
  onSuccess: () => void;
}

// Función para poner bonito el texto: PAGO_MOVIL -> Pago Movil
const formatearMetodo = (str: string) => {
  if (!str) return "";
  const parts = str.split('_');
  return parts.map(p => {
    if (p === 'USD' || p === 'BS') return p;
    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  }).join(' ');
};

export default function ModalRegistrarGasto({ metodosPago, tasaBCV, onClose, onSuccess }: ModalRegistrarGastoProps) {
  const [guardando, setGuardando] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    concepto: "",
    metodoId: "",
    montoUSD: "",
    montoBS: "",
    referencia: ""
  });

  // Cerrar el dropdown custom al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // AUTO-CALCULADORA BI-DIRECCIONAL
  const handleUSDChange = (val: string) => {
    const numericVal = parseFloat(val);
    if (!isNaN(numericVal)) {
      setFormData({ ...formData, montoUSD: val, montoBS: (numericVal * tasaBCV).toFixed(2) });
    } else {
      setFormData({ ...formData, montoUSD: val, montoBS: "" });
    }
  };

  const handleBSChange = (val: string) => {
    const numericVal = parseFloat(val);
    if (!isNaN(numericVal)) {
      setFormData({ ...formData, montoBS: val, montoUSD: (numericVal / tasaBCV).toFixed(2) });
    } else {
      setFormData({ ...formData, montoBS: val, montoUSD: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.concepto || !formData.metodoId || !formData.montoUSD || !formData.montoBS) {
      return toast.warning("Complete todos los campos obligatorios.");
    }

    setGuardando(true);
    try {
      const res = await fetch("/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Error al registrar el gasto");
      toast.success("Gasto registrado exitosamente.");
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message ? `Ocurrió un error al procesar el gasto.: ${error?.message}` : "Ocurrió un error al procesar el gasto.");
      setGuardando(false);
    }
  };

  const metodoSeleccionado = metodosPago.find(m => m.id.toString() === formData.metodoId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1D1D1F]/70  transition-opacity" onClick={!guardando ? onClose : undefined}></div>

      <div className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl flex flex-col overflow-visible animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50 rounded-t-[24px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <Receipt size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1D1D1F] leading-tight">Registrar Egreso</h2>
              <p className="text-xs font-bold text-slate-400">Tasa BCV del día: Bs. {tasaBCV}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={guardando} className="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-full transition-all">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Concepto del Gasto *</label>
            <input 
              type="text" 
              placeholder="Ej. Pago de proveedor, Mantenimiento..."
              value={formData.concepto}
              onChange={(e) => setFormData({...formData, concepto: e.target.value})}
              className="w-full px-4 py-3.5 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-sm font-bold text-[#1D1D1F] outline-none focus:bg-white focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/10 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Monto (USD) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input 
                  type="number" step="0.01" min="0"
                  value={formData.montoUSD}
                  onChange={(e) => handleUSDChange(e.target.value)}
                  className="w-full pl-8 pr-4 py-3.5 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-sm font-black text-[#1D1D1F] outline-none focus:bg-white focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/10 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Monto (BS) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Bs</span>
                <input 
                  type="number" step="0.01" min="0"
                  value={formData.montoBS}
                  onChange={(e) => handleBSChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-3.5 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-sm font-black text-[#1D1D1F] outline-none focus:bg-white focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* SELECT CUSTOM (ADIÓS HTML PURO) */}
          <div className="relative" ref={dropdownRef}>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Método de Salida *</label>
            <div 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`w-full px-4 py-3.5 bg-[#F5F5F7] border ${dropdownOpen ? 'border-[#0071E3] bg-white ring-4 ring-[#0071E3]/10' : 'border-slate-200/60'} rounded-xl text-sm font-bold flex items-center justify-between cursor-pointer transition-all`}
            >
              <span className={metodoSeleccionado ? "text-[#1D1D1F]" : "text-slate-400"}>
                {metodoSeleccionado ? formatearMetodo(metodoSeleccionado.nombre) : "-- Seleccionar Método --"}
              </span>
              <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-[#0071E3]' : ''}`} />
            </div>

            {/* Menu Desplegable Flotante */}
            {dropdownOpen && (
              <div className="absolute top-[105%] left-0 w-full bg-white border border-slate-200 shadow-xl rounded-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300">
                {metodosPago.map(m => (
                  <div 
                    key={m.id} 
                    onClick={() => {
                      setFormData({...formData, metodoId: m.id.toString()});
                      setDropdownOpen(false);
                    }}
                    className="px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className={`text-sm font-bold ${formData.metodoId === m.id.toString() ? 'text-[#0071E3]' : 'text-slate-600'}`}>
                      {formatearMetodo(m.nombre)}
                    </span>
                    {formData.metodoId === m.id.toString() && <Check size={16} className="text-[#0071E3]" strokeWidth={3} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">N° Referencia (Opcional)</label>
            <input 
              type="text" 
              placeholder="Ej. 000456123"
              value={formData.referencia}
              onChange={(e) => setFormData({...formData, referencia: e.target.value})}
              className="w-full px-4 py-3.5 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-sm font-bold text-[#1D1D1F] outline-none focus:bg-white focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/10 transition-all"
            />
          </div>

          <div className="flex gap-3 w-full border-t border-slate-100 pt-5 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={guardando} className="flex-[2] py-3.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm flex justify-center items-center gap-2">
              {guardando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Registrar Egreso
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}