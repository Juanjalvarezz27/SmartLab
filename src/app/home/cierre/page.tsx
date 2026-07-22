"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Calculator, Users, Wallet, Landmark, Filter, Search, Loader2, CheckCircle,
  AlertTriangle, ChevronLeft, ChevronRight, Lock, AlertCircle, Save, X,
  ChevronDown, ChevronUp, Activity, History, Trash2, FileText, Printer, Download
} from "lucide-react";
import { toast } from "react-toastify";
import useTasaBCV from "../../hooks/useTasaBcv";
import ModalCierre from "../../components/cierre/ModalCierre";
import ModalConfirmacion from "../../components/ui/ModalConfirmacion";
import { normalizeSearchString } from "../../../lib/stringUtils";
const ModalPreviewCierrePDF = dynamic(() => import("../../components/cierre/ModalPreviewCierrePDF"), { ssr: false });

type VistaType = "HOY" | "HISTORIAL";
type PeriodoType = "HOY" | "CUSTOM";

const formatearMetodo = (str: string) => {
  if (!str || str === "NINGUNO") return "Ninguno";
  return str.split('_').map(p => (p === 'USD' || p === 'BS') ? p : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
};

export default function CierreCajaPage() {
  const { tasa: tasaBcvEnVivo, loading: loadingTasa } = useTasaBCV();

  const [vista, setVista] = useState<VistaType>("HOY");
  const [periodo, setPeriodo] = useState<PeriodoType>("HOY");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [data, setData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const tasaAplicada = data?.tasaDelDia || tasaBcvEnVivo;

  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const ELEMENTOS_POR_PAGINA = 30;

  // Historial
  const [filtroResponsableHistorial, setFiltroResponsableHistorial] = useState("TODOS");
  const [paginaActualHistorial, setPaginaActualHistorial] = useState(1);
  const [filtroPeriodoHistorial, setFiltroPeriodoHistorial] = useState("TODOS");
  const [fechaInicioHistorial, setFechaInicioHistorial] = useState("");
  const [fechaFinHistorial, setFechaFinHistorial] = useState("");

  // Modal de Cierre
  const [showModalCierre, setShowModalCierre] = useState(false);
  const [modalAnularCierreId, setModalAnularCierreId] = useState<string | null>(null);

  const [isDiarioOpen, setIsDiarioOpen] = useState(true);

  const fetchCierre = async () => {
    setCargando(true);
    try {
      const timestamp = new Date().getTime();
      let url = `/api/cierre-caja?tasa=${tasaBcvEnVivo || 39}&t=${timestamp}`;
      if (periodo === "CUSTOM") {
        if (!fechaInicio || !fechaFin) { setCargando(false); return; }
        url += `&periodo=CUSTOM&inicio=${fechaInicio}&fin=${fechaFin}`;
      }
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error("Error de red");
      setData(await res.json());
      setPaginaActual(1);
    } catch (error: any) {
      toast.error(error?.message ? `Error al cargar el arqueo: ${error?.message}` : "Error al cargar el arqueo");
    } finally {
      setCargando(false);
    }
  };

  const anularCierre = (id: string) => {
    setModalAnularCierreId(id);
  };

  const confirmarAnularCierre = async (clave?: string) => {
    if (!clave || !modalAnularCierreId) return;

    try {
      const res = await fetch(`/api/cierre-caja?id=${modalAnularCierreId}&clave=${clave}`, {
        method: "DELETE"
      });
      const dataJson = await res.json();

      if (!res.ok) throw new Error(dataJson.error || "Error al anular");

      toast.success("Cierre anulado exitosamente");
      fetchCierre();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setModalAnularCierreId(null);
    }
  };

  useEffect(() => {
    if (!loadingTasa) fetchCierre();
  }, [periodo, loadingTasa, tasaBcvEnVivo]);

  const aplicarFiltroCustom = () => {
    if (!fechaInicio || !fechaFin) return toast.warning("Seleccione fechas");
    fetchCierre();
  };

  const [previewPDF, setPreviewPDF] = useState<"DIARIO" | "HISTORIAL" | "INDIVIDUAL" | null>(null);
  const [dataIndividual, setDataIndividual] = useState<any>(null);

  const abrirPreviewCierre = () => {
    if (!data) return;
    setPreviewPDF("DIARIO");
  };

  const abrirPreviewHistorial = () => {
    if (!historialFiltrado || historialFiltrado.length === 0) return toast.warning("No hay datos en el historial para imprimir.");
    setPreviewPDF("HISTORIAL");
  };

  const abrirPreviewIndividual = async (id: string) => {
    const toastId = toast.loading("Cargando detalles del cierre...");
    try {
      const res = await fetch(`/api/cierre-caja?cierreId=${id}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setDataIndividual(result);
      setPreviewPDF("INDIVIDUAL");
      toast.update(toastId, { render: "Cargado exitosamente", type: "success", isLoading: false, autoClose: 2000 });
    } catch (error: any) {
      toast.update(toastId, { render: error.message, type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const formatMoney = (amount: number, isBs = false) => {
    const validAmount = Number(amount) || 0;
    if (isBs) return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(validAmount).replace('VES', 'Bs.');
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(validAmount);
  };

  const pacientesFiltrados = useMemo(() => {
    const lista = data?.flujoPacientes || [];
    if (!busqueda) return lista;
    return lista.filter((p: any) => {
      const b = normalizeSearchString(busqueda);
      return normalizeSearchString(p.paciente).includes(b) ||
      p.cedula.includes(busqueda) || p.ordenId.toString().includes(busqueda)
    });
  }, [data, busqueda]);

  const pacientesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * ELEMENTOS_POR_PAGINA;
    return pacientesFiltrados.slice(inicio, inicio + ELEMENTOS_POR_PAGINA);
  }, [pacientesFiltrados, paginaActual]);

  const totalPaginas = Math.ceil(pacientesFiltrados.length / ELEMENTOS_POR_PAGINA) || 1;

  const responsablesOptions = useMemo(() => {
    const list = data?.historialCierres || [];
    const uniqueNames = Array.from(new Set(list.map((c: any) => c.realizadoPor?.nombre).filter(Boolean)));
    return [
      { value: "TODOS", label: "Todos los Responsables" },
      ...uniqueNames.map((name: any) => ({ value: name as string, label: name as string }))
    ];
  }, [data]);

  const periodoOptions = [
    { value: "TODOS", label: "Todos los Tiempos" },
    { value: "ESTE_MES", label: "Este Mes" },
    { value: "CUSTOM", label: "Rango Específico" }
  ];

  const historialFiltrado = useMemo(() => {
    let lista = data?.historialCierres || [];

    if (filtroPeriodoHistorial === "CUSTOM") {
      if (fechaInicioHistorial && fechaFinHistorial) {
        const inicio = new Date(fechaInicioHistorial).getTime();
        const fin = new Date(fechaFinHistorial).getTime() + 86399000;
        lista = lista.filter((c: any) => {
          const time = new Date(c.fechaCierre).getTime();
          return time >= inicio && time <= fin;
        });
      }
    } else if (filtroPeriodoHistorial === "ESTE_MES") {
      const ahora = new Date();
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).getTime();
      lista = lista.filter((c: any) => new Date(c.fechaCierre).getTime() >= inicioMes);
    }

    if (filtroResponsableHistorial !== "TODOS") {
      lista = lista.filter((c: any) => c.realizadoPor?.nombre === filtroResponsableHistorial);
    }

    return lista;
  }, [data, filtroPeriodoHistorial, fechaInicioHistorial, fechaFinHistorial, filtroResponsableHistorial]);

  const historialPaginado = useMemo(() => {
    const inicio = (paginaActualHistorial - 1) * ELEMENTOS_POR_PAGINA;
    return historialFiltrado.slice(inicio, inicio + ELEMENTOS_POR_PAGINA);
  }, [historialFiltrado, paginaActualHistorial]);

  const totalPaginasHistorial = Math.ceil(historialFiltrado.length / ELEMENTOS_POR_PAGINA) || 1;

  return (
    <div className="w-full min-h-screen p-4 md:p-8 bg-[#FAFAFA] animate-in fade-in duration-300">
      <ModalConfirmacion
        isOpen={!!modalAnularCierreId}
        onClose={() => setModalAnularCierreId(null)}
        onConfirm={confirmarAnularCierre}
        titulo="Anular Cierre de Caja"
        mensaje="Esta acción borrará este cierre permanentemente. Necesitas la clave maestra."
        textoConfirmar="Anular Cierre"
        requiereInput={true}
        placeholderInput="Ingrese la CLAVE MAESTRA"
      />

      {showModalCierre && (
        <ModalCierre
          data={data}
          tasaBCV={tasaAplicada}
          onClose={() => setShowModalCierre(false)}
          onSuccess={() => {
            setShowModalCierre(false);
            fetchCierre();
          }}
        />
      )}

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between mb-8 gap-6 pt-2">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#111827] flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Calculator size={28} strokeWidth={2.5} />
            </div>
            {data?.tituloCaja || "Cierre Diario"}
          </h1>
          
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {data?.esAtrasado && data?.fechaTarget && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-black rounded-xl border border-amber-200 shadow-sm">
                <AlertTriangle size={14} strokeWidth={2.5} />
                Corresponde al {new Date(data.fechaTarget + 'T12:00:00').toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
            
            <span className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm text-xs font-medium text-slate-500">
              Tasa Aplicada: <strong className="text-[#111827] ml-1">Bs. {tasaAplicada?.toFixed(2) || "---"}</strong>
            </span>
            
            {data?.ultimoCierre && (
              <span className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm text-xs font-medium text-slate-500">
                Último cierre: <strong className="text-[#111827] ml-1 mr-1">{new Date(data.ultimoCierre.fecha).toLocaleString('es-VE')}</strong> por {data.ultimoCierre.por}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
          <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-max">
            {[
              { id: "HOY", label: data?.esAtrasado ? "Caja Pendiente" : "Caja de Hoy", icon: <Wallet size={16}/> },
              { id: "HISTORIAL", label: "Historial de Cierres", icon: <History size={16}/> }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setVista(opt.id as VistaType)}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                  vista === opt.id ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          {vista === "HOY" && (
            <div className="flex items-center gap-2">
              <button
                onClick={abrirPreviewCierre}
                disabled={previewPDF !== null || !data}
                className="px-5 py-3 text-[#111827] bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-xs font-extrabold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                title="Imprimir Cierre Diario en PDF"
              >
                {previewPDF === "DIARIO" ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} strokeWidth={2.5} />} 
                <span className="hidden sm:inline">Imprimir Cierre</span>
              </button>

              {data?.yaCerroHoy ? (
                <button
                  onClick={() => data?.historialCierres?.[0]?.id && anularCierre(data.historialCierres[0].id)}
                  className="px-6 py-3 text-emerald-700 bg-emerald-100 hover:bg-red-100 hover:text-red-700 text-xs font-extrabold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 group min-w-[160px]"
                  title="Anular Cierre de Hoy"
                >
                  <span className="group-hover:hidden flex items-center gap-2"><CheckCircle size={16} strokeWidth={2.5} /> Turno Cerrado</span>
                  <span className="hidden group-hover:flex items-center gap-2"><Trash2 size={16} strokeWidth={2.5} /> Anular Cierre</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowModalCierre(true)}
                  className="px-6 py-3 text-white text-xs font-extrabold rounded-2xl transition-all shadow-md flex items-center gap-2 bg-[#111827] hover:bg-black"
                >
                  <Lock size={16} strokeWidth={2.5} /> Ejecutar Cierre
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {(cargando || loadingTasa) ? (
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-slate-400 font-bold gap-3">
          <Loader2 className="animate-spin text-indigo-600" size={48} /> {vista === "HOY" ? "Auditando registros..." : "Cargando historial..."}
        </div>
      ) : vista === "HISTORIAL" ? (

        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="px-8 py-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <History size={24} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#111827]">Historial de Cierres</h2>
                <p className="text-sm font-medium text-slate-500">Registro inmutable de cortes de caja pasados.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <CustomSelect
                options={responsablesOptions}
                value={filtroResponsableHistorial}
                onChange={(v: string) => { setFiltroResponsableHistorial(v); setPaginaActualHistorial(1); }}
                className="w-full lg:w-64 min-w-[260px]"
              />
              <CustomSelect
                options={periodoOptions}
                value={filtroPeriodoHistorial}
                onChange={(v: string) => { setFiltroPeriodoHistorial(v); setPaginaActualHistorial(1); }}
              />
              {filtroPeriodoHistorial === "CUSTOM" && (
                <div className="flex items-center gap-2">
                  <input type="date" value={fechaInicioHistorial} onChange={(e) => {setFechaInicioHistorial(e.target.value); setPaginaActualHistorial(1);}} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-600" />
                  <span className="text-slate-400 font-bold">-</span>
                  <input type="date" value={fechaFinHistorial} onChange={(e) => {setFechaFinHistorial(e.target.value); setPaginaActualHistorial(1);}} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-600" />
                </div>
              )}
              <button
                onClick={abrirPreviewHistorial}
                disabled={previewPDF !== null || historialFiltrado.length === 0}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ml-auto disabled:opacity-50"
                title="Descargar Historial en PDF"
              >
                {previewPDF === "HISTORIAL" ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} strokeWidth={2.5} />} 
                <span className="hidden lg:inline">Exportar PDF</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 text-[11px] uppercase tracking-widest text-slate-400 font-extrabold border-b border-slate-100">
                  <th className="px-8 py-5">Fecha y Hora</th>
                  <th className="px-8 py-5">Responsable</th>
                  <th className="px-8 py-5 text-right">Sistema (USD)</th>
                  <th className="px-8 py-5 text-right">Físico Declarado (USD)</th>
                  <th className="px-8 py-5 text-center">Estatus</th>
                  <th className="px-8 py-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {historialPaginado.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-slate-500 font-bold text-base">
                      No se encontraron cierres de caja para este filtro.
                    </td>
                  </tr>
                ) : (
                  historialPaginado.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap text-base font-extrabold text-[#111827]">
                        {new Date(c.fechaCierre).toLocaleDateString('es-VE')}
                        <span className="text-xs font-bold text-slate-400 ml-2">{new Date(c.fechaCierre).toLocaleTimeString('es-VE', {hour:'2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-600">
                        {c.realizadoPor?.nombre || "N/A"}
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap text-base font-black text-slate-800">
                        {formatMoney(c.totalCalculadoUSD)}
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap text-base font-black text-indigo-600">
                        {formatMoney(c.totalDeclaradoUSD)}
                      </td>
                      <td className="px-8 py-5 text-center whitespace-nowrap">
                        {c.descuadreUSD === 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-black rounded-xl border border-emerald-100">
                            <CheckCircle size={12} /> Cuadrado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 text-xs font-black rounded-xl border border-red-100" title={`Descuadre: ${formatMoney(c.descuadreUSD)}`}>
                            <AlertTriangle size={12} /> Descuadre
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => abrirPreviewIndividual(c.id)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Imprimir Detalle"
                          >
                            <Printer size={18} />
                          </button>
                          <button
                            onClick={() => anularCierre(c.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Anular Cierre"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPaginasHistorial > 1 && (
            <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500">Página <strong className="text-[#111827]">{paginaActualHistorial}</strong> de <strong className="text-[#111827]">{totalPaginasHistorial}</strong></span>
              <div className="flex gap-2">
                <button onClick={() => setPaginaActualHistorial(p => Math.max(p - 1, 1))} disabled={paginaActualHistorial === 1} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-[#111827] disabled:opacity-40 transition-colors shadow-sm"><ChevronLeft size={18} strokeWidth={2.5}/></button>
                <button onClick={() => setPaginaActualHistorial(p => Math.min(p + 1, totalPaginasHistorial))} disabled={paginaActualHistorial === totalPaginasHistorial} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-[#111827] disabled:opacity-40 transition-colors shadow-sm"><ChevronRight size={18} strokeWidth={2.5}/></button>
              </div>
            </div>
          )}
        </div>

      ) : (

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {data?.yaCerroHoy && (
            <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-emerald-800 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-100 rounded-xl"><CheckCircle size={24} /></div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wide">El turno ha sido cerrado</h3>
                  <p className="text-xs font-medium opacity-80">El dinero físico fue auditado. Los nuevos movimientos que registres entrarán en la caja del próximo turno.</p>
                </div>
              </div>
              <button
                onClick={() => data?.historialCierres?.[0]?.id && anularCierre(data.historialCierres[0].id)}
                className="shrink-0 px-4 py-2 bg-white border border-emerald-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-emerald-700 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <Trash2 size={14} /> Anular Cierre
              </button>
            </div>
          )}

          {/* TOTALES SUPERIORES COMPACTADOS (p-5 y mb-3 para optimizar espacio) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Dinero Líquido Real" usd={data?.resumen?.totalEnCajaUSD} bs={data?.resumen?.totalEnCajaBS} icon={<Landmark size={20} />} color="text-emerald-600" bgColor="bg-emerald-50" />
            <StatCard title="Por Cobrar (Pendiente)" usd={data?.resumen?.cuentasPorCobrarUSD} bs={data?.resumen?.cuentasPorCobrarBS} icon={<AlertCircle size={20} />} color="text-amber-600" bgColor="bg-amber-50" />
            <StatCard title="Flujo de Pacientes" usd={data?.resumen?.pacientesAtendidos} icon={<Users size={20} />} color="text-indigo-600" bgColor="bg-indigo-50" isCount subtitle="Atenciones hoy" />
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
            <h3 className="text-xl font-extrabold text-[#111827] mb-6 flex items-center gap-3 relative z-10">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Activity size={24} /></div>
              Ingresos por Método de Pago
            </h3>

            {/* SECCIÓN METODOS DE PAGO: Grid de 3 columnas fijas con fuentes más grandes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 w-full min-w-0">
              {(data?.desglosesCaja || []).map((box: any, index: number) => (
                <div key={index} className="p-5 bg-slate-50/60 rounded-3xl border border-slate-100 hover:border-emerald-100 hover:bg-white hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300 group flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between mb-1 min-w-0">
                    {/* Agrandado de text-xs a text-sm font-black */}
                    <h4 className="text-sm font-black text-slate-700 truncate uppercase tracking-wider group-hover:text-emerald-600 transition-colors">{formatearMetodo(box.nombre)}</h4>
                    <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0">
                      <Wallet size={16} />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-2 w-full min-w-0">
                    <div className="bg-emerald-50/40 border border-emerald-100/60 p-3 rounded-2xl flex flex-col w-full min-w-0">
                      {/* Agrandado de text-[9px] a text-xs */}
                      <span className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Total Ingresado</span>
                      {/* Agrandado de text-xl a text-2xl */}
                      <span className="text-2xl font-extrabold text-emerald-600 truncate">{formatMoney(box.ingresosUSD)}</span>
                      {/* Agrandado de text-xs a text-sm */}
                      <span className="text-sm font-bold text-emerald-700/80 mt-0.5 truncate">{formatMoney(box.ingresosBS, true)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(data?.desglosesCaja || []).length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Wallet size={40} className="mb-3 text-slate-300" />
                  <p className="text-base font-bold text-slate-500">Caja vacía. No hay ingresos registrados hoy.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
            <div className="px-8 py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsDiarioOpen(!isDiarioOpen)}>
              <div className="flex items-center gap-5">
                <div className={`p-3 rounded-2xl transition-colors ${isDiarioOpen ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-500'}`}>
                  <Users size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#111827]">Diario de Pacientes</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Detalle de atenciones, facturación y cuentas por cobrar.</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {isDiarioOpen && (
                  <div className="relative w-full lg:w-80" onClick={e => e.stopPropagation()}>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Buscar cédula, paciente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all" />
                  </div>
                )}
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-[#111827] transition-colors">
                  {isDiarioOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </div>
            </div>

            <div className={`grid transition-all duration-300 ease-in-out ${isDiarioOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
              <div className="overflow-hidden">
                <div className="overflow-x-auto w-full border-t border-slate-100">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50/50 text-[11px] uppercase tracking-widest text-slate-400 font-extrabold border-b border-slate-100">
                        <th className="px-8 py-5">ID / Registro</th>
                        <th className="px-8 py-5">Paciente</th>
                        <th className="px-8 py-5">Método Aplicado</th>
                        <th className="px-8 py-5">Estado Financiero</th>
                        <th className="px-8 py-5 text-right">Facturación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pacientesPaginados.length === 0 ? (
                        <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-500 font-bold text-base">No se encontraron pacientes para este filtro.</td></tr>
                      ) : (
                        pacientesPaginados.map((p: any) => (
                          <tr key={p.ordenId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-8 py-5 whitespace-nowrap">
                              <span className="text-base font-extrabold text-[#111827] block">#{p.ordenId.toString().padStart(5, '0')}</span>
                              <span className="text-xs font-bold text-slate-400 mt-1 block">Reg: {p.registradoPor}</span>
                            </td>
                            <td className="px-8 py-5 max-w-[280px] whitespace-normal break-words">
                              <span className="text-sm font-extrabold text-[#111827] uppercase tracking-wide block">{p.paciente}</span>
                              <span className="text-xs font-bold text-slate-500 mt-0.5 block">V-{p.cedula}</span>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap">
                              <span className="text-sm font-bold text-slate-600 px-3 py-1.5 bg-slate-100 rounded-lg">{formatearMetodo(p.metodoUsado)}</span>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap">
                              {p.estadoPago === 'PAGADO' ? (
                                p.metodoUsado === "NO_ESPECIFICADO" ? (
                                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-black rounded-xl border border-amber-200" title="Orden cerrada pero sin método registrado"><AlertTriangle size={14} /> Audit. Método</span>
                                ) : (
                                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl border border-emerald-200"><CheckCircle size={14} /> Pagado / Cerrado</span>
                                )
                              ) : (
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-black rounded-xl border border-amber-200"><AlertTriangle size={14} /> Por Cobrar</span>
                              )}
                            </td>
                            <td className="px-8 py-5 text-right whitespace-nowrap">
                              <span className="text-lg font-extrabold text-[#111827] block">{formatMoney(p.totalUSD)}</span>
                              <span className="text-xs font-bold text-slate-400 block mt-0.5">{formatMoney(p.totalBS, true)}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPaginas > 1 && (
                  <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500">Página <strong className="text-[#111827]">{paginaActual}</strong> de <strong className="text-[#111827]">{totalPaginas}</strong></span>
                    <div className="flex gap-2">
                      <button onClick={() => setPaginaActual(p => Math.max(p - 1, 1))} disabled={paginaActual === 1} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-[#111827] disabled:opacity-40 transition-colors shadow-sm"><ChevronLeft size={18} strokeWidth={2.5}/></button>
                      <button onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))} disabled={paginaActual === totalPaginas} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-[#111827] disabled:opacity-40 transition-colors shadow-sm"><ChevronRight size={18} strokeWidth={2.5}/></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {previewPDF && (
        <ModalPreviewCierrePDF
          tipo={previewPDF}
          dataDiario={previewPDF === "INDIVIDUAL" ? dataIndividual : data}
          tasaBCV={previewPDF === "INDIVIDUAL" ? dataIndividual?.tasaDelDia : (tasaAplicada || 1)}
          historialData={historialFiltrado}
          onClose={() => {
            setPreviewPDF(null);
            setDataIndividual(null);
          }}
        />
      )}
    </div>
  );
}

// COMPONENTE DE TARJETA SUPERIOR CORREGIDO Y COMPACTADO
function StatCard({ title, usd, bs, icon, color, bgColor, isCount, subtitle }: any) {
  return (
    // p-5 en lugar de p-8 para reducir el espacio en blanco vertical y horizontal
    <div className="bg-white p-5 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        {/* mb-3 e h-10 en lugar de mb-6 e h-14 para que el icono sea compacto */}
        <div className={`w-10 h-10 rounded-xl ${bgColor} ${color} flex items-center justify-center mb-3`}>{icon}</div>
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl md:text-3xl font-extrabold text-[#111827] mt-1">
          {isCount ? usd : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd || 0)}
        </h3>
      </div>
      <div className="mt-2 pt-2 border-t border-slate-100">
        <p className="text-xs font-bold text-slate-500">
          {isCount ? subtitle : new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(bs || 0).replace('VES', 'Bs.')}
        </p>
      </div>
    </div>
  );
}

function CustomSelect({ value, onChange, options, className }: { value: string, onChange: (val: string) => void, options: {value: string, label: string}[], className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-600 flex items-center justify-between transition-all hover:bg-slate-100 ${className || 'w-full lg:w-48 min-w-[200px]'}`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${value === opt.value ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}