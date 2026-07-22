"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Calendar as CalendarIcon, Search, Eye, Edit, Ban, 
  DollarSign, Clock, CheckCircle, Wallet, RefreshCw, KeyRound, Loader2, X, MessageCircle, AlertTriangle 
} from "lucide-react";
import { toast } from "react-toastify";

import ModalDetalleOrden from "../../components/diaria/ModalDetalleOrden";
import ModalProcesarPago from "../../components/diaria/ModalProcesarPago";
import ModalAsistenteWhatsApp from "../../components/ModalAsistenteWhatsApp";
import { normalizeSearchString } from "../../../lib/stringUtils";

const obtenerFechaHoyVzla = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' });
};

function ListaDiariaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fechaUrl = searchParams.get('fecha');
  const searchUrl = searchParams.get('search');

  const [fecha, setFecha] = useState(fechaUrl || obtenerFechaHoyVzla());
  const [globalPendientes, setGlobalPendientes] = useState<{ total: number, fechas: number } | null>(null);

  useEffect(() => {
    const fetchPendientesGlobal = async () => {
      try {
        const res = await fetch('/api/ordenes/pendientes');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const fechasUnicas = new Set(data.map((o: any) => o.fechaCreacion.split('T')[0])).size;
            setGlobalPendientes({ total: data.length, fechas: fechasUnicas });
          } else {
            setGlobalPendientes(null);
          }
        }
      } catch (error) {
        console.error("Error fetching global pendientes:", error);
      }
    };
    fetchPendientesGlobal();
  }, [fecha]); // Recargar al cambiar de fecha por si se procesó un pago

  useEffect(() => {
    if (fechaUrl) {
      setFecha(fechaUrl);
    }
  }, [fechaUrl]);
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState<number | null>(null); // ID de la orden cuyo detalle está cargando
  
  // Estados para Modales
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<any | null>(null);
  const [ordenParaPagar, setOrdenParaPagar] = useState<any | null>(null);
  const [whatsAppModalConfig, setWhatsAppModalConfig] = useState<{isOpen: boolean, orden: any} | null>(null);

  // Estados para Clave Maestra (Anular/Activar)
  const [modalClave, setModalClave] = useState<{ visible: boolean, ordenId: number | null, accion: "ANULAR" | "ACTIVAR", estadoDestino: string }>({
    visible: false, ordenId: null, accion: "ANULAR", estadoDestino: ""
  });
  const [claveInput, setClaveInput] = useState("");
  const [procesandoClave, setProcesandoClave] = useState(false);

  const [busqueda, setBusqueda] = useState(searchUrl || "");
  const [filtroEstado, setFiltroEstado] = useState<"TODAS" | "BORRADOR" | "CERRADA" | "ANULADA">("TODAS");

  const fetchOrdenes = async () => {
    setCargando(true);
    try {
      const res = await fetch(`/api/ordenes/diarias?fecha=${fecha}`);
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setOrdenes(data);
    } catch (error: any) {
      toast.error(error?.message ? `Error al cargar las órdenes del día: ${error?.message}` : "Error al cargar las órdenes del día");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchOrdenes();
  }, [fecha]);


  // Función reutilizable para cargar el detalle completo de una orden bajo demanda
  const cargarDetalleOrden = async (ordenId: number): Promise<any | null> => {
    setCargandoDetalle(ordenId);
    try {
      const res = await fetch(`/api/ordenes/${ordenId}`);
      if (!res.ok) throw new Error("No se pudo cargar el detalle de la orden.");
      return await res.json();
    } catch (error: any) {
      toast.error(error?.message || "Error al cargar el detalle de la orden.");
      return null;
    } finally {
      setCargandoDetalle(null);
    }
  };

  // Lazy-load: carga el detalle completo antes de abrir el modal de detalle
  const abrirModalDetalle = async (ordenId: number) => {
    const detalle = await cargarDetalleOrden(ordenId);
    if (detalle) setOrdenSeleccionada(detalle);
  };

  // Lazy-load: carga el detalle completo antes de abrir el modal de pago
  const abrirModalPago = async (ordenId: number) => {
    const detalle = await cargarDetalleOrden(ordenId);
    if (detalle) setOrdenParaPagar(detalle);
  };

  // Si venimos de un link con ?search=X, cargamos el detalle y abrimos el modal automáticamente
  useEffect(() => {
    if (searchUrl && ordenes.length > 0 && !ordenSeleccionada) {
      const ordenBuscada = ordenes.find(o => o.id.toString() === searchUrl);
      if (ordenBuscada) {
        abrirModalDetalle(ordenBuscada.id);
      }
    }
  }, [searchUrl, ordenes]);


  const ordenesFiltradas = ordenes.filter(orden => {
    const cumpleEstado = filtroEstado === "TODAS" || orden.estado.nombre === filtroEstado;
    const busquedaLower = normalizeSearchString(busqueda);
    const cumpleBusqueda = 
      normalizeSearchString(orden.paciente.nombreCompleto).includes(busquedaLower) ||
      (orden.paciente.cedula && normalizeSearchString(orden.paciente.cedula).includes(busquedaLower)) ||
      normalizeSearchString(orden.id.toString()).includes(busquedaLower);
    
    return cumpleEstado && cumpleBusqueda;
  });

  const totalIngresosUSD = ordenes.filter(o => o.estado.nombre === "CERRADA").reduce((acc, o) => acc + o.totalUSD, 0);
  const totalIngresosBS = ordenes.filter(o => o.estado.nombre === "CERRADA").reduce((acc, o) => acc + o.totalBS, 0);
  const totalBorradores = ordenes.filter(o => o.estado.nombre === "BORRADOR").length;
  const ordenesCerradas = ordenes.filter(o => o.estado.nombre === "CERRADA").length;

  const abrirModalEdicion = (ordenId: number) => {
    router.push(`/home/registro?edit=${ordenId}`);
  };

  // --- LÓGICA DE WHATSAPP ---
  const enviarWhatsApp = (orden: any) => {
    if (!orden.paciente.telefono) {
      toast.warning("El paciente no tiene un número de teléfono registrado.");
      return;
    }
    setWhatsAppModalConfig({ isOpen: true, orden });
  };

  // --- LÓGICA DE ANULAR / ACTIVAR ---
  const pedirClave = (ordenId: number, accion: "ANULAR" | "ACTIVAR") => {
    const orden = ordenes.find(o => o.id === ordenId);
    // La lista liviana trae pagos con solo montoUSD, así que verificamos si la suma > 0
    const tienePagos = orden?.pagos?.reduce((acc: number, p: any) => acc + p.montoUSD, 0) > 0;
    const estadoDestino = accion === "ANULAR" ? "ANULADA" : (tienePagos ? "CERRADA" : "BORRADOR");
    
    setClaveInput("");
    setModalClave({ visible: true, ordenId, accion, estadoDestino });
  };

  const ejecutarCambioEstado = async () => {
    if (!claveInput) {
      toast.warning("Debe ingresar la clave maestra.");
      return;
    }
    setProcesandoClave(true);
    try {
      const res = await fetch(`/api/ordenes/${modalClave.ordenId}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave: claveInput, estadoDestino: modalClave.estadoDestino })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Orden ${modalClave.accion === "ANULAR" ? 'anulada' : 'restaurada'} exitosamente.`);
      setModalClave({ visible: false, ordenId: null, accion: "ANULAR", estadoDestino: "" });
      fetchOrdenes(); // Recargamos la tabla para refrescar los montos
    } catch (error: any) {
      toast.error(error.message ? `Error al procesar la solicitud.: ${error.message}` : "Error al procesar la solicitud.");
    } finally {
      setProcesandoClave(false);
    }
  };

  return (
    <div className="h-full flex flex-col pb-10 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
      
      {/* Modales de Detalles y Pagos */}
      {ordenSeleccionada && (
        <ModalDetalleOrden 
          orden={ordenSeleccionada} 
          onClose={() => setOrdenSeleccionada(null)} 
        />
      )}
      {ordenParaPagar && (
        <ModalProcesarPago 
          orden={ordenParaPagar} 
          onClose={() => setOrdenParaPagar(null)} 
          onSuccess={() => { setOrdenParaPagar(null); fetchOrdenes(); }} 
        />
      )}

      {/* MODAL DE CLAVE MAESTRA */}
      {modalClave.visible && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-[#1D1D1F]/60" onClick={() => setModalClave({ ...modalClave, visible: false })}></div>
          <div className="relative w-full max-w-sm bg-white rounded-[24px] shadow-2xl p-6 flex flex-col items-center animate-in zoom-in-95 duration-300">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${modalClave.accion === "ANULAR" ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-[#0071E3]'}`}>
              <KeyRound size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-black text-[#1D1D1F] text-center mb-1">Se requiere autorización</h3>
            <p className="text-sm font-medium text-slate-500 text-center mb-6">
              Ingrese la clave maestra para <span className="font-bold text-[#1D1D1F]">{modalClave.accion.toLowerCase()}</span> esta orden.
            </p>
            
            <input 
              type="password" 
              placeholder="Clave..." 
              value={claveInput}
              onChange={(e) => setClaveInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ejecutarCambioEstado()}
              className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200 rounded-xl text-center text-lg font-black outline-none focus:ring-2 focus:ring-[#0071E3]/20 mb-6"
              autoFocus
            />

            <div className="flex gap-3 w-full">
              <button onClick={() => setModalClave({ ...modalClave, visible: false })} disabled={procesandoClave} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Cancelar
              </button>
              <button onClick={ejecutarCambioEstado} disabled={procesandoClave} className={`flex-1 py-3 text-sm font-bold text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${modalClave.accion === "ANULAR" ? 'bg-red-500 hover:bg-red-600' : 'bg-[#0071E3] hover:bg-[#0077ED]'}`}>
                {procesandoClave ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CABECERA Y FECHA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-title text-4xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
            <CalendarIcon className="text-[#0071E3]" size={36} strokeWidth={2.5} />
            Lista Diaria
          </h1>
          <p className="text-[#86868B] mt-2 font-medium text-[15px]">Gestión y monitoreo de órdenes del día.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {globalPendientes && (
            <div 
              className="hidden md:flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2 rounded-xl text-red-600 shadow-sm cursor-pointer hover:bg-red-100 transition-colors animate-in fade-in"
              onClick={() => router.push('/home')}
              title="Ir al inicio para ver las órdenes pendientes"
            >
              <AlertTriangle size={18} className="animate-pulse shrink-0" />
              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wide leading-none text-red-500/80 mb-0.5">Alertas Pendientes</span>
                <span className="text-xs font-black leading-none">{globalPendientes.total} órdenes en {globalPendientes.fechas} {globalPendientes.fechas === 1 ? 'día' : 'días'}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 bg-white border border-slate-200/80 p-2 rounded-2xl shadow-sm">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-3">Fecha:</span>
            <input 
              type="date" 
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="bg-[#F5F5F7] text-[#1D1D1F] font-bold px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3]/20 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* MÉTRICAS (Kpis) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
            <DollarSign size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ingreso Cerrado</p>
            <h3 className="text-3xl font-black text-[#1D1D1F] leading-none mb-1.5">${totalIngresosUSD.toFixed(2)}</h3>
            <p className="text-sm font-bold text-slate-500">
              Bs {totalIngresosBS.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <CheckCircle size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Órdenes Cerradas</p>
            <h3 className="text-4xl font-black text-[#1D1D1F] leading-none">{ordenesCerradas}</h3>
          </div>
        </div>

        <div className={`relative border rounded-[24px] p-6 flex items-center gap-5 transition-all duration-500 overflow-hidden ${
          totalBorradores > 0 
            ? "bg-gradient-to-br from-red-500 to-orange-500 border-transparent shadow-[0_10px_30px_rgba(239,68,68,0.4)] scale-[1.03]" 
            : "bg-white border-slate-200/80 shadow-sm"
        }`}>
          
          {/* Fondo animado solo cuando hay pendientes */}
          {totalBorradores > 0 && (
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20 mix-blend-overlay"></div>
          )}
          
          <div className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            totalBorradores > 0 
              ? "bg-white text-red-600 shadow-lg animate-[bounce_2s_infinite]" 
              : "bg-orange-100 text-orange-600"
          }`}>
            <Clock size={28} strokeWidth={2.5} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <p className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${
                totalBorradores > 0 ? "text-white/90" : "text-slate-400"
              }`}>Pendientes Pago</p>
              {totalBorradores > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              )}
            </div>
            
            <h3 className={`text-4xl font-black leading-none transition-colors ${
              totalBorradores > 0 ? "text-white" : "text-[#1D1D1F]"
            }`}>
              {totalBorradores} 
              {totalBorradores > 0 && <span className="text-sm font-bold text-white/80 ml-2">¡ATENCIÓN!</span>}
            </h3>
          </div>
        </div>
      </div>

      {/* CONTROLES Y FILTROS */}
      <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-center">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cédula, paciente o N° Orden..."
              className="w-full pl-12 pr-4 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
            />
          </div>

          <div className="flex bg-[#F5F5F7] p-1 rounded-xl w-full lg:w-auto overflow-x-auto">
            {(["TODAS", "CERRADA", "BORRADOR", "ANULADA"] as const).map(estado => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                  filtroEstado === estado 
                    ? "bg-white text-[#1D1D1F] shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {estado}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TABLA DE ÓRDENES */}
      <div className="bg-white border border-slate-200/80 rounded-[24px] shadow-sm overflow-visible pb-10">
        <div className="overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100/50">
              <tr className="border-b-2 border-slate-200">
                <th className="px-6 py-5 text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.15em] align-middle whitespace-nowrap w-[100px]">N° Orden</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.15em] align-middle min-w-[250px]">Paciente</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.15em] align-middle whitespace-nowrap w-[120px]">Pruebas</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.15em] align-middle whitespace-nowrap w-[150px]">Monto</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.15em] align-middle whitespace-nowrap w-[120px]">Estado</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.15em] text-center align-middle whitespace-nowrap w-[180px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400 font-medium">Cargando órdenes...</td></tr>
              ) : ordenesFiltradas.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400 font-medium">No se encontraron órdenes para esta fecha.</td></tr>
              ) : (
                ordenesFiltradas.map((orden) => (
                  <tr key={orden.id} className={`hover:bg-slate-50/50 transition-colors ${orden.estado.nombre === "ANULADA" ? 'opacity-60 grayscale-[50%]' : ''}`}>
                    
                    <td className="px-6 py-4 align-middle">
                      <span className="text-sm font-black text-[#1D1D1F]">#{orden.id.toString().padStart(5, '0')}</span>
                    </td>
                    
                    <td className="px-6 py-4 align-middle">
                      <div className="flex flex-col justify-center">
                        <span className={`font-bold text-[14px] leading-tight ${orden.estado.nombre === "ANULADA" ? 'text-slate-500 line-through' : 'text-[#1D1D1F]'}`}>
                          {orden.paciente.nombreCompleto}
                        </span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">
                          C.I: {orden.paciente.cedula || 'Sin identificación'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 align-middle">
                      <span className="inline-flex items-center justify-center text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap">
                        {orden._count.detalles} Prueba(s)
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 align-middle">
                      <div className="flex flex-col justify-center">
                        <span className={`font-black leading-tight whitespace-nowrap ${orden.estado.nombre === "ANULADA" ? 'text-slate-400' : 'text-[#0071E3]'}`}>
                          ${orden.totalUSD.toFixed(2)}
                        </span>
                        <span className="text-[13px] font-bold text-slate-500 mt-0.5 whitespace-nowrap">
                          Bs {orden.totalBS.toLocaleString('es-VE', {minimumFractionDigits: 2})}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 align-middle">
                      {orden.estado.nombre === "CERRADA" && <span className="inline-flex items-center justify-center px-3 py-1 bg-green-100 text-green-700 text-[11px] font-bold rounded-md border border-green-200">CERRADA</span>}
                      {orden.estado.nombre === "BORRADOR" && <span className="inline-flex items-center justify-center px-3 py-1 bg-orange-100 text-orange-700 text-[11px] font-bold rounded-md border border-orange-200">PENDIENTE</span>}
                      {orden.estado.nombre === "ANULADA" && <span className="inline-flex items-center justify-center px-3 py-1 bg-red-100 text-red-700 text-[11px] font-bold rounded-md border border-red-200">ANULADA</span>}
                    </td>
                    
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center justify-center gap-2 xl:gap-3">
                        
                        {/* BOTÓN VER DETALLES (con lazy-load spinner) */}
                        <div className="relative group/ver flex flex-col items-center">
                          <button 
                            onClick={() => abrirModalDetalle(orden.id)}
                            disabled={cargandoDetalle === orden.id}
                            className="flex items-center justify-center w-10 h-10 bg-blue-50 text-[#0071E3] hover:bg-[#0071E3] hover:text-white rounded-xl transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,113,227,0.3)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-wait"
                          >
                            {cargandoDetalle === orden.id ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} strokeWidth={2.5} />}
                          </button>
                          <div className="absolute -top-10 opacity-0 group-hover/ver:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/ver:-translate-y-1">
                            Ver Detalles
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                          </div>
                        </div>

                        {/* BOTÓN WHATSAPP (SIEMPRE DISPONIBLE SALVO ANULADA) */}
                        {orden.estado.nombre !== "ANULADA" && (
                          <div className="relative group/ws flex flex-col items-center">
                            <button 
                              onClick={() => enviarWhatsApp(orden)} 
                              className="flex items-center justify-center w-10 h-10 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all duration-300 hover:shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:-translate-y-0.5"
                            >
                              <MessageCircle size={18} strokeWidth={2.5} />
                            </button>
                            <div className="absolute -top-10 opacity-0 group-hover/ws:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/ws:-translate-y-1">
                              {orden.paciente.telefono ? `Contactar ws: ${orden.paciente.telefono}` : "ws: Sin número"}
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                            </div>
                          </div>
                        )}
                        
                        {/* BOTONES PARA BORRADOR */}
                        {orden.estado.nombre === "BORRADOR" && (
                          <>
                            <div className="relative group/edit flex flex-col items-center">
                              <button 
                                onClick={() => abrirModalEdicion(orden.id)}
                                disabled={cargandoDetalle === orden.id}
                                className="flex items-center justify-center w-10 h-10 bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white rounded-xl transition-all duration-300 hover:shadow-[0_4px_12px_rgba(249,115,22,0.3)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-wait"
                              >
                                <Edit size={18} strokeWidth={2.5} />
                              </button>
                              <div className="absolute -top-10 opacity-0 group-hover/edit:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/edit:-translate-y-1">
                                Editar Pruebas
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                              </div>
                            </div>

                            <div className="relative group/pay flex flex-col items-center">
                              <button 
                                onClick={() => abrirModalPago(orden.id)}
                                disabled={cargandoDetalle === orden.id}
                                className="flex items-center justify-center w-10 h-10 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-[0_4px_12px_rgba(22,163,74,0.3)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-wait"
                              >
                                {cargandoDetalle === orden.id ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} strokeWidth={2.5} />}
                              </button>
                              <div className="absolute -top-10 opacity-0 group-hover/pay:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/pay:-translate-y-1">
                                Procesar Pago
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                              </div>
                            </div>
                            
                            <div className="relative group/ban flex flex-col items-center">
                              <button 
                                onClick={() => pedirClave(orden.id, "ANULAR")} 
                                className="flex items-center justify-center w-10 h-10 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-300 hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:-translate-y-0.5"
                              >
                                <Ban size={18} strokeWidth={2.5} />
                              </button>
                              <div className="absolute -top-10 opacity-0 group-hover/ban:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/ban:-translate-y-1">
                                Anular Orden
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* BOTÓN PARA ANULAR ORDEN CERRADA */}
                        {orden.estado.nombre === "CERRADA" && (
                          <div className="relative group/banc flex flex-col items-center">
                            <button 
                              onClick={() => pedirClave(orden.id, "ANULAR")} 
                              className="flex items-center justify-center w-10 h-10 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-300 hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:-translate-y-0.5"
                            >
                              <Ban size={18} strokeWidth={2.5} />
                            </button>
                            <div className="absolute -top-10 opacity-0 group-hover/banc:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/banc:-translate-y-1">
                              Anular (Clave)
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                            </div>
                          </div>
                        )}

                        {/* BOTÓN DE ACTIVAR SÓLO PARA ANULADAS */}
                        {orden.estado.nombre === "ANULADA" && (
                          <div className="relative group/refresh flex flex-col items-center">
                            <button 
                              onClick={() => pedirClave(orden.id, "ACTIVAR")} 
                              className="flex items-center justify-center w-10 h-10 bg-slate-100 text-slate-500 hover:bg-[#0071E3] hover:text-white rounded-xl transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,113,227,0.3)] hover:-translate-y-0.5"
                            >
                              <RefreshCw size={18} strokeWidth={2.5} />
                            </button>
                            <div className="absolute -top-10 opacity-0 group-hover/refresh:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/refresh:-translate-y-1">
                              Reactivar (Clave)
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                            </div>
                          </div>
                        )}

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ModalAsistenteWhatsApp */}
      {whatsAppModalConfig && whatsAppModalConfig.orden && (
        <ModalAsistenteWhatsApp
          isOpen={whatsAppModalConfig.isOpen}
          onClose={() => setWhatsAppModalConfig(null)}
          pacienteNombre={whatsAppModalConfig.orden.paciente.nombreCompleto}
          telefono={whatsAppModalConfig.orden.paciente.telefono || ""}
          tipoMensaje="contacto"
          datosAdicionales={{ ordenId: whatsAppModalConfig.orden.id }}
        />
      )}
    </div>
  );
}

export default function ListaDiariaPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center p-10 text-slate-400">
        <Loader2 className="animate-spin text-[#0071E3] mr-2" size={24} />
        Cargando diaria...
      </div>
    }>
      <ListaDiariaContent />
    </Suspense>
  );
}