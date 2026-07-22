"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Users, Search, History, Phone, Calendar, ChevronLeft, ChevronRight, 
  Activity, FileText, CheckCircle, Clock, X, Eye, MessageCircle, Lock, Loader2 
} from "lucide-react";
import { toast } from "react-toastify";
const ModalPreviewPDF = dynamic(() => import("../../components/resultados/ModalPreviewPDF"), { ssr: false });
import ModalAsistenteWhatsApp from "../../components/ModalAsistenteWhatsApp";
import { normalizeSearchString } from "../../../lib/stringUtils";

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const [busqueda, setBusqueda] = useState("");
  // Estado de fecha: Vacío ("") significa "TODAS" por defecto
  const [fechaFiltro, setFechaFiltro] = useState<string>(""); 
  
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalResultados, setTotalResultados] = useState(0);
  const itemsPorPagina = 30;

  // Estados para Modales
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any | null>(null);
  const [cargandoHistorialId, setCargandoHistorialId] = useState<string | null>(null);
  const [ordenPDF, setOrdenPDF] = useState<any | null>(null);
  const [whatsAppModalConfig, setWhatsAppModalConfig] = useState<{isOpen: boolean, paciente: any} | null>(null);

  const fetchPacientes = async () => {
    setCargando(true);
    try {
      const query = new URLSearchParams({
        page: paginaActual.toString(),
        limit: itemsPorPagina.toString(),
        q: busqueda,
        fecha: fechaFiltro
      });
      const res = await fetch(`/api/pacientes/directorio?${query.toString()}`);
      if (!res.ok) throw new Error("Error de red");
      
      const responseData = await res.json();
      setPacientes(responseData.data);
      setTotalPaginas(responseData.meta.totalPages);
      setTotalResultados(responseData.meta.total);
    } catch (error: any) {
      toast.error(error?.message ? `Error al cargar la lista de pacientes.: ${error?.message}` : "Error al cargar la lista de pacientes.");
    } finally {
      setCargando(false);
    }
  };

  // Efecto con Debounce para búsqueda
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPacientes();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [busqueda, fechaFiltro, paginaActual]);

  // Reiniciar a la página 1 al buscar o cambiar la fecha
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, fechaFiltro]);

  const fetchHistorialCompleto = async (paciente: any) => {
    setCargandoHistorialId(paciente.id);
    try {
      const res = await fetch(`/api/pacientes/${paciente.id}/historial`);
      if (!res.ok) throw new Error("Error al cargar el historial");
      const data = await res.json();
      setPacienteSeleccionado(data);
    } catch (error: any) {
      toast.error(error?.message || "Ocurrió un error al cargar el historial clínico.");
    } finally {
      setCargandoHistorialId(null);
    }
  };

  const formatFecha = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: '2-digit' });
  };

  const calcularEdad = (fechaNac: string, esBebe: boolean) => {
    if (!fechaNac) return "N/A";
    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return `${edad} ${esBebe ? 'Meses' : 'Años'}`;
  };

  const enviarWhatsAppContacto = (paciente: any) => {
    if (!paciente.telefono) {
      toast.warning("El paciente no tiene un número de teléfono registrado.");
      return;
    }
    setWhatsAppModalConfig({ isOpen: true, paciente });
  };

  return (
    <div className="h-full flex flex-col pb-10 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">

      {/* MODAL DE GENERACIÓN DE PDF */}
      {ordenPDF && (
        <ModalPreviewPDF
          orden={ordenPDF}
          onClose={() => setOrdenPDF(null)}
        />
      )}

      {/* MODAL DEL HISTORIAL CLÍNICO DEL PACIENTE */}
      {pacienteSeleccionado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#1D1D1F]/60 animate-in fade-in duration-200">
          <div className="bg-[#F8FAFC] w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Header del Modal */}
            <div className="bg-white p-6 md:p-8 border-b border-slate-200 flex justify-between items-start shrink-0">
              <div className="flex gap-5 items-center">
                <div className="w-16 h-16 rounded-full bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center shrink-0">
                  <Users size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#1D1D1F] uppercase tracking-tight">{pacienteSeleccionado.nombreCompleto}</h2>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-sm font-bold text-slate-500">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md">C.I: {pacienteSeleccionado.cedula || 'S/N'}</span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md">{calcularEdad(pacienteSeleccionado.fechaNacimiento, pacienteSeleccionado.esBebe)}</span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md">{pacienteSeleccionado.sexo === 'M' ? 'Masculino' : 'Femenino'}</span>
                    {pacienteSeleccionado.telefono && (
                      <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md text-[#0071E3]">
                        <Phone size={14} /> {pacienteSeleccionado.telefono}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setPacienteSeleccionado(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>

            {/* Cuerpo del Modal: Lista de Órdenes */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300">
              
              {pacienteSeleccionado.observaciones && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-5 flex gap-4">
                  <div className="text-amber-500 mt-0.5 shrink-0">
                    <FileText size={24} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[13px] font-black text-amber-800 uppercase tracking-widest mb-1.5">Observaciones del Paciente</h3>
                    <p className="text-sm text-amber-700 font-medium leading-relaxed whitespace-pre-wrap">
                      {pacienteSeleccionado.observaciones}
                    </p>
                  </div>
                </div>
              )}

              <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History size={16} /> Historial de Visitas ({pacienteSeleccionado.ordenes.length})
              </h3>

              {pacienteSeleccionado.ordenes.length === 0 ? (
                <div className="text-center py-10 bg-white border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-slate-500 font-medium">Este paciente no tiene órdenes registradas.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pacienteSeleccionado.ordenes.map((orden: any) => {
                    const estaPagada = orden.estado.nombre === "CERRADA";
                    return (
                      <div key={orden.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-lg font-black text-[#1D1D1F]">Orden #{orden.id.toString().padStart(6, '0')}</span>
                              <span className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                                <Calendar size={14} /> {formatFecha(orden.fechaCreacion)}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Atendido por: {orden.creadoPor?.nombre}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {estaPagada ? (
                              <span className="px-2.5 py-1 bg-emerald-100/80 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-200">PAGADA</span>
                            ) : (
                              <span className="px-2.5 py-1 bg-red-100/80 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-red-200">DEUDA</span>
                            )}
                            
                            {orden.resultadosCompletados ? (
                              <span className="flex items-center gap-1 px-2.5 py-1 bg-[#0071E3]/10 text-[#0071E3] text-[10px] font-bold uppercase tracking-wider rounded-md border border-[#0071E3]/20">
                                <CheckCircle size={10} strokeWidth={3} /> PROCESADO
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-100/80 text-orange-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-orange-200">
                                <Clock size={10} strokeWidth={3} /> PENDIENTE
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-end justify-between gap-4">
                          <div className="w-full">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Exámenes Realizados</p>
                            <div className="flex flex-wrap gap-2">
                              {Array.from(new Set(orden.detalles.map((det: any) => 
                                det.prueba?.subcategoria?.esPaquete ? det.prueba.subcategoria.nombre : det.prueba.nombre
                              ))).map((nombreItem: any, idx: number) => (
                                <span key={idx} className="text-[11px] font-bold text-slate-600 bg-[#F5F5F7] border border-slate-200 px-2.5 py-1 rounded-md">
                                  {nombreItem}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Botón para ver PDF */}
                          {orden.resultadosCompletados && (
                              <button
                                onClick={() => {
                                  if (!estaPagada) {
                                    toast.error("La orden debe estar pagada para ver los resultados.");
                                    return;
                                  }
                                  const loadingId = toast.loading("Cargando resultados...");
                                  fetch(`/api/ordenes/${orden.id}`)
                                    .then(res => res.json())
                                    .then(fullOrden => {
                                      toast.dismiss(loadingId);
                                      if(fullOrden.error) {
                                        toast.error(fullOrden.error);
                                        return;
                                      }
                                      setOrdenPDF(fullOrden);
                                    })
                                    .catch(() => {
                                      toast.dismiss(loadingId);
                                      toast.error("Error al cargar los resultados de la orden.");
                                    });
                                }}
                              className={`shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 font-bold text-sm rounded-xl transition-all shadow-sm ${
                                !estaPagada 
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-slate-100 text-[#0071E3] hover:bg-[#0071E3] hover:text-white'
                              }`}
                            >
                              {!estaPagada ? <><Lock size={16} /> Pago Requerido</> : <><FileText size={16} strokeWidth={2.5} /> Ver Resultados</>}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CABECERA PRINCIPAL */}
      <div className="mb-8">
        <h1 className="font-title text-4xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
          <Users className="text-[#0071E3]" size={36} strokeWidth={2.5} />
          Directorio de Pacientes
        </h1>
        <p className="text-[#86868B] mt-2 font-medium text-[15px]">
          Base de datos general y registro de historiales clínicos.
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
              placeholder="Buscar por nombre, cédula o N° de orden..."
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
              className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-[15px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 text-slate-500 font-bold text-sm bg-slate-100 px-4 py-3 rounded-xl shrink-0">
          <Activity size={18} /> Total: {totalResultados}
        </div>
      </div>

      {/* TABLA DE PACIENTES */}
      <div className="bg-white border border-slate-200/80 rounded-[24px] shadow-sm overflow-visible pb-10">
        <div className="overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100/50">
              <tr className="border-b-2 border-slate-200">
                <th className="px-6 py-5 text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.15em] align-middle">Paciente</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.15em] align-middle">Identificación</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.15em] align-middle">Contacto</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.15em] align-middle">Historial</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.15em] align-middle">Última Visita</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.15em] text-center align-middle">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center gap-2 text-[#0071E3]">
                      <Loader2 size={32} className="animate-spin" />
                      <span className="font-bold text-sm">Cargando directorio...</span>
                    </div>
                  </td>
                </tr>
              ) : pacientes.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400 font-medium">No se encontraron pacientes registrados con los filtros actuales.</td></tr>
              ) : (
                pacientes.map((paciente) => {
                  const numOrdenes = paciente.totalVisitas || 0;
                  const ultimaOrden = paciente.ordenes && paciente.ordenes.length > 0 ? paciente.ordenes[0] : null;
                  
                  return (
                    <tr key={paciente.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      <td className="px-6 py-4 align-middle">
                        <span className="font-bold text-[14px] leading-tight text-[#1D1D1F] uppercase block">
                          {paciente.nombreCompleto}
                        </span>
                        <span className="text-xs font-bold text-slate-400 mt-0.5 block">
                          Edad: {calcularEdad(paciente.fechaNacimiento, paciente.esBebe)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 align-middle">
                        <span className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                          V-{paciente.cedula || 'S/N'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 align-middle">
                        {paciente.telefono ? (
                          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                            <Phone size={14} className="text-[#0071E3]" /> {paciente.telefono}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 font-medium italic">No registrado</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 align-middle">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-purple-50 text-purple-600 text-[11px] font-black rounded-md border border-purple-100 gap-1.5">
                          <History size={12} strokeWidth={3} /> {numOrdenes} VISITA(S)
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 align-middle">
                        {ultimaOrden ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{formatFecha(ultimaOrden.fechaCreacion)}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Orden #{ultimaOrden.id}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">---</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center justify-center gap-2">
                          
                          {/* BOTÓN VER HISTORIAL */}
                          <div className="relative group/ver flex flex-col items-center">
                            <button 
                              onClick={() => fetchHistorialCompleto(paciente)}
                              disabled={cargandoHistorialId === paciente.id}
                              className="flex items-center justify-center w-10 h-10 bg-slate-100 text-[#0071E3] hover:bg-[#0071E3] hover:text-white rounded-xl transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,113,227,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-slate-100 disabled:hover:text-[#0071E3]"
                            >
                              {cargandoHistorialId === paciente.id ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} strokeWidth={2.5} />}
                            </button>
                            <div className="absolute -top-10 opacity-0 group-hover/ver:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/ver:-translate-y-1">
                              Ver Historial
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                            </div>
                          </div>

                          {/* BOTÓN WHATSAPP */}
                          <div className="relative group/ws flex flex-col items-center">
                            <button 
                              onClick={() => enviarWhatsAppContacto(paciente)}
                              className="flex items-center justify-center w-10 h-10 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all duration-300 hover:shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:-translate-y-0.5"
                            >
                              <MessageCircle size={18} strokeWidth={2.5} />
                            </button>
                            <div className="absolute -top-10 opacity-0 group-hover/ws:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/ws:-translate-y-1">
                              {paciente.telefono ? `WS: ${paciente.telefono}` : "WS: Sin número"}
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
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
              disabled={paginaActual === 1 || cargando}
              className="p-2 rounded-xl text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            
            <span className="text-sm font-bold text-slate-600 px-2">
              Página {paginaActual} de {totalPaginas}
            </span>

            <button
              onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas || cargando}
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