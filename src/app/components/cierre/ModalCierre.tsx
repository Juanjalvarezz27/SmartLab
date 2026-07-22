import { useState, useEffect } from "react";
import { Lock, X, CheckCircle, AlertTriangle, Loader2, Save } from "lucide-react";
import { toast } from "react-toastify";

const formatearMetodo = (str: string) => {
  if (!str || str === "NINGUNO") return "Ninguno";
  return str.split('_').map(p => (p === 'USD' || p === 'BS') ? p : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
};

interface ModalCierreProps {
  data: any;
  tasaBCV: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalCierre({ data, tasaBCV, onClose, onSuccess }: ModalCierreProps) {
  const [declaradosPorMetodo, setDeclaradosPorMetodo] = useState<Record<string, { usd: string, bs: string }>>({});
  const [declaradoGlobalUSD, setDeclaradoGlobalUSD] = useState("");
  const [declaradoGlobalBS, setDeclaradoGlobalBS] = useState("");
  const [obsCierre, setObsCierre] = useState("");
  const [guardandoCierre, setGuardandoCierre] = useState(false);

  useEffect(() => {
    if (data?.desglosesCaja) {
      const initialDeclaraciones: Record<string, { usd: string, bs: string }> = {};
      data.desglosesCaja.forEach((box: any) => {
        initialDeclaraciones[box.nombre] = { usd: "", bs: "" };
      });
      setDeclaradosPorMetodo(initialDeclaraciones);
      setObsCierre("");
      setDeclaradoGlobalUSD("");
      setDeclaradoGlobalBS("");
    }
  }, [data]);

  const formatMoney = (amount: number, isBs = false) => {
    const validAmount = Number(amount) || 0;
    if (isBs) return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(validAmount).replace('VES', 'Bs.');
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(validAmount);
  };

  const handleMetodoChange = (metodo: string, moneda: 'usd' | 'bs', valor: string) => {
    setDeclaradosPorMetodo(prev => {
      let usdVal = moneda === 'usd' ? valor : prev[metodo]?.usd || "";
      let bsVal = moneda === 'bs' ? valor : prev[metodo]?.bs || "";

      const numValor = parseFloat(valor);
      const tasa = tasaBCV || 1;
      
      if (valor === "") {
        usdVal = "";
        bsVal = "";
      } else if (!isNaN(numValor)) {
        if (moneda === 'usd') {
          bsVal = (numValor * tasa).toFixed(2);
        } else {
          usdVal = (numValor / tasa).toFixed(2);
        }
      }

      return {
        ...prev,
        [metodo]: { usd: usdVal, bs: bsVal }
      };
    });
  };

  const handleGlobalChange = (moneda: 'usd' | 'bs', valor: string) => {
    const tasa = tasaBCV || 1;
    if (moneda === 'usd') {
      setDeclaradoGlobalUSD(valor);
      if (valor === "") setDeclaradoGlobalBS("");
      else if (!isNaN(parseFloat(valor))) setDeclaradoGlobalBS((parseFloat(valor) * tasa).toFixed(2));
    } else {
      setDeclaradoGlobalBS(valor);
      if (valor === "") setDeclaradoGlobalUSD("");
      else if (!isNaN(parseFloat(valor))) setDeclaradoGlobalUSD((parseFloat(valor) / tasa).toFixed(2));
    }
  };

  const calculoUSD = data?.resumen?.totalEnCajaUSD || 0;
  
  const totalDeclaradoDinamicamenteUSD = data?.desglosesCaja?.length > 0 
    ? Object.values(declaradosPorMetodo).reduce((sum, val) => sum + (parseFloat(val.usd) || 0), 0)
    : parseFloat(declaradoGlobalUSD || "0");
    
  const totalDeclaradoDinamicamenteBS = data?.desglosesCaja?.length > 0
    ? Object.values(declaradosPorMetodo).reduce((sum, val) => sum + (parseFloat(val.bs) || 0), 0)
    : parseFloat(declaradoGlobalBS || "0");

  const totalEsperadoBS = data?.resumen?.totalEnCajaBS || 0;

  const descuadreCalculadoUSD = Math.round((totalDeclaradoDinamicamenteUSD - calculoUSD) * 100) / 100;
  const descuadreCalculadoBS = Math.round((totalDeclaradoDinamicamenteBS - totalEsperadoBS) * 100) / 100;
  const esCuadrePerfecto = descuadreCalculadoUSD === 0 && descuadreCalculadoBS === 0;

  const ejecutarCierre = async () => {
    if (data?.desglosesCaja?.length > 0) {
      const algunCampoVacio = Object.values(declaradosPorMetodo).some(m => m.usd === "" && m.bs === "");
      if (algunCampoVacio) return toast.warning("Complete todos los campos por método (puede ingresar 0).");
    } else {
      if (declaradoGlobalUSD === "" || declaradoGlobalBS === "") return toast.warning("Declare el monto físico.");
    }

    setGuardandoCierre(true);
    try {
      const desgloseEnriquecido = (data?.desglosesCaja || []).map((box: any) => ({
        ...box,
        declaradoUSD: parseFloat(declaradosPorMetodo[box.nombre]?.usd || "0"),
        declaradoBS: parseFloat(declaradosPorMetodo[box.nombre]?.bs || "0")
      }));

      const payload = {
        totalCalculadoUSD: data.resumen.totalEnCajaUSD,
        totalCalculadoBS: data.resumen.totalEnCajaBS,
        totalDeclaradoUSD: totalDeclaradoDinamicamenteUSD,
        totalDeclaradoBS: totalDeclaradoDinamicamenteBS,
        observaciones: obsCierre,
        tasaBCV,
        desglose: desgloseEnriquecido
      };
      
      const res = await fetch("/api/cierre-caja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falló el cierre");
      
      toast.success("Cierre de caja guardado exitosamente");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message ? `Error al guardar el cierre: ${error.message}` : "Error al guardar el cierre");
    } finally {
      setGuardandoCierre(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#111827]/80 transition-opacity" onClick={() => !guardandoCierre && onClose()}></div>
      <div className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Lock size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#111827]">Cuadre de Turno</h2>
              <p className="text-sm font-bold text-slate-500">Sistema espera global: <span className="text-emerald-600 font-black">{formatMoney(calculoUSD)}</span> / <span className="text-[#111827] font-black">{formatMoney(totalEsperadoBS, true)}</span></p>
            </div>
          </div>
          <button onClick={onClose} disabled={guardandoCierre} className="p-2 text-slate-500 bg-slate-100 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-all"><X size={20} strokeWidth={2.5} /></button>
        </div>
        
        <div className="p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="flex flex-col gap-8">
            
            {/* Sección Superior: Entradas de dinero */}
            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Declare Montos por Método</label>
              {data?.desglosesCaja?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.desglosesCaja.map((box: any) => (
                    <div key={box.nombre} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl transition-all hover:border-indigo-100 hover:shadow-md hover:bg-white">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-extrabold text-[#111827] uppercase tracking-wide">{formatearMetodo(box.nombre)}</h4>
                        <span className="text-xs font-bold text-slate-400">Esperado: <strong className="text-emerald-600">{formatMoney(box.netoUSD)}</strong> <span className="mx-0.5">/</span> <strong className="text-[#111827]">{formatMoney(box.ingresosBS, true)}</strong></span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                          <input type="number" step="0.01" value={declaradosPorMetodo[box.nombre]?.usd || ""} onChange={(e) => handleMetodoChange(box.nombre, 'usd', e.target.value)} className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="0.00" />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Bs</span>
                          <input type="number" step="0.01" value={declaradosPorMetodo[box.nombre]?.bs || ""} onChange={(e) => handleMetodoChange(box.nombre, 'bs', e.target.value)} className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="0.00" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center h-full flex flex-col justify-center">
                  <p className="text-sm font-bold text-slate-500 mb-6">No hay métodos registrados hoy. Declare $0.00 para cerrar.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Global USD</label>
                      <input type="number" step="0.01" value={declaradoGlobalUSD} onChange={(e) => handleGlobalChange('usd', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="0.00" />
                    </div>
                    <div className="text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Global BS</label>
                      <input type="number" step="0.01" value={declaradoGlobalBS} onChange={(e) => handleGlobalChange('bs', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="0.00" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Sección Inferior: Resumen y Acciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              
              {/* Inferior Izquierda: Resumen y Alerta */}
              <div className="flex flex-col gap-5">
                {(totalDeclaradoDinamicamenteUSD > 0 || totalDeclaradoDinamicamenteBS > 0 || declaradoGlobalUSD === "0" || data?.desglosesCaja?.length === 0) && (
                  <div className={`p-5 rounded-2xl border flex items-start gap-4 ${esCuadrePerfecto ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {esCuadrePerfecto ? <CheckCircle size={28} className="shrink-0" /> : <AlertTriangle size={28} className="shrink-0" />}
                    <div>
                      <h4 className="text-base font-extrabold">{esCuadrePerfecto ? 'Cuadre Global Perfecto' : 'Descuadre Detectado en Totales'}</h4>
                      <p className="text-sm font-bold opacity-80 mt-1">
                        Total: <span className="text-emerald-600">{formatMoney(totalDeclaradoDinamicamenteUSD)}</span> | Dif: <span className={descuadreCalculadoUSD === 0 ? '' : 'text-emerald-600 font-bold'}>{descuadreCalculadoUSD !== 0 ? (descuadreCalculadoUSD > 0 ? '+' : '') + formatMoney(descuadreCalculadoUSD) : '$0.00'}</span> <span className="text-slate-400 font-normal">/</span> <span className={descuadreCalculadoBS === 0 ? 'text-[#111827]' : 'text-[#111827] font-extrabold'}>{descuadreCalculadoBS !== 0 ? (descuadreCalculadoBS > 0 ? '+' : '') + formatMoney(descuadreCalculadoBS, true) : 'Bs 0.00'}</span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Resumen Declarado</h3>
                  <div className="space-y-3">
                    {data?.desglosesCaja?.length > 0 ? data.desglosesCaja.map((box: any) => {
                      const dec = declaradosPorMetodo[box.nombre];
                      if (!dec || (parseFloat(dec.usd) === 0 && parseFloat(dec.bs) === 0 && !dec.usd && !dec.bs)) return null;
                      return (
                        <div key={box.nombre} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                          <span className="font-semibold text-slate-500">{formatearMetodo(box.nombre)}</span>
                          <span className="font-bold text-[#111827]">
                            <span className="text-emerald-600">{formatMoney(parseFloat(dec.usd) || 0)}</span> <span className="mx-0.5 text-slate-400">/</span> <span className="text-[#111827] font-black">{formatMoney(parseFloat(dec.bs) || 0, true)}</span>
                          </span>
                        </div>
                      );
                    }) : (
                      <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                        <span className="font-semibold text-slate-500">Global</span>
                        <span className="font-bold text-[#111827]">
                          <span className="text-emerald-600">{formatMoney(parseFloat(declaradoGlobalUSD) || 0)}</span> <span className="mx-0.5 text-slate-400">/</span> <span className="text-[#111827] font-black">{formatMoney(parseFloat(declaradoGlobalBS) || 0, true)}</span>
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-bold text-slate-600">Total USD / BS:</span>
                      <span className="text-xl font-black text-[#111827]"><span className="text-emerald-600">{formatMoney(totalDeclaradoDinamicamenteUSD)}</span> <span className="mx-1 text-slate-300">/</span> <span className="text-base text-[#111827]">{formatMoney(totalDeclaradoDinamicamenteBS, true)}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inferior Derecha: Observaciones y Acciones */}
              <div className="flex flex-col gap-5">
                <div className="flex-1 flex flex-col">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Observaciones / Notas de Cierre</label>
                  <textarea value={obsCierre} onChange={(e) => setObsCierre(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all flex-1 min-h-[120px] resize-none" placeholder="Motivo del descuadre o nota adicional para el reporte..."></textarea>
                </div>

                <button onClick={ejecutarCierre} disabled={guardandoCierre} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-extrabold rounded-2xl transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 shrink-0 mt-auto hover:scale-[1.02] active:scale-[0.98]">
                  {guardandoCierre ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />} Confirmar y Cerrar Turno
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
