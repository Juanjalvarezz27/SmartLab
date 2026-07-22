"use client";

import { useState, useEffect } from "react";
import { DollarSign, Percent, Plus, Trash2, CheckCircle, ChevronDown, Save, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

interface ResumenPagoProps {
  pruebasSeleccionadas: any[];
  setPruebasSeleccionadas: (pruebas: any[]) => void;
  serviciosSeleccionados?: any[];
  tasaBCV: number;
  onFinalizar: (datos: any) => void;
  guardandoOrden?: boolean;
}

export default function ResumenPago({
  pruebasSeleccionadas,
  setPruebasSeleccionadas,
  serviciosSeleccionados = [],
  tasaBCV,
  onFinalizar,
  guardandoOrden = false
}: ResumenPagoProps) {
  const [metodosBD, setMetodosBD] = useState<any[]>([]);
  const [descuentoGeneral, setDescuentoGeneral] = useState(0);
  const [tipoDescGral, setTipoDescGral] = useState<"PORCENTAJE" | "MONTO">("PORCENTAJE");

  const [pagos, setPagos] = useState([{ metodoId: "", monto: 0, moneda: "USD", referencia: "" }]);
  const [dropdownAbierto, setDropdownAbierto] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/metodos-pago").then(res => res.json()).then(setMetodosBD);
  }, []);

  const formatMetodoPago = (str: string) => {
    const map: Record<string, string> = {
      'EFECTIVO_USD': 'Efectivo $',
      'EFECTIVO_BS': 'Efectivo Bs',
      'PAGO_MOVIL': 'Pago Móvil',
      'PUNTO': 'Punto de Venta',
      'ZELLE': 'Zelle'
    };
    return map[str] || str.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  const aplicarDescuentoIndividual = (id: string, valorStr: string, tipo: "PORCENTAJE" | "MONTO") => {
    let valor = parseFloat(valorStr) || 0;

    setPruebasSeleccionadas(pruebasSeleccionadas.map(p => {
      if (p.id === id) {
        if (tipo === "MONTO" && valor > p.precioUSD) {
          valor = p.precioUSD;
          toast.warn(`El descuento no puede superar el precio base ($${p.precioUSD})`, { toastId: `desc-${id}` });
        }
        if (tipo === "PORCENTAJE" && valor > 100) valor = 100;

        const desc = tipo === "PORCENTAJE" ? (p.precioUSD * (valor / 100)) : valor;
        return { ...p, descInd: valor, tipoDescInd: tipo, precioFinal: p.precioUSD - desc };
      }
      return p;
    }));
  };

  const subtotalPruebas = Number(pruebasSeleccionadas.reduce((acc, p) => acc + ((p.precioFinal ?? p.precioUSD) * p.cantidad), 0).toFixed(2));
  const subtotalServicios = Number(serviciosSeleccionados.reduce((acc, s) => acc + (s.precioUSD * (s.cantidad || 1)), 0).toFixed(2));
  const subtotalUSD = Number((subtotalPruebas + subtotalServicios).toFixed(2));

  const handleDescuentoGeneral = (valorStr: string) => {
    let valor = parseFloat(valorStr) || 0;
    if (tipoDescGral === "MONTO" && valor > subtotalUSD) valor = subtotalUSD;
    if (tipoDescGral === "PORCENTAJE" && valor > 100) valor = 100;
    setDescuentoGeneral(valor);
  };

  const montoDescGral = tipoDescGral === "PORCENTAJE" ? Number((subtotalUSD * (descuentoGeneral / 100)).toFixed(2)) : descuentoGeneral;
  const totalFinalUSD = Number((Math.max(0, subtotalUSD - montoDescGral)).toFixed(2));
  const totalFinalBS = Number((totalFinalUSD * tasaBCV).toFixed(2));

  const agregarPago = () => setPagos([...pagos, { metodoId: "", monto: 0, moneda: "USD", referencia: "" }]);

  const actualizarPago = (index: number, campo: string, valor: any) => {
    const nuevosPagos = [...pagos];

    if (campo === "monto") {
      let montoIngresado = Number(valor);
      const monedaActual = nuevosPagos[index].moneda;

      const otrosPagosUSD = nuevosPagos.reduce((acc, p, i) => {
        if (i === index) return acc;
        return acc + (p.moneda === "USD" ? (p.monto || 0) : (p.monto || 0) / tasaBCV);
      }, 0);

      const maxUSD = Math.max(0, totalFinalUSD - otrosPagosUSD);
      const maxPermitido = monedaActual === "USD" ? maxUSD : (maxUSD * tasaBCV);

      if (montoIngresado > maxPermitido) {
        montoIngresado = parseFloat(maxPermitido.toFixed(2));
        toast.warn("El pago no puede exceder el monto restante de la orden.", { toastId: "pago-excedido" });
      }

      nuevosPagos[index].monto = montoIngresado;
    }
    else if (campo === "moneda") {
      nuevosPagos[index].moneda = valor;
      nuevosPagos[index].monto = 0;
    }
    else {
      (nuevosPagos[index] as any)[campo] = valor;
    }

    setPagos(nuevosPagos);
  };

  const totalPagadoUSD = pagos.reduce((acc, pago) => {
    const montoUSD = pago.moneda === "USD" ? (pago.monto || 0) : ((pago.monto || 0) / tasaBCV);
    return acc + montoUSD;
  }, 0);

  const restanteUSD = Math.max(0, totalFinalUSD - totalPagadoUSD);
  const restanteBS = restanteUSD * tasaBCV;

  return (
    <section className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 lg:p-8 mb-10 animate-in fade-in duration-500 flex flex-col gap-6 lg:gap-8 relative">

      {dropdownAbierto !== null && (
        <div className="fixed inset-0 z-30" onClick={() => setDropdownAbierto(null)}></div>
      )}

      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-8 h-8 rounded-full bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] font-bold">3</div>
        <h2 className="text-xl font-bold text-[#1D1D1F]">Desglose y Pago Final</h2>
      </div>

      <div>
        <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Detalle de la Orden</label>
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
          {/* Servicios Extra (logísticos) */}
          {serviciosSeleccionados.map((s, idx) => {
            const cantidad = s.cantidad || 1;
            const subtotalS = s.precioUSD * cantidad;
            return (
              <div key={`srv-${s.id}`} className={`flex items-center justify-between p-5 gap-5 bg-amber-50/50 ${(idx < serviciosSeleccionados.length - 1 || pruebasSeleccionadas.length > 0) ? 'border-b border-amber-100' : ''}`}>
                <div className="flex flex-col flex-1">
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-500 mb-1">Servicio de Extracción</span>
                  <span className="font-bold text-base text-[#1D1D1F] leading-tight">{s.nombre}</span>
                  <span className="text-sm font-bold text-slate-500 mt-1">{cantidad} x ${s.precioUSD.toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-end min-w-[100px]">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-0.5">Subtotal</span>
                  <span className="text-xl font-black text-amber-600 leading-none">${subtotalS.toFixed(2)}</span>
                  <span className="text-[13px] font-bold text-slate-500 mt-1">Bs {(subtotalS * tasaBCV).toLocaleString('es-VE', {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            );
          })}

          {/* Pruebas médicas */}
          {pruebasSeleccionadas.map((p, idx) => {
            const subtotalIndUSD = (p.precioFinal ?? p.precioUSD) * p.cantidad;
            const subtotalIndBS = subtotalIndUSD * tasaBCV;

            return (
              <div key={p.id} className={`flex flex-col lg:flex-row lg:items-start justify-between p-5 gap-5 ${idx !== pruebasSeleccionadas.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="flex flex-col flex-1 w-full">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{p.categoriaNombre}</span>
                    <span className="text-[11px] text-slate-300">&gt;</span>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{p.subcategoriaNombre}</span>
                  </div>

                  <span className="font-bold text-base text-[#1D1D1F] leading-tight flex items-center gap-2">
                    {p.nombre}
                    {p.tipo === "PAQUETE" && (
                      <span className="text-[9px] font-black bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded uppercase tracking-wider">Paquete</span>
                    )}
                  </span>

                  <span className="text-sm font-bold text-slate-600 mt-2">
                    {p.cantidad} x ${p.precioUSD.toFixed(2)}
                    <span className="ml-1.5 opacity-70 font-black bg-slate-100 px-1.5 py-0.5 rounded-md">
                      (Bs {(p.precioUSD * tasaBCV).toLocaleString('es-VE', {minimumFractionDigits: 2})})
                    </span>
                  </span>

                  {p.tipo === "PAQUETE" && p.pruebasHijas && (
                    <details className="mt-2.5 bg-[#F5F5F7]/80 rounded-xl w-full lg:max-w-[90%] group">
                      <summary className="p-3.5 cursor-pointer text-[13px] font-bold text-[#1D1D1F] list-none flex items-center gap-2 select-none hover:text-[#0071E3] transition-colors">
                        <span className="flex-1">Incluye {p.pruebasHijas.length} pruebas</span>
                        <div className="w-5 h-5 rounded-full bg-slate-200/50 flex items-center justify-center group-open:rotate-180 transition-transform">
                          <ChevronDown size={14} strokeWidth={3} />
                        </div>
                      </summary>
                      <div className="px-3.5 pb-3.5 pt-0 border-t border-slate-200/50 mt-1">
                         <p className="text-[13px] text-slate-500 leading-relaxed font-medium pt-2">
                           {p.pruebasHijas.map((ph: any) => ph.nombre).join(', ')}
                         </p>
                      </div>
                    </details>
                  )}
                </div>

                <div className="flex items-center justify-end gap-5 w-full lg:w-auto mt-3 lg:mt-0 border-t lg:border-0 border-slate-100 pt-4 lg:pt-0">
                  <div className="flex items-center bg-[#F5F5F7] border border-slate-200 rounded-xl p-1 shadow-inner focus-within:ring-2 focus-within:ring-[#0071E3]/20 transition-all">
                    <span className="text-[11px] font-bold px-2 text-slate-500 uppercase tracking-widest">Desc.</span>
                    <input
                      type="number"
                      min="0"
                      className="w-14 text-sm font-black text-center bg-white border border-slate-200 rounded-md py-1 outline-none text-[#1D1D1F] shadow-sm"
                      placeholder="0"
                      value={p.descInd || ""}
                      onChange={(e) => aplicarDescuentoIndividual(p.id, e.target.value, p.tipoDescInd || "PORCENTAJE")}
                    />
                    <div className="flex bg-slate-200/50 p-0.5 rounded-md ml-1.5">
                      <button
                        type="button"
                        onClick={() => aplicarDescuentoIndividual(p.id, p.descInd?.toString() || "0", "PORCENTAJE")}
                        className={`px-2.5 py-1 text-[10px] font-black rounded transition-all ${p.tipoDescInd !== "MONTO" ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >%</button>
                      <button
                        type="button"
                        onClick={() => aplicarDescuentoIndividual(p.id, p.descInd?.toString() || "0", "MONTO")}
                        className={`px-2.5 py-1 text-[10px] font-black rounded transition-all ${p.tipoDescInd === "MONTO" ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >$</button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end min-w-[100px]">
                    <span className="text-[10px] font-bold text-[#0071E3] uppercase tracking-widest mb-0.5">Subtotal</span>
                    <span className="text-xl font-black text-[#0071E3] leading-none">
                      ${subtotalIndUSD.toFixed(2)}
                    </span>
                    <span className="text-[13px] font-bold text-slate-600 mt-1">
                      Bs {subtotalIndBS.toLocaleString('es-VE', {minimumFractionDigits: 2})}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#F5F5F7]/80 rounded-[24px] p-5 lg:p-6 border border-slate-200/60">
        <div className="flex justify-between items-center mb-5 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest block">Métodos de Pago</label>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-[13px] font-bold border border-blue-100 shadow-sm">
              Total: ${totalFinalUSD.toFixed(2)} / Bs {totalFinalBS.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
            {restanteBS > 0.01 ? (
              <span className="px-2.5 py-1 bg-orange-100 text-orange-600 rounded-md text-[13px] font-bold flex items-center gap-1.5 border border-orange-200">
                <AlertCircle size={14} strokeWidth={2.5} /> Falta: ${restanteUSD.toFixed(2)} / Bs {restanteBS.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-green-100 text-green-600 rounded-md text-[13px] font-bold flex items-center gap-1.5 border border-green-200 shadow-sm">
                <CheckCircle size={14} strokeWidth={2.5} /> Total Cubierto
              </span>
            )}
          </div>
          <button onClick={agregarPago} disabled={restanteBS <= 0.01} className="text-sm font-bold text-white disabled:text-slate-400 flex items-center gap-1.5 bg-[#0071E3] disabled:bg-slate-200 px-4 py-2 rounded-xl shadow-sm hover:bg-[#0077ED] disabled:hover:bg-slate-200 transition-all">
            <Plus size={16} strokeWidth={3} /> Agregar
          </button>
        </div>

        <div className="space-y-3">
          {pagos.map((pago, idx) => (
            <div key={idx} className="flex gap-3 animate-in fade-in bg-white p-3 rounded-2xl border border-slate-200 shadow-sm items-center relative z-40">

              <div className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setDropdownAbierto(dropdownAbierto === idx ? null : idx)}
                  className="w-full flex justify-between items-center px-4 py-2.5 bg-[#F5F5F7] hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-[#1D1D1F] outline-none transition-colors"
                >
                  <span className={pago.metodoId ? "text-[#1D1D1F]" : "text-slate-400"}>
                    {pago.metodoId ? formatMetodoPago(metodosBD.find(m => m.id === pago.metodoId)?.nombre || "") : "Seleccionar método..."}
                  </span>
                  <ChevronDown size={18} strokeWidth={2.5} className={`text-slate-400 transition-transform ${dropdownAbierto === idx ? 'rotate-180' : ''}`} />
                </button>

                {dropdownAbierto === idx && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] overflow-hidden z-50 py-1">
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
                        className={`w-full text-left px-4 py-3 text-[13px] font-bold hover:bg-slate-50 transition-colors ${pago.metodoId === m.id ? 'bg-[#0071E3]/10 text-[#0071E3]' : 'text-[#1D1D1F]'}`}
                      >
                        {formatMetodoPago(m.nombre)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex bg-[#F5F5F7] border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0071E3]/20 w-40 lg:w-48 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const mName = metodosBD.find(m => m.id === pago.metodoId)?.nombre || "";
                    if (["PAGO_MOVIL", "PUNTO_VENTA", "EFECTIVO_BS"].includes(mName)) return; // Force BS
                    if (["EFECTIVO_USD", "ZELLE", "BINANCE"].includes(mName)) return; // Force USD
                    actualizarPago(idx, "moneda", pago.moneda === "USD" ? "BS" : "USD");
                  }}
                  className={`px-3 font-black text-xs transition-colors border-r border-slate-200 w-12 flex items-center justify-center shrink-0
                  ${pago.moneda === "USD" ? 'bg-[#0071E3]/10 text-[#0071E3]' : 'bg-orange-100 text-orange-600'}`}
                >
                  {pago.moneda === "USD" ? "$" : "Bs"}
                </button>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={pago.monto || ""}
                  className="w-full px-3 py-2.5 bg-transparent text-sm font-black text-[#1D1D1F] outline-none placeholder:text-slate-400"
                  onChange={(e) => actualizarPago(idx, "monto", e.target.value)}
                />
              </div>

              <input
                type="text"
                placeholder="N° de Referencia (Opcional)"
                value={pago.referencia}
                className="flex-1 px-4 py-2.5 bg-[#F5F5F7] border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#0071E3]/20 placeholder:text-slate-400"
                onChange={(e) => actualizarPago(idx, "referencia", e.target.value)}
              />

              {idx > 0 && (
                <button onClick={() => setPagos(pagos.filter((_, i) => i !== idx))} className="px-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0">
                  <Trash2 size={20} strokeWidth={2.5} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER NEGRO - TAMAÑOS AJUSTADOS PARA NO DESBORDAR */}
      <div className="bg-[#1D1D1F] rounded-[24px] p-6 lg:p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">

          <div className="flex items-center gap-4 w-full lg:w-auto border-b lg:border-b-0 lg:border-r border-white/10 pb-5 lg:pb-0 lg:pr-8">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Desc. General</span>
              <div className="flex bg-white/20 p-1 rounded-lg w-fit">
                <button
                  onClick={() => { setTipoDescGral("PORCENTAJE"); setDescuentoGeneral(0); }}
                  className={`px-4 py-1.5 rounded-md text-xs font-black transition-colors ${tipoDescGral === "PORCENTAJE" ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                >%</button>
                <button
                  onClick={() => { setTipoDescGral("MONTO"); setDescuentoGeneral(0); }}
                  className={`px-4 py-1.5 rounded-md text-xs font-black transition-colors ${tipoDescGral === "MONTO" ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                >$</button>
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                className="w-32 bg-transparent border-b border-white/20 px-2 py-1 text-3xl font-black outline-none focus:border-[#0071E3] transition-colors"
                placeholder="0"
                value={descuentoGeneral || ""}
                onChange={(e) => handleDescuentoGeneral(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 flex items-center justify-end gap-8 w-full lg:w-auto">
            <div className="flex flex-col text-right opacity-60">
              <span className="text-[11px] uppercase font-bold tracking-widest mb-1">Subtotal</span>
              <span className="text-xl font-bold">${subtotalUSD.toFixed(2)}</span>
            </div>
            <div className="h-12 w-px bg-white/20"></div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-black text-[#0071E3] uppercase tracking-[0.2em] mb-1">Total a Pagar</span>
              <div className="text-4xl lg:text-5xl font-black tracking-tighter leading-none">${totalFinalUSD.toFixed(2)}</div>
              <div className="text-sm font-bold text-white/50 mt-1.5">Bs {totalFinalBS.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>

          {/* BOTONES AJUSTADOS PARA QUE ENTREN PERFECTAMENTE */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0 pl-0 lg:pl-6 mt-3 lg:mt-0">
            <button
              onClick={() => onFinalizar({ subtotalUSD, totalFinalUSD, totalFinalBS, pagos, descuentoGeneral, tipoDescGral, estado: "BORRADOR", restanteUSD })}
              disabled={guardandoOrden || restanteBS <= 0.01}
              title={restanteBS <= 0.01 ? "No puede guardar como borrador una orden pagada en su totalidad" : ""}
              className="w-full sm:w-1/2 lg:w-56 py-3 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Save size={18} strokeWidth={2.5} /> {guardandoOrden ? "Procesando..." : "Guardar Borrador"}
            </button>
            <button
              onClick={() => {
                if (totalFinalUSD > 0) {
                  if (pagos.length === 0) {
                    toast.warning("Debe agregar al menos un pago y seleccionar su método.");
                    return;
                  }
                  if (pagos.some(p => !p.metodoId)) {
                    toast.warning("Debe seleccionar un método de pago válido para procesar el cierre.");
                    return;
                  }
                }
                onFinalizar({ subtotalUSD, totalFinalUSD, totalFinalBS, pagos, descuentoGeneral, tipoDescGral, estado: "CERRADA", restanteUSD });
              }}
              disabled={guardandoOrden}
              className="w-full sm:w-1/2 lg:w-56 py-3 bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl shadow-[0_0_25px_rgba(0,113,227,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
            >
              <CheckCircle size={18} strokeWidth={2.5} /> {guardandoOrden ? "Procesando..." : "Cerrar y Procesar"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}