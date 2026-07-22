"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Trash2, FlaskConical, Package } from "lucide-react";
import { normalizeSearchString } from "../../../lib/stringUtils";

interface SeleccionPruebasProps {
  pruebasCatalogo: any[];
  pruebasSeleccionadas: any[];
  setPruebasSeleccionadas: (pruebas: any[]) => void;
  tasaBCV: number;
}

export default function SeleccionPruebas({
  pruebasCatalogo,
  pruebasSeleccionadas,
  setPruebasSeleccionadas,
  tasaBCV
}: SeleccionPruebasProps) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);

  useEffect(() => {
    if (busqueda.trim() === "") {
      setResultados([]);
      return;
    }
    const searchLower = normalizeSearchString(busqueda);
    const filtered = pruebasCatalogo.filter(p =>
      normalizeSearchString(p.nombre).startsWith(searchLower) ||
      normalizeSearchString(p.codigo).startsWith(searchLower)
    ).slice(0, 5); 

    setResultados(filtered);
  }, [busqueda, pruebasCatalogo]);

  const agregarPrueba = (prueba: any) => {
    const existe = pruebasSeleccionadas.find(p => p.id === prueba.id);
    if (existe) {
      setPruebasSeleccionadas(
        pruebasSeleccionadas.map(p =>
          p.id === prueba.id ? { ...p, cantidad: p.cantidad + 1 } : p
        )
      );
    } else {
      setPruebasSeleccionadas([...pruebasSeleccionadas, { ...prueba, cantidad: 1 }]);
    }
    setBusqueda("");
  };

  const eliminarPrueba = (id: string) => {
    setPruebasSeleccionadas(pruebasSeleccionadas.filter(p => p.id !== id));
  };

  const actualizarCantidad = (id: string, nuevaCant: number) => {
    if (nuevaCant < 1) return;
    setPruebasSeleccionadas(
      pruebasSeleccionadas.map(p => p.id === id ? { ...p, cantidad: nuevaCant } : p)
    );
  };

  return (
    <section className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 lg:p-8 mb-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] font-bold">3</div>
          <h2 className="text-xl font-bold text-[#1D1D1F]">Selección de Pruebas</h2>
        </div>
        <div className="text-xs font-bold px-3 py-1.5 bg-primario/20 text-black rounded-xl border border-slate-200 shadow-sm">
          Tasa Aplicada: Bs {tasaBCV.toFixed(2)}
        </div>
      </div>

      <div className="relative mb-6 max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar examen por nombre o código..."
          className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F7] border border-slate-200/60 rounded-2xl text-[#1D1D1F] text-[15px] font-semibold focus:outline-none focus:ring-4 focus:ring-[#0071E3]/15 focus:border-[#0071E3]/50 transition-all placeholder:text-slate-400"
        />

        {resultados.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-top-2">
            {resultados.map((p) => (
              <button
                key={p.id}
                onClick={() => agregarPrueba(p)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-3 text-left">
                  {p.tipo === "PAQUETE" ? (
                    <span className="bg-purple-100 text-purple-600 text-[10px] font-black px-2 py-1 rounded-md border border-purple-200 uppercase tracking-widest flex items-center gap-1 shrink-0">
                      <Package size={12} strokeWidth={3} /> PAQUETE
                    </span>
                  ) : (
                    <span className="bg-blue-50 text-[#0071E3] text-[10px] font-black px-2 py-1 rounded-md border border-blue-100 uppercase tracking-widest shrink-0">
                      {p.codigo}
                    </span>
                  )}
                  <div className="flex flex-col">
                    <span className="font-bold text-[#1D1D1F] text-sm">{p.nombre}</span>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{p.categoriaNombre}</span>
                  </div>
                </div>
                <span className="font-black text-[#1D1D1F] text-sm">${p.precioUSD?.toFixed(2) || "0.00"}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col overflow-hidden bg-white border border-slate-200/80 rounded-2xl shadow-sm">
        {pruebasSeleccionadas.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <FlaskConical size={36} strokeWidth={1.5} className="mb-2 opacity-50" />
            <p className="font-medium text-[15px]">No hay pruebas seleccionadas aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="px-4 py-3 whitespace-nowrap">Código</th>
                  <th className="px-4 py-3 w-full">Descripción</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Cant.</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Precio Unit.</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Total</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pruebasSeleccionadas.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3 align-middle">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md border uppercase tracking-widest whitespace-nowrap ${p.tipo === 'PAQUETE' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-[#0071E3] border-blue-100'}`}>
                        {p.tipo === 'PAQUETE' ? 'PAQUETE' : p.codigo}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1D1D1F] text-sm leading-tight">{p.nombre}</span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">{p.subcategoriaNombre || p.categoriaNombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-center">
                      <div className="inline-flex items-center bg-[#F5F5F7] border border-slate-200 rounded-lg p-0.5">
                        <button onClick={() => actualizarCantidad(p.id, p.cantidad - 1)} className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-[#0071E3] bg-slate-100 hover:bg-slate-200 rounded-md font-bold text-lg transition-colors">-</button>
                        <span className="text-sm font-black text-[#1D1D1F] w-6 text-center">{p.cantidad}</span>
                        <button onClick={() => actualizarCantidad(p.id, p.cantidad + 1)} className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-[#0071E3] bg-slate-100 hover:bg-slate-200 rounded-md font-bold text-lg transition-colors">+</button>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1D1D1F]">${p.precioUSD.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">Bs {(p.precioUSD * tasaBCV).toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <div className="flex flex-col">
                        <span className="font-black text-[#0071E3]">${(p.precioUSD * p.cantidad).toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">Bs {((p.precioUSD * p.cantidad) * tasaBCV).toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <button onClick={() => eliminarPrueba(p.id)} className="p-2 text-slate-500 bg-slate-50 border border-slate-200 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg transition-all" title="Eliminar ítem">
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}