"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, Filter, BarChart3, PlusCircle, 
  CreditCard, PieChart as PieIcon, LineChart as LineChartIcon, Loader2, 
  ArrowDownCircle, ArrowUpCircle, Search, Landmark, ChevronLeft, ChevronRight, Trash2, Tag, ChevronDown, ChevronUp
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, PieChart, Pie, Cell
} from "recharts";
import { toast } from "react-toastify";
import ModalRegistrarGasto from "../../components/monedero/ModalRegistrarGasto";
import ModalConfirmacion from "../../components/ui/ModalConfirmacion";
import useTasaBCV from "../../hooks/useTasaBcv"; 
import { normalizeSearchString } from "../../../lib/stringUtils";

const PALETA_GASTOS = ['#EF4444', '#F59E0B', '#8B5CF6', '#F43F5E', '#D946EF'];
const PALETA_INGRESOS = ['#10B981', '#0EA5E9', '#3B82F6', '#14B8A6', '#06B6D4']; 
type PeriodoType = "HOY" | "7DIAS" | "30DIAS" | "MES_ACTUAL" | "CUSTOM";

const formatearMetodo = (str: string) => {
  if (!str) return "N/A";
  return str.split('_').map(p => (p === 'USD' || p === 'BS') ? p : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
};

export default function MonederoPage() {
  const { tasa: tasaBCV, loading: loadingTasa } = useTasaBCV(); 
  
  const [periodo, setPeriodo] = useState<PeriodoType>("HOY");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  
  const [stats, setStats] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [showModalGasto, setShowModalGasto] = useState(false);
  const [gastoAEliminar, setGastoAEliminar] = useState<string | null>(null);
  const [cargandoEliminar, setCargandoEliminar] = useState(false);

  // Estados para búsqueda y paginación
  const [busquedaGasto, setBusquedaGasto] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [busquedaDescuento, setBusquedaDescuento] = useState("");
  const [paginaActualDescuento, setPaginaActualDescuento] = useState(1);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [mostrarEgresos, setMostrarEgresos] = useState(false);
  const [mostrarDescuentos, setMostrarDescuentos] = useState(false);
  const ELEMENTOS_POR_PAGINA = 30;

  const fetchMonedero = async () => {
    setCargando(true);
    try {
      const timestamp = new Date().getTime();
      let url = `/api/monedero?periodo=${periodo}&tasa=${tasaBCV || 39}&t=${timestamp}`;
      
      if (periodo === "CUSTOM") {
        if (!fechaInicio || !fechaFin) { setCargando(false); return; }
        url += `&inicio=${fechaInicio}&fin=${fechaFin}`;
      }
      
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error("Error de red");
      const data = await res.json();
      setStats(data);
      setPaginaActual(1); // Reiniciar a la primera página cuando cambie el período global
      setPaginaActualDescuento(1);
    } catch (error: any) {
      toast.error(error?.message ? `Error al cargar las finanzas: ${error?.message}` : "Error al cargar las finanzas");
    } finally {
      setCargando(false);
    }
  };

  const handleEliminarGasto = async (claveMaestra?: string) => {
    if (!claveMaestra) return toast.warning("Debe ingresar la clave maestra.");
    if (!gastoAEliminar) return;

    setCargandoEliminar(true);
    const id = gastoAEliminar.replace('gas-', '');

    try {
      const res = await fetch(`/api/gastos/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claveMaestra }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar");
      }

      toast.success("Gasto eliminado exitosamente.");
      setGastoAEliminar(null);
      fetchMonedero();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCargandoEliminar(false);
    }
  };

  useEffect(() => {
    if (periodo !== "CUSTOM" && !loadingTasa) fetchMonedero();
  }, [periodo, loadingTasa, tasaBCV]);

  // Reiniciar paginación si el usuario escribe en el buscador local
  useEffect(() => {
    setPaginaActual(1);
  }, [busquedaGasto]);

  useEffect(() => {
    setPaginaActualDescuento(1);
  }, [busquedaDescuento]);

  const aplicarFiltroCustom = () => {
    if (!fechaInicio || !fechaFin) return toast.warning("Seleccione ambas fechas");
    
    const d1 = new Date(fechaInicio);
    const d2 = new Date(fechaFin);
    const diferenciaDias = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    
    if (diferenciaDias > 90) {
      return toast.warning("El rango máximo permitido es de 90 días. Por favor, seleccione un período más corto.");
    }
    if (diferenciaDias < 0) {
      return toast.warning("La fecha de inicio debe ser anterior a la fecha de fin.");
    }

    fetchMonedero();
  };

  const formatMoney = (amount: number, isBs = false) => {
    if (isBs) {
      return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(amount).replace('VES', 'Bs.');
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // 1. Filtrar el universo total de gastos según la búsqueda
  const todosLosGastosFiltrados = useMemo(() => {
    const todosLosMovimientos = stats?.historial || [];
    const soloGastos = todosLosMovimientos.filter((m: any) => m.tipo === 'GASTO');
    
    if (!busquedaGasto) return soloGastos;
    
    return soloGastos.filter((g: any) => {
      const bg = normalizeSearchString(busquedaGasto);
      return normalizeSearchString(g.concepto).includes(bg) ||
      normalizeSearchString(g.metodo).includes(bg) ||
      normalizeSearchString(g.responsable).includes(bg)
    });
  }, [stats, busquedaGasto]);

  // 2. Calcular los elementos exactos que corresponden a la página actual (Segmentación de 30 en 30)
  const gastosPaginados = useMemo(() => {
    const indiceInicio = (paginaActual - 1) * ELEMENTOS_POR_PAGINA;
    const indiceFin = indiceInicio + ELEMENTOS_POR_PAGINA;
    return todosLosGastosFiltrados.slice(indiceInicio, indiceFin);
  }, [todosLosGastosFiltrados, paginaActual]);

  // 3. Cantidad total de páginas
  const totalPaginas = Math.ceil(todosLosGastosFiltrados.length / ELEMENTOS_POR_PAGINA) || 1;

  // Lógica para Descuentos (AGRUPADOS POR ORDEN)
  const ordenesConDescuentosFiltradas = useMemo(() => {
    const todosLosDescuentos = stats?.historialDescuentos || [];
    
    const agrupados: Record<string, any> = {};
    let totalFiltrados = 0; // Para el total del resumen
    todosLosDescuentos.forEach((d: any) => {
        if (!agrupados[d.ordenId]) {
            agrupados[d.ordenId] = {
                ordenId: d.ordenId,
                fecha: d.fecha,
                paciente: d.paciente,
                totalDescuentoUSD: 0,
                totalDescuentoBS: 0,
                descuentos: []
            };
        }
        agrupados[d.ordenId].totalDescuentoUSD += d.montoUSD;
        agrupados[d.ordenId].totalDescuentoBS += d.montoBS;
        agrupados[d.ordenId].descuentos.push(d);
    });

    const listAgrupados = Object.values(agrupados).sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    if (!busquedaDescuento) return listAgrupados;
    
    return listAgrupados.filter((o: any) => {
      const bd = normalizeSearchString(busquedaDescuento);
      return normalizeSearchString(o.paciente).includes(bd) ||
      o.ordenId?.toString().includes(bd) ||
      o.descuentos.some((d: any) => normalizeSearchString(d.motivo).includes(bd) || normalizeSearchString(d.detalleNombre).includes(bd))
    });
  }, [stats, busquedaDescuento]);

  const ordenesPaginadas = useMemo(() => {
    const indiceInicio = (paginaActualDescuento - 1) * ELEMENTOS_POR_PAGINA;
    const indiceFin = indiceInicio + ELEMENTOS_POR_PAGINA;
    return ordenesConDescuentosFiltradas.slice(indiceInicio, indiceFin);
  }, [ordenesConDescuentosFiltradas, paginaActualDescuento]);

  const totalPaginasDescuento = Math.ceil(ordenesConDescuentosFiltradas.length / ELEMENTOS_POR_PAGINA) || 1;

  const toggleOrder = (ordenId: string) => {
    setExpandedOrders(prev => ({...prev, [ordenId]: !prev[ordenId]}));
  };

  const ingresosUSD = stats?.kpis?.totalIngresosUSD ?? 0;
  const ingresosBS = stats?.kpis?.totalIngresosBS ?? 0;
  const gastosUSD = stats?.kpis?.totalGastosUSD ?? 0;
  const gastosBS = stats?.kpis?.totalGastosBS ?? 0;
  const balanceUSD = stats?.kpis?.balanceNetoUSD ?? 0;
  const balanceBS = stats?.kpis?.balanceNetoBS ?? 0;

  return (
    <div className="w-full min-h-screen pb-20 pr-4 animate-in fade-in duration-300">
      
      {showModalGasto && (
        <ModalRegistrarGasto 
          metodosPago={stats?.metodosPago || []}
          tasaBCV={tasaBCV || 39.54} 
          onClose={() => setShowModalGasto(false)}
          onSuccess={() => { setShowModalGasto(false); fetchMonedero(); }}
        />
      )}

      <ModalConfirmacion
        isOpen={!!gastoAEliminar}
        onClose={() => setGastoAEliminar(null)}
        onConfirm={handleEliminarGasto}
        titulo="Eliminar Gasto"
        mensaje="Esta acción borrará este gasto de forma permanente. Necesitas la clave maestra para confirmar."
        textoConfirmar={cargandoEliminar ? "Eliminando..." : "Eliminar Gasto"}
        textoCancelar="Cancelar"
        colorBoton="red"
        requiereInput={true}
        placeholderInput="Ingrese la CLAVE MAESTRA"
      />

      {/* CABECERA */}
      <div className="mb-6 flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-4 pt-2">
        <div>
          <h1 className="font-title text-3xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
            <Wallet className="text-[#0071E3]" size={32} strokeWidth={2.5} />
            Control de Monedero
          </h1>
          <p className="text-[#86868B] mt-1.5 font-medium text-sm">
            Referencia BCV: <span className="font-bold text-[#1D1D1F]">Bs. {tasaBCV?.toFixed(2) || "---"}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-start 2xl:justify-end gap-3">
          <button onClick={() => setShowModalGasto(true)} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2">
            <PlusCircle size={16} strokeWidth={2.5} /> Registrar Egreso
          </button>

          <div className="flex items-center bg-[#F5F5F7] p-1.5 rounded-xl border border-slate-200/60 w-max">
            {["HOY", "7DIAS", "30DIAS", "MES_ACTUAL", "CUSTOM"].map((opt) => (
              <button
                key={opt}
                onClick={() => setPeriodo(opt as PeriodoType)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  periodo === opt ? "bg-white text-[#0071E3] shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {opt === "CUSTOM" ? "Personalizado" : opt.replace('DIAS', ' Días').replace('_', ' ').toLowerCase()}
              </button>
            ))}
          </div>

          {periodo === "CUSTOM" && (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-max animate-in fade-in slide-in-from-left-4 duration-300">
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="px-2 py-1.5 bg-[#F5F5F7] rounded-lg text-xs font-bold outline-none" />
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="px-2 py-1.5 bg-[#F5F5F7] rounded-lg text-xs font-bold outline-none" />
              <button onClick={aplicarFiltroCustom} className="p-2 bg-[#0071E3] hover:bg-[#0077ED] transition-colors text-white rounded-lg"><Filter size={14} /></button>
            </div>
          )}
        </div>
      </div>

      {(cargando || loadingTasa) ? (
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-slate-400 font-bold gap-3">
          <Loader2 className="animate-spin text-[#0071E3]" size={48} /> Procesando estados financieros...
        </div>
      ) : (
        <div className="space-y-6">
          {/* TOTALES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos Brutos</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatMoney(ingresosUSD)}</h3>
                <p className="text-xs font-bold text-slate-400">{formatMoney(ingresosBS, true)}</p>
              </div>
              <ArrowUpCircle size={36} className="text-emerald-500/20" />
            </div>
            <div className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Egresos Totales</p>
                <h3 className="text-2xl font-black text-red-500 mt-1">{formatMoney(gastosUSD)}</h3>
                <p className="text-xs font-bold text-slate-400">{formatMoney(gastosBS, true)}</p>
              </div>
              <ArrowDownCircle size={36} className="text-red-500/20" />
            </div>
            <div className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponibilidad</p>
                <h3 className={`text-2xl font-black mt-1 ${balanceUSD >= 0 ? 'text-[#1D1D1F]' : 'text-orange-600'}`}>{formatMoney(balanceUSD)}</h3>
                <p className="text-xs font-bold text-slate-400">{formatMoney(balanceBS, true)}</p>
              </div>
              <Landmark size={36} className="text-[#0071E3]/20" />
            </div>
          </div>

          {/* BARRAS DE CAJA */}
          <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-black text-[#1D1D1F]">Flujo de Caja Diario</h3>
                <p className="text-xs text-slate-500 font-medium">Comparativa de entradas y salidas.</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <div className="w-3 h-3 rounded-full bg-[#10B981]"></div> Ingresos
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div> Gastos
                </div>
              </div>
            </div>
            <div className="w-full" style={{ height: 240, minHeight: 240 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={stats?.graficoTendencia || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11}} tickFormatter={(v) => `$${v}`} />
                  <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} formatter={(val: any) => formatMoney(Number(val))} />
                  <Bar dataKey="Ingresos" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Gastos" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DONAS */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-sm flex flex-col">
              <h3 className="text-base font-black text-[#1D1D1F] flex items-center gap-2">
                <ArrowUpCircle size={18} className="text-emerald-500" /> Origen de Ingresos
              </h3>
              <div className="flex-1 flex items-center justify-center w-full" style={{ height: 200, minHeight: 200 }}>
                {(stats?.graficoIngresos || []).length === 0 ? (
                  <p className="text-sm font-bold text-slate-400">Sin ingresos.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie data={stats?.graficoIngresos || []} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                        {(stats?.graficoIngresos || []).map((_: any, i: number) => <Cell key={i} fill={PALETA_INGRESOS[i % PALETA_INGRESOS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any, n: any) => [formatMoney(Number(v)), formatearMetodo(n as string)]} />
                      <Legend align="center" verticalAlign="bottom" iconType="circle" formatter={(v) => <span className="text-xs font-bold text-slate-600">{formatearMetodo(v)}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-sm flex flex-col">
              <h3 className="text-base font-black text-[#1D1D1F] flex items-center gap-2">
                <ArrowDownCircle size={18} className="text-red-500" /> Destino de Egresos
              </h3>
              <div className="flex-1 flex items-center justify-center w-full" style={{ height: 200, minHeight: 200 }}>
                {(stats?.graficoGastos || []).length === 0 ? (
                  <p className="text-sm font-bold text-slate-400">Sin salidas registradas.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie data={stats?.graficoGastos || []} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                        {(stats?.graficoGastos || []).map((_: any, i: number) => <Cell key={i} fill={PALETA_GASTOS[i % PALETA_GASTOS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any, n: any) => [formatMoney(Number(v)), formatearMetodo(n as string)]} />
                      <Legend align="center" verticalAlign="bottom" iconType="circle" formatter={(v) => <span className="text-xs font-bold text-slate-600">{formatearMetodo(v)}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* HISTORIAL GENERAL DE GASTOS CON PAGINACIÓN Y TEXTOS GRANDES */}
          <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm overflow-hidden mt-6 transition-all duration-500">
            <div 
              className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/50 transition-colors"
              onClick={() => setMostrarEgresos(!mostrarEgresos)}
            >
              <div>
                <h2 className="text-2xl font-black text-[#1D1D1F] flex items-center gap-2">
                  <CreditCard className="text-red-500" size={24} /> Auditoría de Egresos
                  <ChevronDown className={`ml-2 text-slate-400 transition-transform duration-300 ${mostrarEgresos ? 'rotate-180' : ''}`} size={20} />
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Histórico de salidas paginado de 30 en 30.</p>
              </div>

              {/* Barra de Búsqueda Local */}
              {mostrarEgresos && (
                <div className="relative w-full lg:w-80" onClick={e => e.stopPropagation()}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Filtrar por concepto o método..."
                    value={busquedaGasto}
                    onChange={(e) => setBusquedaGasto(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#1D1D1F] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  />
                </div>
              )}
            </div>

            {mostrarEgresos && (
              <>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-white text-xs uppercase tracking-widest text-slate-400 font-black border-b border-slate-100">
                    <th className="px-8 py-5">Fecha y Registro</th>
                    <th className="px-8 py-5">Descripción del Gasto</th>
                    <th className="px-8 py-5">Método de Salida</th>
                    <th className="px-8 py-5 text-right">Equivalente (BS)</th>
                    <th className="px-8 py-5 text-right">Monto (USD)</th>
                    <th className="px-8 py-5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {gastosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-16 text-center text-slate-400 font-bold text-base">
                        No se encontraron registros de egresos en este rango.
                      </td>
                    </tr>
                  ) : (
                    gastosPaginados.map((g: any) => (
                      <tr key={g.id} className="hover:bg-red-50/30 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-base font-black text-slate-700">{new Date(g.fecha).toLocaleDateString('es-VE')}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Reg: {g.responsable}</span>
                          </div>
                        </td>
                        
                        {/* CELDA CORREGIDA: Controla el ancho y obliga al texto a romper línea hacia abajo */}
                        <td className="px-8 py-5 max-w-[300px] whitespace-normal break-words">
                          <span className="text-base font-medium text-[#1D1D1F] block">
                            {g.concepto}
                          </span>
                        </td>
                        
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-base font-bold text-slate-600">{formatearMetodo(g.metodo)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right whitespace-nowrap">
                          <span className="text-base font-bold text-slate-500">{formatMoney(g.montoBS, true)}</span>
                        </td>
                        <td className="px-8 py-5 text-right whitespace-nowrap">
                          <span className="text-lg font-black text-red-500">-{formatMoney(g.montoUSD)}</span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="relative group/del flex flex-col items-center justify-center">
                            <button
                              onClick={() => setGastoAEliminar(g.id)}
                              className="flex items-center justify-center w-10 h-10 bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                            >
                              <Trash2 size={18} />
                            </button>
                            <div className="absolute -top-10 opacity-0 group-hover/del:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/del:-translate-y-1">
                              Eliminar Gasto
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* CONTROLADORES DE PAGINACIÓN */}
            {totalPaginas > 1 && (
              <div className="px-8 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">
                  Página <span className="font-black text-[#1D1D1F]">{paginaActual}</span> de <span className="font-black text-[#1D1D1F]">{totalPaginas}</span>
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
                    disabled={paginaActual === 1}
                    className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={18} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
                    disabled={paginaActual === totalPaginas}
                    className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  >
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Resumen al pie de la tabla de egresos */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500 italic">
                Mostrando del {(paginaActual - 1) * ELEMENTOS_POR_PAGINA + 1} al {Math.min(paginaActual * ELEMENTOS_POR_PAGINA, todosLosGastosFiltrados.length)} de {todosLosGastosFiltrados.length} registros.
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Egresos:</span>
                <span className="text-2xl font-black text-red-500">-{formatMoney(todosLosGastosFiltrados.reduce((acc: number, curr: any) => acc + curr.montoUSD, 0))}</span>
              </div>
            </div>
            </>
            )}
          </div>

          {/* HISTORIAL GENERAL DE DESCUENTOS CON PAGINACIÓN */}
          <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm overflow-hidden mt-6 transition-all duration-500">
            <div 
              className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/50 transition-colors"
              onClick={() => setMostrarDescuentos(!mostrarDescuentos)}
            >
              <div>
                <h2 className="text-2xl font-black text-[#1D1D1F] flex items-center gap-2">
                  <Tag className="text-red-500" size={24} /> Auditoría de Descuentos
                  <ChevronDown className={`ml-2 text-slate-400 transition-transform duration-300 ${mostrarDescuentos ? 'rotate-180' : ''}`} size={20} />
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Histórico de descuentos aplicados paginado de 30 en 30.</p>
              </div>

              {/* Barra de Búsqueda Local */}
              {mostrarDescuentos && (
                <div className="relative w-full lg:w-80" onClick={e => e.stopPropagation()}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Filtrar por paciente, motivo u orden..."
                    value={busquedaDescuento}
                    onChange={(e) => setBusquedaDescuento(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#1D1D1F] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  />
                </div>
              )}
            </div>

            {mostrarDescuentos && (
              <>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-white text-xs uppercase tracking-widest text-slate-400 font-black border-b border-slate-100">
                    <th className="px-8 py-5">Fecha y Orden</th>
                    <th className="px-8 py-5">Paciente</th>
                    <th className="px-8 py-5">Tipo / Detalle</th>
                    <th className="px-8 py-5">Motivo</th>
                    <th className="px-8 py-5 text-right">Equivalente (BS)</th>
                    <th className="px-8 py-5 text-right">Monto (USD)</th>
                  </tr>
                </thead>
                <tbody className="">
                  {ordenesPaginadas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-16 text-center text-slate-400 font-bold text-base">
                        No se encontraron registros de descuentos en este rango.
                      </td>
                    </tr>
                  ) : (
                    ordenesPaginadas.map((orden: any) => (
                      <Fragment key={orden.ordenId}>
                        <tr 
                          onClick={() => toggleOrder(orden.ordenId)}
                          className={`border-b border-slate-50 transition-colors group cursor-pointer ${expandedOrders[orden.ordenId] ? 'bg-red-50/50' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-base font-black text-slate-700">{new Date(orden.fecha).toLocaleDateString('es-VE')}</span>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Orden #{orden.ordenId}</span>
                            </div>
                          </td>
                          
                          <td className="px-8 py-5 max-w-[200px] whitespace-normal break-words">
                            <span className="text-base font-medium text-[#1D1D1F] block">
                              {orden.paciente}
                            </span>
                          </td>
                          
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              <span className="text-sm font-bold text-slate-600">
                                {orden.descuentos.length} {orden.descuentos.length === 1 ? 'Descuento' : 'Descuentos'}
                              </span>
                            </div>
                          </td>

                          <td className="px-8 py-5">
                            <button className="text-red-500 flex items-center gap-1 text-sm font-bold">
                              <span className={`transition-transform duration-300 ${expandedOrders[orden.ordenId] ? 'rotate-180' : 'rotate-0'}`}>
                                <ChevronDown size={16} />
                              </span>
                              {expandedOrders[orden.ordenId] ? 'Ocultar' : 'Ver Detalles'}
                            </button>
                          </td>

                          <td className="px-8 py-5 text-right whitespace-nowrap">
                            <span className="text-base font-bold text-slate-500">{formatMoney(orden.totalDescuentoBS, true)}</span>
                          </td>
                          <td className="px-8 py-5 text-right whitespace-nowrap">
                            <span className="text-lg font-black text-red-500">-{formatMoney(orden.totalDescuentoUSD)}</span>
                          </td>
                        </tr>
                        
                        {/* Nested Accordeon - Single Row with ColSpan */}
                        <tr className="border-0">
                          <td colSpan={6} className="p-0 border-0">
                            <div className={`grid transition-all duration-300 ease-in-out ${expandedOrders[orden.ordenId] ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                              <div className="overflow-hidden">
                                <div className="bg-slate-50 border-l-4 border-l-red-500 shadow-inner">
                                  <div className="p-6 flex flex-col gap-3">
                                    {orden.descuentos.map((d: any) => {
                                    const isPorcentaje = d.motivo?.toUpperCase().includes('PORCENTAJE') || d.motivo === '%';
                                    
                                    return (
                                      <div key={d.id} className="flex flex-col lg:flex-row lg:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4 hover:border-red-200 transition-colors">
                                        <div className="flex items-center gap-4 lg:w-1/3">
                                          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                            <Tag className="text-red-500" size={16} />
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-700">{d.tipo === 'GENERAL' ? 'Descuento General' : d.detalleNombre}</span>
                                            <span className="text-xs font-bold text-slate-400">{d.motivo}</span>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center lg:justify-center lg:w-1/3">
                                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100">
                                            <span className="text-xs font-bold text-red-400 uppercase">Valor Aplicado:</span>
                                            <span className="text-sm font-black text-red-600">{isPorcentaje ? `${d.valorOriginal}%` : `$${d.valorOriginal}`}</span>
                                          </div>
                                        </div>

                                        <div className="flex flex-col items-start lg:items-end lg:w-1/3">
                                          <span className="text-lg font-black text-red-500">-{formatMoney(d.montoUSD)}</span>
                                          <span className="text-xs font-bold text-slate-400">{formatMoney(d.montoBS, true)}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* CONTROLADORES DE PAGINACIÓN */}
            {totalPaginasDescuento > 1 && (
              <div className="px-8 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">
                  Página <span className="font-black text-[#1D1D1F]">{paginaActualDescuento}</span> de <span className="font-black text-[#1D1D1F]">{totalPaginasDescuento}</span>
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaginaActualDescuento(p => Math.max(p - 1, 1))}
                    disabled={paginaActualDescuento === 1}
                    className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={18} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => setPaginaActualDescuento(p => Math.min(p + 1, totalPaginasDescuento))}
                    disabled={paginaActualDescuento === totalPaginasDescuento}
                    className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  >
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Resumen al pie de la tabla de descuentos */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500 italic">
                Mostrando del {(paginaActualDescuento - 1) * ELEMENTOS_POR_PAGINA + 1} al {Math.min(paginaActualDescuento * ELEMENTOS_POR_PAGINA, ordenesConDescuentosFiltradas.length)} de {ordenesConDescuentosFiltradas.length} órdenes.
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Descuentos:</span>
                <span className="text-2xl font-black text-red-500">-{formatMoney(ordenesConDescuentosFiltradas.reduce((acc: number, curr: any) => acc + curr.totalDescuentoUSD, 0))}</span>
              </div>
            </div>
            </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}