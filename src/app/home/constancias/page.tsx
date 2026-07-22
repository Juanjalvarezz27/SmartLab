"use client";

import { useState, useEffect, Fragment } from "react";
import dynamic from "next/dynamic";
import { Search, FileBadge, Calendar, ChevronLeft, ChevronRight, FileText, Activity, User, ChevronDown, ChevronUp, History, MessageCircle } from "lucide-react";
import { toast } from "react-toastify";
const ModalConstancia = dynamic(() => import("../../components/constancias/ModalConstancia"), { ssr: false });
import ModalAsistenteWhatsApp from "../../components/ModalAsistenteWhatsApp";
import { normalizeSearchString } from "../../../lib/stringUtils";

export default function ConstanciasPage() {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const [busqueda, setBusqueda] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState<string>(""); 
  
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 30;

  const [ordenSeleccionada, setOrdenSeleccionada] = useState<any | null>(null);
  const [pacienteExpandido, setPacienteExpandido] = useState<string | null>(null);
  const [whatsAppModalConfig, setWhatsAppModalConfig] = useState<{isOpen: boolean, paciente: any} | null>(null);

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
      toast.error(error?.message ? `Error al cargar el historial de órdenes.: ${error?.message}` : "Error al cargar el historial de órdenes.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrdenes(busqueda, fechaFiltro);
    }, 400);
    return () => clearTimeout(timer);
  }, [busqueda, fechaFiltro]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, fechaFiltro]);

  // 1. AGRUPAR ÓRDENES POR PACIENTE
  const pacientesMap = new Map();
  ordenes.forEach(orden => {
    const pid = orden.paciente.id;
    if (!pacientesMap.has(pid)) {
      pacientesMap.set(pid, {
        paciente: orden.paciente,
        ordenes: []
      });
    }
    pacientesMap.get(pid).ordenes.push(orden);
  });

  const pacientesAgrupados = Array.from(pacientesMap.values());

  // 2. LÓGICA DE FILTRADO COMBINADO
  const pacientesFiltrados = pacientesAgrupados.filter(grupo => {
    if (fechaFiltro) {
      const tieneOrdenEnFecha = grupo.ordenes.some((o: any) => {
        const fechaOrden = new Date(o.fechaCreacion).toLocaleDateString('en-CA', { timeZone: 'America/Caracas' });
        return fechaOrden === fechaFiltro;
      });
      if (!tieneOrdenEnFecha) return false;
    }

    if (busqueda) {
      const b = normalizeSearchString(busqueda);
      const coincidePaciente = 
        normalizeSearchString(grupo.paciente.nombreCompleto).includes(b) ||
        (grupo.paciente.cedula && normalizeSearchString(grupo.paciente.cedula).includes(b));
      
      const coincideOrden = grupo.ordenes.some((o: any) => o.id.toString().includes(b));
      
      return coincidePaciente || coincideOrden;
    }

    return true;
  });

  // 3. ORDENAR
  pacientesFiltrados.sort((a, b) => a.paciente.nombreCompleto.localeCompare(b.paciente.nombreCompleto));
  pacientesFiltrados.forEach(grupo => {
    grupo.ordenes.sort((a: any, b: any) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  });

  // 4. LÓGICA DE PAGINACIÓN
  const totalPaginas = Math.ceil(pacientesFiltrados.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const pacientesPaginados = pacientesFiltrados.slice(indicePrimerItem, indiceUltimoItem);

  const formatFecha = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: '2-digit' });
  };

  const toggleExpandir = (pacienteId: string) => {
    setPacienteExpandido(pacienteExpandido === pacienteId ? null : pacienteId);
  };

  const enviarWhatsAppContacto = (e: React.MouseEvent, paciente: any) => {
    e.stopPropagation(); // Evita que se abra/cierre la fila
    if (!paciente.telefono) {
      toast.warning("El paciente no tiene un número de teléfono registrado.");
      return;
    }
    setWhatsAppModalConfig({ isOpen: true, paciente });
  };

  return (
    <div className="h-full flex flex-col pb-10 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">

      {ordenSeleccionada && (
        <ModalConstancia
          orden={ordenSeleccionada}
          onClose={() => setOrdenSeleccionada(null)}
        />
      )}

      {/* CABECERA */}
      <div className="mb-8">
        <h1 className="font-title text-4xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
          <FileBadge className="text-[#0071E3]" size={36} strokeWidth={2.5} />
          Emisión de Constancias
        </h1>
        <p className="text-[#86868B] mt-2 font-medium text-[15px]">
          Genera e imprime comprobantes de asistencia estructurados por paciente y fecha.
        </p>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm mb-6 flex flex-col xl:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col md:flex-row gap-4 w-full xl:flex-1">
          {/* BUSCADOR */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por paciente, cédula o N° de orden..."
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
              className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-[15px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all cursor-pointer"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 text-slate-500 font-bold text-sm bg-slate-100 px-4 py-3 rounded-xl shrink-0">
          <Activity size={18} /> Total Pacientes: {pacientesFiltrados.length}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL: TABLA AGRUPADA */}
      <div className="bg-white border border-slate-200/80 rounded-[24px] shadow-sm overflow-visible pb-10">
        <div className="overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100/50">
              <tr className="border-b-2 border-slate-200">
                <th className="px-6 py-5 text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.15em] align-middle">Paciente</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.15em] align-middle">Identificación</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.15em] align-middle text-center">Total Visitas</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.15em] align-middle">Última Visita</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.15em] text-center align-middle">Acción</th>
              </tr>
            </thead>
            <tbody className="">
              {cargando ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400 font-medium">Cargando historial de pacientes...</td></tr>
              ) : pacientesPaginados.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400 font-medium">No se encontraron pacientes con constancias disponibles.</td></tr>
              ) : (
                pacientesPaginados.map((grupo) => {
                  const isExpanded = pacienteExpandido === grupo.paciente.id;
                  const ultimaOrden = grupo.ordenes[0];

                  return (
                    <Fragment key={grupo.paciente.id}>
                      {/* FILA PRINCIPAL DEL PACIENTE */}
                      <tr 
                        onClick={() => toggleExpandir(grupo.paciente.id)}
                        className={`transition-colors cursor-pointer border-b border-slate-100 ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}`}
                      >
                        {/* PACIENTE */}
                        <td className="px-6 py-4 align-middle">
                          <span className="font-bold text-[15px] leading-tight text-[#1D1D1F] uppercase block">
                            {grupo.paciente.nombreCompleto}
                          </span>
                        </td>
                        
                        {/* CÉDULA */}
                        <td className="px-6 py-4 align-middle">
                          <span className="text-[13px] font-bold text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <User size={16} className="text-[#0071E3]"/> V-{grupo.paciente.cedula || 'S/N'}
                          </span>
                        </td>
                        
                        {/* VISITAS */}
                        <td className="px-6 py-4 align-middle text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1.5 bg-purple-50 text-purple-600 text-[12px] font-black rounded-md border border-purple-100">
                            {grupo.ordenes.length} VISITA(S)
                          </span>
                        </td>

                        {/* ÚLTIMA VISITA */}
                        <td className="px-6 py-4 align-middle">
                          <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-slate-600">
                            <Calendar size={16} className="text-[#0071E3]" />
                            {formatFecha(ultimaOrden.fechaCreacion)}
                          </span>
                        </td>
                        
                        {/* ACCIONES (WHATSAPP + DESPLEGAR) */}
                        <td className="px-6 py-4 align-middle text-center">
                          <div className="flex items-center justify-center gap-2">
                            
                            {/* BOTÓN WHATSAPP */}
                            <div className="relative group/ws flex flex-col items-center">
                              <button 
                                onClick={(e) => enviarWhatsAppContacto(e, grupo.paciente)}
                                className="flex items-center justify-center w-10 h-10 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-full transition-all duration-300 hover:shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:-translate-y-0.5"
                              >
                                <MessageCircle size={18} strokeWidth={2.5} />
                              </button>
                              <div className="absolute -top-10 opacity-0 group-hover/ws:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/ws:-translate-y-1">
                                {grupo.paciente.telefono ? `WS: ${grupo.paciente.telefono}` : "WS: Sin número"}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                              </div>
                            </div>

                            {/* BOTÓN DESPLEGAR */}
                            <button className={`p-2 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isExpanded ? 'bg-[#0071E3] text-white shadow-md shadow-[#0071E3]/20' : 'text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-[#1D1D1F]'}`}>
                              {isExpanded ? <ChevronUp size={20} strokeWidth={2.5}/> : <ChevronDown size={20} strokeWidth={2.5}/>}
                            </button>

                          </div>
                        </td>
                      </tr>

                      {/* PANEL DESPLEGABLE ANIMADO */}
                      <tr>
                        <td colSpan={5} className="p-0 border-none">
                          <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                              <div className="p-6 md:p-8 border-b-2 border-slate-200 bg-[#F8FAFC]">
                                
                                <div className="flex items-center gap-2 mb-5">
                                  <History size={18} strokeWidth={2.5} className="text-slate-400" />
                                  <h4 className="text-[13px] font-black text-slate-500 uppercase tracking-widest">
                                    Historial Médico • {grupo.paciente.nombreCompleto}
                                 </h4>
                                </div>

                                <div className="bg-white border border-slate-200/80 rounded-[20px] shadow-sm overflow-hidden">
                                  <table className="w-full text-left">
                                    <thead className="bg-[#F5F5F7]">
                                      <tr>
                                        <th className="px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-wider">Orden N°</th>
                                        <th className="px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-wider">Fecha de Atención</th>
                                        <th className="px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-wider">Exámenes Realizados</th>
                                        <th className="px-6 py-4 text-[12px] font-black text-[#0071E3] uppercase tracking-wider text-right">Constancia</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {grupo.ordenes.map((orden: any) => (
                                        <tr key={orden.id} className="hover:bg-slate-50/50 transition-colors">
                                          
                                          <td className="px-6 py-4 align-middle">
                                            <span className="text-[14px] font-black text-[#1D1D1F]">
                                              #{orden.id.toString().padStart(5, '0')}
                                            </span>
                                          </td>
                                          
                                          <td className="px-6 py-4 align-middle">
                                            <span className="text-[14px] font-bold text-slate-600">
                                              {formatFecha(orden.fechaCreacion)}
                                            </span>
                                          </td>
                                          
                                          <td className="px-6 py-4 align-middle">
                                            <span className="text-[13px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                                              {orden.examenesResumen ? orden.examenesResumen.length : 0} Exámen(es) procesados
                                            </span>
                                          </td>
                                          
                                          <td className="px-6 py-4 align-middle flex justify-end">
                                            <div className="relative group/btn flex flex-col items-center">
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); setOrdenSeleccionada(orden); }}
                                                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-50 text-[#0071E3] text-[13px] font-bold rounded-lg hover:bg-[#0071E3] hover:text-white transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,113,227,0.3)] hover:-translate-y-0.5"
                                              >
                                                <FileText size={16} strokeWidth={2.5} /> Generar
                                              </button>
                                            </div>
                                          </td>
                                          
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLES DE PAGINACIÓN */}
        {totalPaginas > 1 && (
          <div className="mt-8 mb-4 flex justify-center items-center gap-4 bg-[#F5F5F7] border border-slate-200/80 p-2 rounded-2xl w-fit mx-auto">
            <button
              onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1}
              className="p-2 rounded-xl text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            
            <span className="text-sm font-bold text-slate-600 px-2">
              Página {paginaActual} de {totalPaginas}
            </span>

            <button
              onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
              className="p-2 rounded-xl text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* ModalAsistenteWhatsApp */}
      {whatsAppModalConfig && whatsAppModalConfig.paciente && (
        <ModalAsistenteWhatsApp
          isOpen={whatsAppModalConfig.isOpen}
          onClose={() => setWhatsAppModalConfig(null)}
          pacienteNombre={whatsAppModalConfig.paciente.nombreCompleto}
          telefono={whatsAppModalConfig.paciente.telefono || ""}
          tipoMensaje="contacto"
        />
      )}
    </div>
  );
}