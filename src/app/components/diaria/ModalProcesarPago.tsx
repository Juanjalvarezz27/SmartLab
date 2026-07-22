"use client";

import { useState, useEffect } from "react";
import { X, Wallet, AlertCircle, Plus, Trash2, ChevronDown, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface ModalProcesarPagoProps {
  orden: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalProcesarPago({ orden, onClose, onSuccess }: ModalProcesarPagoProps) {
  const [metodosBD, setMetodosBD] = useState<any[]>([]);
  const [pagos, setPagos] = useState([{ metodoId: "", monto: 0, moneda: "USD", referencia: "" }]);
  const [dropdownAbierto, setDropdownAbierto] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch("/api/metodos-pago").then(res => res.json()).then(setMetodosBD);
  }, []);

  const formatMetodoPago = (str: string) => {
    const map: Record<string, string> = {
      'EFECTIVO_USD': 'Efectivo $', 
      'EFECTIVO_BS': 'Efectivo Bs',
      'PAGO_MOVIL': 'Pago Móvil', 
      'TRANSFERENCIA_BS': 'Transferencia Bs',
      'PUNTO_VENTA': 'Punto de Venta',
      'ZELLE': 'Zelle'
    };
    return map[str] || str.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  const totalFacturadoUSD = orden.totalUSD;
  const pagosPreviosUSD = orden.pagos?.reduce((acc: number, p: any) => acc + p.montoUSD, 0) || 0;
  
  const pagosNuevosUSD = pagos.reduce((acc, pago) => {
    const montoUSD = pago.moneda === "USD" ? (pago.monto || 0) : ((pago.monto || 0) / orden.tasaBCV);
    return acc + montoUSD;
  }, 0);

  const totalPagadoUSD = pagosPreviosUSD + pagosNuevosUSD;
  const restanteUSD = Math.max(0, totalFacturadoUSD - totalPagadoUSD);
  const restanteBS = restanteUSD * orden.tasaBCV;
  const cambioUSD = totalPagadoUSD > totalFacturadoUSD ? (totalPagadoUSD - totalFacturadoUSD) : 0;

  const agregarPago = () => setPagos([...pagos, { metodoId: "", monto: 0, moneda: "USD", referencia: "" }]);
  const actualizarPago = (index: number, campo: string, valor: any) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index] = { ...nuevosPagos[index], [campo]: valor };
    setPagos(nuevosPagos);
  };

  const procesarPagoFinal = async () => {
    if (restanteUSD > 0.005) {
      toast.error(`Faltan $${restanteUSD.toFixed(2)} por cobrar.`);
      return;
    }
    const pagosValidos = pagos.filter(p => p.metodoId && p.monto > 0);
    if (pagosValidos.length === 0) {
      toast.error("Ingrese al menos un pago válido.");
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch(`/api/ordenes/${orden.id}/pagar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagos: pagosValidos, tasaBCV: orden.tasaBCV })
      });
      if (!res.ok) throw new Error();
      toast.success("¡Orden cerrada con éxito!");
      onSuccess(); 
    } catch (error: any) {
      toast.error(error?.message ? `Error al guardar el pago.: ${error?.message}` : "Error al guardar el pago.");
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {dropdownAbierto !== null && <div className="fixed inset-0 z-30" onClick={() => setDropdownAbierto(null)}></div>}
      <div className="absolute inset-0 bg-[#1D1D1F]/60" onClick={!guardando ? onClose : undefined}></div>

      {/* overflow-visible es vital para que el dropdown que sale hacia arriba se vea */}
      <div className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl flex flex-col overflow-visible animate-in zoom-in-95 duration-300">
        
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50 rounded-t-[32px]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
              <Wallet size={24} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1D1D1F] tracking-tight">Cerrar Orden #{orden.id.toString().padStart(5, '0')}</h2>
              <p className="text-sm font-medium text-slate-500 mt-0.5">{orden.paciente.nombreCompleto}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={guardando} className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-full transition-all">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Se agregó max-h-[80vh] y overflow-y-auto para el scroll interno */}
        <div className="p-8 overflow-y-auto max-h-[80vh] custom-scrollbar">
          
          <div className="flex items-center justify-between bg-[#F5F5F7] border border-slate-200/60 rounded-[24px] p-6 mb-8">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Orden</p>
              <p className="text-3xl font-black text-[#1D1D1F] leading-none">${totalFacturadoUSD.toFixed(2)}</p>
            </div>
            <div className="w-px h-12 bg-slate-200"></div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Deuda Restante</p>
              <p className="text-3xl font-black text-orange-500 leading-none">${Math.max(0, totalFacturadoUSD - pagosPreviosUSD).toFixed(2)}</p>
            </div>
          </div>

          {orden.pagos && orden.pagos.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">Pagos Previos Registrados</h3>
              <div className="space-y-3">
                {orden.pagos.map((pago: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-200/60 p-4 rounded-[20px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 text-slate-500">
                        <Wallet size={18} />
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-[#1D1D1F]">
                          {formatMetodoPago(pago.metodo?.nombre || "")}
                        </p>
                        {pago.referencia && (
                          <p className="text-[13px] font-medium text-slate-500">Ref: {pago.referencia}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[16px] font-black text-[#1D1D1F]">
                        ${pago.montoUSD.toFixed(2)}
                      </p>
                      {pago.montoBS > 0 && (
                        <p className="text-[13px] font-semibold text-slate-400">
                          Bs. {pago.montoBS.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Nuevos Pagos</label>
               
               <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-[13px] font-bold border border-blue-100 shadow-sm">
                 Total a pagar: ${Math.max(0, totalFacturadoUSD - pagosPreviosUSD).toFixed(2)} / Bs {(Math.max(0, totalFacturadoUSD - pagosPreviosUSD) * orden.tasaBCV).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
               </span>

               {restanteBS > 0.01 ? (
                 <span className="px-2.5 py-1 bg-orange-100 text-orange-600 rounded-md text-[13px] font-bold flex items-center gap-1.5 border border-orange-200 shadow-sm">
                   <AlertCircle size={14} strokeWidth={2.5} /> Restante: ${restanteUSD.toFixed(2)} / Bs {restanteBS.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                 </span>
               ) : (
                 <span className="px-2.5 py-1 bg-green-100 text-green-600 rounded-md text-[13px] font-bold flex items-center gap-1.5 border border-green-200 shadow-sm">
                   <CheckCircle size={14} strokeWidth={2.5} /> Total Cubierto
                 </span>
               )}
            </div>
            <button onClick={agregarPago} className="text-[13px] font-bold text-[#0071E3] flex items-center gap-1.5 hover:underline px-4 py-2 rounded-xl transition-all hover:bg-blue-50">
              <Plus size={16} /> Agregar Línea
            </button>
          </div>
          
          <div className="space-y-4 mb-8 overflow-visible">
            {pagos.map((pago, idx) => (
              <div key={idx} className="flex gap-4 bg-white p-3 rounded-[20px] border border-slate-200 shadow-sm items-center overflow-visible">
                
                <div className="relative flex-1 min-w-[200px] overflow-visible">
                  <button type="button" onClick={() => setDropdownAbierto(dropdownAbierto === idx ? null : idx)} className="w-full flex justify-between items-center px-4 py-3 bg-[#F5F5F7] border border-slate-200 rounded-xl text-[15px] font-semibold text-[#1D1D1F] outline-none">
                    <span className={pago.metodoId ? "text-[#1D1D1F]" : "text-slate-400"}>
                      {pago.metodoId ? formatMetodoPago(metodosBD.find(m => m.id === pago.metodoId)?.nombre || "") : "Método..."}
                    </span>
                    <ChevronDown size={18} className="text-slate-400" />
                  </button>

                  {/* Cambiado a top-full mt-2 (hacia abajo) para evitar cortes con el scroll interno del contenedor superior */}
                  {dropdownAbierto === idx && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] overflow-hidden z-[110] py-1 animate-in slide-in-from-top-2 duration-200">
                      {metodosBD.map((m) => (
                        <button 
                          key={m.id} 
                          type="button" 
                          onClick={() => {
                            const esBs = ["PAGO_MOVIL", "PUNTO_VENTA", "EFECTIVO_BS"].includes(m.nombre);
                            const nuevaMoneda = esBs ? "BS" : "USD";
                            
                            const nuevosPagos = [...pagos];
                            const monedaCambiada = nuevosPagos[idx].moneda !== nuevaMoneda;
                            nuevosPagos[idx] = { 
                              ...nuevosPagos[idx], 
                              metodoId: m.id, 
                              moneda: nuevaMoneda,
                              monto: monedaCambiada ? 0 : nuevosPagos[idx].monto
                            };
                            setPagos(nuevosPagos);
                            setDropdownAbierto(null);
                          }} 
                          className={`w-full text-left px-4 py-3 text-[15px] font-semibold hover:bg-slate-100 transition-colors ${pago.metodoId === m.id ? 'bg-[#0071E3] text-white hover:bg-[#0071E3]' : 'text-[#1D1D1F]'}`}
                        >
                          {formatMetodoPago(m.nombre)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex bg-[#F5F5F7] border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0071E3]/20 w-40 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => {
                      const mName = metodosBD.find(m => m.id === pago.metodoId)?.nombre || "";
                      if (["PAGO_MOVIL", "PUNTO_VENTA", "EFECTIVO_BS"].includes(mName)) return; // Force BS
                      if (["EFECTIVO_USD", "ZELLE", "BINANCE"].includes(mName)) return; // Force USD
                      actualizarPago(idx, "moneda", pago.moneda === "USD" ? "BS" : "USD");
                    }} 
                    className={`px-3 font-bold text-[13px] transition-colors border-r border-slate-200 w-12 flex items-center justify-center shrink-0 ${pago.moneda === "USD" ? 'bg-[#0071E3]/10 text-[#0071E3]' : 'bg-orange-100 text-orange-600'}`}>
                    {pago.moneda === "USD" ? "$" : "Bs"}
                  </button>
                  <input type="number" min="0" step="any" placeholder="0.00" value={pago.monto || ""} onChange={(e) => actualizarPago(idx, "monto", Number(e.target.value))} className="w-full px-3 py-2 bg-transparent text-[15px] font-bold text-[#1D1D1F] outline-none" />
                </div>

                <input type="text" placeholder="Referencia" value={pago.referencia} onChange={(e) => actualizarPago(idx, "referencia", e.target.value)} className="flex-1 h-[48px] px-4 py-3 bg-[#F5F5F7] border border-slate-200 rounded-xl text-[15px] font-medium outline-none focus:ring-2 focus:ring-[#0071E3]/20" />
                
                {idx > 0 && (
                  <button onClick={() => setPagos(pagos.filter((_, i) => i !== idx))} className="h-[48px] w-12 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={procesarPagoFinal}
            disabled={guardando || restanteUSD > 0.005}
            className="w-full py-4 bg-[#0071E3] hover:bg-[#0077ED] disabled:bg-slate-300 text-white font-black rounded-xl shadow-[0_4px_20px_rgba(0,113,227,0.3)] transition-all flex items-center justify-center gap-2 text-lg"
          >
            {guardando ? <><Loader2 size={22} className="animate-spin" /> Procesando...</> : <><CheckCircle size={22} /> Certificar Pago y Cerrar Orden</>}
          </button>

        </div>
      </div>
    </div>
  );
}