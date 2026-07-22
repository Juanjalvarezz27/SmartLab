"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Activity, 
  CheckCircle,
  AlertCircle,
  Microscope,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import useTasaBCV from "../hooks/useTasaBcv";

export default function HomeDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { tasa } = useTasaBCV();
  
  const [fechaActual, setFechaActual] = useState("");
  const [ordenesPendientes, setOrdenesPendientes] = useState<any[]>([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(true);
  
  const [ordenesPendientesResultados, setOrdenesPendientesResultados] = useState<any[]>([]);
  const [cargandoResultados, setCargandoResultados] = useState(true);

  const [faltaCierreAyer, setFaltaCierreAyer] = useState(false);
  const [fechaFaltante, setFechaFaltante] = useState("");

  useEffect(() => {
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaString = new Date().toLocaleDateString('es-VE', opciones);
    setFechaActual(fechaString.charAt(0).toUpperCase() + fechaString.slice(1));

    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/dashboard-summary');
        if (res.ok) {
          const data = await res.json();
          
          setOrdenesPendientes(data.ordenesPendientes || []);
          setOrdenesPendientesResultados(data.ordenesPendientesResultados || []);
          
          if (data.cierreAnterior?.faltaCierreAnterior && data.cierreAnterior?.fechaFaltante) {
            setFaltaCierreAyer(true);
            const dateObj = new Date(`${data.cierreAnterior.fechaFaltante}T12:00:00`);
            const fechaFormateada = dateObj.toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            setFechaFaltante(fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1));
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard summary:", error);
      } finally {
        setCargandoPendientes(false);
        setCargandoResultados(false);
      }
    };

    fetchDashboardData();
  }, []);

  const nombreUsuario = session?.user?.name || "";

  return (
    <div className="h-full flex flex-col pb-10 overflow-y-auto outline-none pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full animate-in fade-in duration-500">
      
      {/* ALERTA DE CIERRE DE CAJA FALTANTE */}
      {faltaCierreAyer && (
        <div className="bg-red-50 border border-red-200 rounded-[32px] p-6 md:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangle size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-red-800 leading-tight mb-1">Cierre de caja pendiente</h3>
              <p className="text-base text-red-700/80 font-medium">
                No se ha realizado el cierre del día <span className="font-bold text-red-700">{fechaFaltante}</span>. Es necesario realizarlo para mantener el control.
              </p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/home/cierre')}
            className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            Realizar cierre ahora <ArrowRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* BANNER DE BIENVENIDA */}
      <div className="relative bg-white border border-slate-200/80 rounded-[32px] p-8 md:p-12 mb-8 overflow-hidden shadow-sm shrink-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-[100px] opacity-80 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              <img 
                src="/Logo2.png" 
                alt="Logo LEYMA" 
                className="h-20 md:h-24 w-auto object-contain drop-shadow-sm" 
              />
            </div>
            
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-[#1D1D1F] tracking-tight mb-2 leading-tight">
                Hola, <span className="text-[#0071E3]">{status === "loading" ? "..." : nombreUsuario}</span>
              </h1>
              <p className="text-lg font-medium text-slate-500 max-w-xl">
                Bienvenido al panel principal de LEYMA C.A. ¿Qué te gustaría hacer hoy?
              </p>
            </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <Activity size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Estado del Sistema</p>
              <p className="text-sm font-black text-[#1D1D1F] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Operativo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TARJETAS DE INFORMACIÓN VITAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 shrink-0">
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0071E3] shrink-0">
            <CalendarIcon size={28} strokeWidth={2} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha Actual</p>
            <h3 className="text-xl font-black text-[#1D1D1F] leading-none">{fechaActual}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm flex items-center gap-5 relative overflow-hidden">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-50 opacity-50 scale-150 -translate-x-4 pointer-events-none">
            <TrendingUp size={100} />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 relative z-10">
            <TrendingUp size={28} strokeWidth={2} />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tasa de Cambio BCV</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-black text-[#1D1D1F] leading-none">
                {!tasa ? "..." : `Bs ${tasa.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`}
              </h3>
              <span className="text-sm font-bold text-slate-400 mb-0.5">/ USD</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIONES PENDIENTES */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* COLUMNA: PENDIENTES DE PAGO */}
        <div>
          <h2 className="text-lg font-black text-orange-600 mb-6 flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            Órdenes Pendientes de Pago
          </h2>

          {cargandoPendientes ? (
            <div className="h-48 flex items-center justify-center text-slate-400 font-medium">Cargando información...</div>
          ) : ordenesPendientes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ordenesPendientes.map((orden) => (
                <div key={orden.id} onClick={() => router.push(`/home/diaria?fecha=${orden.fechaCreacion.split('T')[0]}`)} className="cursor-pointer group bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-[20px] p-5 shadow-sm hover:shadow-[0_8px_20px_rgba(249,115,22,0.15)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md">
                      <AlertCircle size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2.5 py-1 rounded-md">
                      Orden #{orden.id.toString().padStart(5, '0')}
                    </span>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-[15px] font-black text-[#1D1D1F] mb-1 leading-tight group-hover:text-orange-600 transition-colors">
                      {orden.paciente.nombreCompleto}
                    </h3>
                    <p className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5">
                      <CalendarIcon size={12} />
                      {new Date(orden.fechaCreacion).toLocaleDateString('es-VE')} - {new Date(orden.fechaCreacion).toLocaleTimeString('es-VE', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[24px] p-12 flex flex-col items-center justify-center text-center">
              <CheckCircle size={48} className="text-emerald-400 mb-4" strokeWidth={2} />
              <h3 className="text-xl font-bold text-[#1D1D1F]">¡Pagos al día!</h3>
              <p className="text-slate-500 mt-1 font-medium">No hay órdenes con deudas en este momento.</p>
            </div>
          )}
        </div>

        {/* COLUMNA: PENDIENTES DE RESULTADOS */}
        <div>
          <h2 className="text-lg font-black text-[#0071E3] mb-6 flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0071E3]"></span>
            </span>
            Resultados Pendientes
          </h2>

          {cargandoResultados ? (
            <div className="h-48 flex items-center justify-center text-slate-400 font-medium">Cargando información...</div>
          ) : ordenesPendientesResultados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ordenesPendientesResultados.map((orden) => (
                <div key={orden.id} onClick={() => router.push(`/home/resultados?fecha=${orden.fechaCreacion.split('T')[0]}`)} className="cursor-pointer group bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-[20px] p-5 shadow-sm hover:shadow-[0_8px_20px_rgba(0,113,227,0.15)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-[#0071E3] text-white flex items-center justify-center shadow-md">
                      <Microscope size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-bold text-[#0071E3] bg-blue-100 px-2.5 py-1 rounded-md">
                      Orden #{orden.id.toString().padStart(5, '0')}
                    </span>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-[15px] font-black text-[#1D1D1F] mb-1 leading-tight group-hover:text-[#0071E3] transition-colors">
                      {orden.paciente.nombreCompleto}
                    </h3>
                    <p className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5">
                      <CalendarIcon size={12} />
                      {new Date(orden.fechaCreacion).toLocaleDateString('es-VE')} - {new Date(orden.fechaCreacion).toLocaleTimeString('es-VE', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[24px] p-12 flex flex-col items-center justify-center text-center">
              <CheckCircle size={48} className="text-emerald-400 mb-4" strokeWidth={2} />
              <h3 className="text-xl font-bold text-[#1D1D1F]">¡Resultados listos!</h3>
              <p className="text-slate-500 mt-1 font-medium">No hay exámenes esperando transcripción.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}