"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Microscope, Search, FileEdit, Clock, CheckCircle, FileText, 
  Phone, MessageCircle, User, Calendar, ChevronLeft, ChevronRight, DollarSign, FileSignature, Lock,
  AlertTriangle, X, Loader2
} from "lucide-react";
import { toast } from "react-toastify";
import ModalCargarResultados from "../../components/resultados/ModalCargarResultados";
const ModalPreviewPDF = dynamic(() => import("../../components/resultados/ModalPreviewPDF"), { ssr: false });
import ModalAsistenteWhatsApp from "../../components/ModalAsistenteWhatsApp";
import { normalizeSearchString } from "../../../lib/stringUtils";

const obtenerFechaCaracas = (fecha: string | Date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(new Date(fecha));
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
};

export default function ResultadosPage() {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [resultadosPendientes, setResultadosPendientes] = useState<{ total: number, fechas: number } | null>(null);
  
  // ESTADOS DE FILTROS
  const [busqueda, setBusqueda] = useState("");
  const [tabActiva, setTabActiva] = useState<"PENDIENTES" | "POR_VALIDAR" | "COMPLETADOS">("PENDIENTES");
  const [fechaFiltro, setFechaFiltro] = useState<string>(obtenerFechaCaracas()); 

  // ESTADOS DE PAGINACIÓN
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 30;

  // ESTADOS DE MODALES
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<any | null>(null);
  const [ordenPDF, setOrdenPDF] = useState<any | null>(null);
  const [whatsAppModalConfig, setWhatsAppModalConfig] = useState<{isOpen: boolean, orden: any, tipoMensaje: 'contacto' | 'cobro'} | null>(null);

  // Estado de carga del detalle (Lazy Loading)
  const [cargandoDetalle, setCargandoDetalle] = useState<number | null>(null);

  const fetchOrdenes = async (b = busqueda, f = fechaFiltro) => {
    setCargando(true);
    try {
      const query = new URLSearchParams();
      if (b) query.append("busqueda", b);
      if (f) query.append("fecha", f);
      
      const res = await fetch(`/api/resultados/lista?${query.toString()}`);
      if (!res.ok) throw new Error("Error de red");
      const data = await res.json();
      setOrdenes(data);
    } catch (error: any) {
      toast.error(error?.message ? `Error al cargar las órdenes.: ${error?.message}` : "Error al cargar las órdenes.");
    } finally {
      setCargando(false);
    }
  };

  // Carga el detalle completo de una orden bajo demanda (Lazy Loading)
  const abrirModalConDetalle = async (ordenId: number) => {
    setCargandoDetalle(ordenId);
    try {
      const res = await fetch(`/api/resultados/detalle/${ordenId}`);
      if (!res.ok) throw new Error("No se pudo cargar el detalle de la orden.");
      const detalle = await res.json();
      setOrdenSeleccionada(detalle);
    } catch (error: any) {
      toast.error(error?.message || "Error al cargar el detalle de la orden.");
    } finally {
      setCargandoDetalle(null);
    }
  };

  // Carga el detalle completo para el PDF bajo demanda
  const abrirPDFConDetalle = async (ordenId: number) => {
    setCargandoDetalle(ordenId);
    try {
      const res = await fetch(`/api/resultados/detalle/${ordenId}`);
      if (!res.ok) throw new Error("No se pudo cargar el detalle para el PDF.");
      const detalle = await res.json();
      setOrdenPDF(detalle);
    } catch (error: any) {
      toast.error(error?.message || "Error al cargar el detalle para el PDF.");
    } finally {
      setCargandoDetalle(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrdenes(busqueda, fechaFiltro);
    }, 400);
    return () => clearTimeout(timer);
  }, [busqueda, fechaFiltro]);

  useEffect(() => {
    const fetchResultadosPendientes = async () => {
      try {
        const res = await fetch('/api/resultados/pendientes');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const fechasUnicas = new Set(data.map((o: any) => o.fechaCreacion.split('T')[0])).size;
            setResultadosPendientes({ total: data.length, fechas: fechasUnicas });
          } else {
            setResultadosPendientes(null);
          }
        }
      } catch (error) {
        console.error("Error fetching resultados pendientes:", error);
      }
    };
    fetchResultadosPendientes();
  }, [ordenes]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, tabActiva, fechaFiltro]);

  // Filtro usando el tabStatus calculado en el servidor — sin lógica pesada en el cliente
  const ordenesFiltradas = ordenes.filter(orden => {
    if (tabActiva === "PENDIENTES" && orden.tabStatus !== "PENDIENTES") return false;
    if (tabActiva === "POR_VALIDAR" && orden.tabStatus !== "POR_VALIDAR") return false;
    if (tabActiva === "COMPLETADOS" && orden.tabStatus !== "COMPLETADOS") return false;

    if (busqueda) {
      const b = normalizeSearchString(busqueda);
      const coincide = 
        normalizeSearchString(orden.paciente.nombreCompleto).includes(b) ||
        (orden.paciente.cedula && normalizeSearchString(orden.paciente.cedula).includes(b)) ||
        normalizeSearchString(orden.id.toString()).includes(b);
      if (!coincide) return false;
    }

    return true;
  });

  const totalPaginas = Math.ceil(ordenesFiltradas.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const ordenesPaginadas = ordenesFiltradas.slice(indicePrimerItem, indiceUltimoItem);

  const formatWhatsAppNumber = (phone: string) => {
    if (!phone) return "";
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) return "58" + cleaned.substring(1);
    if (!cleaned.startsWith("58")) return "58" + cleaned;
    return cleaned;
  };

  const enviarWhatsAppContacto = (orden: any) => {
    if (!orden.paciente.telefono) {
      toast.warning("El paciente no tiene un número de teléfono registrado.");
      return;
    }
    setWhatsAppModalConfig({ isOpen: true, orden, tipoMensaje: 'contacto' });
  };

  const enviarWhatsAppCobro = (orden: any) => {
    if (!orden.paciente.telefono) {
      toast.warning("El paciente no tiene un número de teléfono registrado.");
      return;
    }
    setWhatsAppModalConfig({ isOpen: true, orden, tipoMensaje: 'cobro' });
  };

  return (
    <div className="h-full flex flex-col pb-10 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">

      {ordenSeleccionada && (
        <ModalCargarResultados
          orden={ordenSeleccionada}
          onClose={() => setOrdenSeleccionada(null)}
          onSuccess={(cerrar = true) => {
            if (cerrar) setOrdenSeleccionada(null); 
            fetchOrdenes(); 
          }}
        />
      )}

      {ordenPDF && (
        <ModalPreviewPDF
          orden={ordenPDF}
          onClose={() => setOrdenPDF(null)}
        />
      )}

      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-title text-4xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
            <Microscope className="text-[#0071E3]" size={36} strokeWidth={2.5} />
            Módulo de Resultados
          </h1>
          <p className="text-[#86868B] mt-2 font-medium text-[15px]">
            Gestión, transcripción y auditoría de exámenes de laboratorio.
          </p>
        </div>

        {resultadosPendientes && (
          <div 
            className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-amber-700 shadow-sm cursor-pointer hover:bg-amber-100 transition-colors animate-in fade-in max-w-fit md:self-end"
            onClick={() => {
              setFechaFiltro("");
              setTabActiva("PENDIENTES");
              toast.info("Mostrando todas las órdenes con resultados pendientes de cualquier fecha.");
            }}
            title="Haga clic para ver todas las órdenes con resultados pendientes de cualquier fecha"
          >
            <AlertTriangle size={20} className="animate-pulse shrink-0 text-amber-600" />
            <div className="flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase tracking-wide leading-none text-amber-600/80 mb-0.5">Pendientes de Carga</span>
              <span className="text-xs font-black leading-none">{resultadosPendientes.total} órdenes en {resultadosPendientes.fechas} {resultadosPendientes.fechas === 1 ? 'día' : 'días'}</span>
            </div>
          </div>
        )}
      </div>

      {/* BARRA DE FILTROS SUPERIOR */}
      <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm mb-6 flex flex-col xl:flex-row gap-4 justify-between items-center">
        
        <div className="flex flex-col md:flex-row gap-4 w-full xl:flex-1">
          {/* BUSCADOR */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar paciente o N° de orden..."
              className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
            />
          </div>

          {/* FILTRO DE FECHA */}
          <div className="relative w-full md:w-[220px]">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-[15px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all cursor-pointer"
            />
            {fechaFiltro && (
              <button 
                onClick={() => setFechaFiltro("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                title="Limpiar filtro de fecha"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* TABS DE ESTADO */}
        <div className="flex bg-[#F5F5F7] p-1.5 rounded-xl w-full xl:w-[500px] shrink-0">
          <button
            onClick={() => setTabActiva("PENDIENTES")}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              tabActiva === "PENDIENTES" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <Clock size={16} /> Pendientes
          </button>
          <button
            onClick={() => setTabActiva("POR_VALIDAR")}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              tabActiva === "POR_VALIDAR" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <FileSignature size={16} /> Por Validar
          </button>
          <button
            onClick={() => setTabActiva("COMPLETADOS")}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              tabActiva === "COMPLETADOS" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <CheckCircle size={16} /> Completados
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {cargando ? (
        <div className="text-center py-20 text-slate-400 font-bold flex flex-col items-center gap-3">
          <Microscope className="animate-pulse text-[#0071E3]" size={40} />
          Cargando bandeja de resultados...
        </div>
      ) : ordenesPaginadas.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-16 flex flex-col items-center justify-center text-center">
          {tabActiva === "PENDIENTES" ? (
            <>
              <CheckCircle size={48} className="text-emerald-400 mb-4" strokeWidth={2} />
              <h3 className="text-xl font-bold text-[#1D1D1F]">¡Bandeja Limpia!</h3>
              <p className="text-slate-500 mt-1 font-medium">
                {fechaFiltro ? "No hay exámenes pendientes para la fecha seleccionada." : "No hay exámenes pendientes por transcribir en el sistema."}
              </p>
            </>
          ) : tabActiva === "POR_VALIDAR" ? (
            <>
              <CheckCircle size={48} className="text-blue-400 mb-4" strokeWidth={2} />
              <h3 className="text-xl font-bold text-[#1D1D1F]">Todo Validado</h3>
              <p className="text-slate-500 mt-1 font-medium">
                {fechaFiltro ? "No hay exámenes esperando firma en la fecha seleccionada." : "No hay exámenes transcritos esperando validación médica."}
              </p>
            </>
          ) : (
            <>
              <FileText size={48} className="text-slate-300 mb-4" strokeWidth={2} />
              <h3 className="text-xl font-bold text-[#1D1D1F]">Sin Historial</h3>
              <p className="text-slate-500 mt-1 font-medium">
                {fechaFiltro ? "No se completaron resultados en la fecha seleccionada." : "Aún no se han completado resultados en el sistema."}
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {ordenesPaginadas.map((orden) => {
              const estaPagada = orden.estado.nombre === "CERRADA";
              const estaCargandoEsteDetalle = cargandoDetalle === orden.id;

              return (
                <div key={orden.id} className="bg-white border border-slate-200/80 rounded-[24px] shadow-sm hover:shadow-md transition-all flex flex-col">
                  
                  {/* CABECERA DE LA TARJETA */}
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-[24px] flex justify-between items-center shrink-0">
                    <span className="text-[14px] font-bold text-slate-500 tracking-tight">
                      #{orden.id.toString().padStart(5, '0')}
                    </span>

                    <div className="flex gap-2">
                      {estaPagada ? (
                        <span className="px-2.5 py-1 bg-emerald-100/80 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-200">
                          Pagada
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-red-100/80 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-red-200">
                          Deuda
                        </span>
                      )}

                      {tabActiva === "PENDIENTES" && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-100/80 text-orange-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-orange-200">
                          <Clock size={10} strokeWidth={3} /> Esperando
                        </span>
                      )}
                      {tabActiva === "POR_VALIDAR" && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-100/80 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-200">
                          <FileSignature size={10} strokeWidth={3} /> Falta Firma
                        </span>
                      )}
                      {tabActiva === "COMPLETADOS" && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-[#0071E3]/10 text-[#0071E3] text-[10px] font-bold uppercase tracking-wider rounded-md border border-[#0071E3]/20">
                          <CheckCircle size={10} strokeWidth={3} /> Procesado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CUERPO DE LA TARJETA */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-black text-[#1D1D1F] leading-tight mb-2 uppercase">{orden.paciente.nombreCompleto}</h3>

                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                        <User size={14} className="text-[#0071E3]" strokeWidth={2.5} />
                        <span>{orden.paciente.cedula || 'N/A'}</span>
                      </div>
                      <span className="text-slate-300 font-black">•</span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                        <Phone size={14} className="text-[#0071E3]" strokeWidth={2.5} />
                        <span>{orden.paciente.telefono || 'Sin teléfono'}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-5">
                      <hr className="border-t-2 border-dashed border-slate-200 mb-5" />
                      
                      {/* Chips de exámenes — usando el resumen ligero del servidor */}
                      <div className="bg-[#F5F5F7] rounded-[16px] p-4 border border-slate-200/60">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Exámenes Solicitados</p>
                        <div className="flex flex-wrap gap-2">
                          {(orden.examenesResumen || []).slice(0, 4).map((tag: any) => (
                            <span 
                              key={tag.id} 
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm border ${
                                tag.esPaquete 
                                  ? 'bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/20' 
                                  : 'bg-white text-slate-600 border-slate-200/80'
                              }`}
                            >
                              {tag.nombre}
                            </span>
                          ))}
                          {(orden.examenesResumen || []).length > 4 && (
                            <span className="text-[11px] font-bold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-md">
                              +{orden.examenesResumen.length - 4} más
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACCIONES DE LA TARJETA */}
                  <div className="p-5 pt-0 flex items-center gap-3">
                    
                    <button
                      onClick={() => {
                        if (!estaPagada) {
                          toast.error("La orden debe estar pagada para gestionar los resultados.");
                          return;
                        }
                        abrirModalConDetalle(orden.id);
                      }}
                      disabled={estaCargandoEsteDetalle}
                      className={`flex-1 h-[46px] text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                        estaCargandoEsteDetalle
                          ? 'bg-slate-100 text-slate-400 cursor-wait'
                          : !estaPagada
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : tabActiva === "PENDIENTES"
                          ? 'bg-[#0071E3] text-white hover:bg-[#0077ED] shadow-sm hover:shadow-[0_4px_12px_rgba(0,113,227,0.3)] hover:-translate-y-0.5'
                          : tabActiva === "POR_VALIDAR"
                          ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:-translate-y-0.5'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:-translate-y-0.5'
                      }`}
                    >
                      {estaCargandoEsteDetalle ? (
                        <><Loader2 size={16} className="animate-spin" /> Cargando...</>
                      ) : !estaPagada ? (
                        <><Lock size={16} /> Pago Requerido</>
                      ) : (
                        <>
                          {tabActiva === "PENDIENTES" && <><FileEdit size={16} /> Ingresar Resultados</>}
                          {tabActiva === "POR_VALIDAR" && <><FileSignature size={16} /> Validar y Firmar</>}
                          {tabActiva === "COMPLETADOS" && <><FileEdit size={16} /> Revisar / Editar</>}
                        </>
                      )}
                    </button>

                    <div className="relative group/ws shrink-0 flex flex-col items-center justify-center">
                      <button
                        onClick={() => enviarWhatsAppContacto(orden)}
                        className="flex items-center justify-center w-[46px] h-[46px] bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all duration-300 hover:shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:-translate-y-0.5"
                      >
                        <MessageCircle size={20} strokeWidth={2.5} />
                      </button>
                      <div className="absolute -top-11 opacity-0 group-hover/ws:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/ws:-translate-y-1">
                        {orden.paciente.telefono ? `WS: ${orden.paciente.telefono}` : "WS: Sin número"}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                      </div>
                    </div>

                    {tabActiva === "COMPLETADOS" && (
                      <>
                        {!estaPagada ? (
                          <div className="relative group/cobro shrink-0 flex flex-col items-center justify-center">
                            <button
                              onClick={() => enviarWhatsAppCobro(orden)}
                              className="flex items-center justify-center w-[46px] h-[46px] bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white rounded-xl transition-all duration-300 hover:shadow-[0_4px_12px_rgba(249,115,22,0.3)] hover:-translate-y-0.5"
                            >
                              <DollarSign size={20} strokeWidth={2.5} />
                            </button>
                            <div className="absolute -top-11 opacity-0 group-hover/cobro:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/cobro:-translate-y-1">
                              Cobrar (WS)
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group/pdf shrink-0 flex flex-col items-center justify-center">
                            <button
                              onClick={() => abrirPDFConDetalle(orden.id)}
                              disabled={estaCargandoEsteDetalle}
                              className="flex items-center justify-center w-[46px] h-[46px] bg-slate-100 text-[#0071E3] hover:bg-[#0071E3] hover:text-white rounded-xl transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,113,227,0.3)] hover:-translate-y-0.5 disabled:opacity-50"
                            >
                              {estaCargandoEsteDetalle ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} strokeWidth={2.5} />}
                            </button>
                            <div className="absolute -top-11 opacity-0 group-hover/pdf:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/pdf:-translate-y-1">
                              Generar PDF
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          {/* CONTROLES DE PAGINACIÓN */}
          {totalPaginas > 1 && (
            <div className="mt-8 flex justify-center items-center gap-4 bg-white border border-slate-200/80 p-3 rounded-2xl shadow-sm w-fit mx-auto">
              <button
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              
              <span className="text-sm font-bold text-slate-600 px-4">
                Página {paginaActual} de {totalPaginas}
              </span>

              <button
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </>
      )}
      {/* ModalAsistenteWhatsApp */}
      {whatsAppModalConfig && whatsAppModalConfig.orden && (
        <ModalAsistenteWhatsApp
          isOpen={whatsAppModalConfig.isOpen}
          onClose={() => setWhatsAppModalConfig(null)}
          pacienteNombre={whatsAppModalConfig.orden.paciente.nombreCompleto}
          telefono={whatsAppModalConfig.orden.paciente.telefono || ""}
          tipoMensaje={whatsAppModalConfig.tipoMensaje}
          datosAdicionales={{
            montoUSD: whatsAppModalConfig.tipoMensaje === 'cobro' ? whatsAppModalConfig.orden.totalUSD : undefined,
            montoBS: whatsAppModalConfig.tipoMensaje === 'cobro' ? whatsAppModalConfig.orden.totalBS : undefined,
            ordenId: whatsAppModalConfig.orden.id
          }}
        />
      )}

    </div>
  );
}