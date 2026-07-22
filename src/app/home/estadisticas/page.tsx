"use client";

import { useState, useEffect } from "react";
import { 
  Activity, Users, Microscope, Calendar, BarChart3, 
  UserCheck, Layers, ClipboardList, PieChart as PieIcon, BarChart2, TrendingUp, Filter, CheckCircle2,
  UserPlus
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";
import { toast } from "react-toastify";

const PALETA_COLORES = ['#0071E3', '#10B981', '#FF9500', '#8E44AD', '#FF3B30'];

type PeriodoType = "HOY" | "7DIAS" | "30DIAS" | "MES_ACTUAL" | "CUSTOM";

export default function EstadisticasPage() {
  const [periodo, setPeriodo] = useState<PeriodoType>("HOY");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  
  const [stats, setStats] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  const fetchEstadisticas = async () => {
    setCargando(true);
    try {
      let url = `/api/estadisticas?periodo=${periodo}`;
      if (periodo === "CUSTOM") {
        if (!fechaInicio || !fechaFin) {
          setCargando(false);
          return; 
        }
        url += `&inicio=${fechaInicio}&fin=${fechaFin}`;
      }

      // Evitamos caché en la petición
      url += `${url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error("Error de red");
      const data = await res.json();
      setStats(data);
    } catch (error: any) {
      console.error("Error al cargar métricas:", error);
      toast.error(error?.message ? `Error al cargar las métricas: ${error?.message}` : "Error al cargar las métricas");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (periodo !== "CUSTOM") {
      fetchEstadisticas();
    }
  }, [periodo]);

  const aplicarFiltroCustom = () => {
    if (!fechaInicio || !fechaFin) {
      toast.warning("Seleccione ambas fechas para filtrar");
      return;
    }
    
    const d1 = new Date(fechaInicio);
    const d2 = new Date(fechaFin);
    const diferenciaDias = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    
    if (diferenciaDias > 90) {
      toast.warning("El rango máximo permitido es de 90 días. Por favor, seleccione un período más corto.");
      return;
    }
    if (diferenciaDias < 0) {
      toast.error("La fecha de inicio no puede ser mayor a la fecha fin");
      return;
    }

    fetchEstadisticas();
  };

  const categoryChartMinWidth = (stats?.graficoCategorias || []).length > 6 
    ? `${(stats?.graficoCategorias || []).length * 15}%` 
    : '100%';

  return (
    <div className="h-full flex flex-col pb-10 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
      
      {/* CABECERA */}
      <div className="mb-8 flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-6">
        <div>
          <h1 className="font-title text-4xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
            <Activity className="text-[#0071E3]" size={36} strokeWidth={2.5} />
            Módulo Analítico Clínico
          </h1>
          <p className="text-[#86868B] mt-2 font-medium text-[15px]">
            Monitoreo en tiempo real enfocado en el flujo de pacientes y procesamiento de exámenes.
          </p>
        </div>

        {/* CONTROLES DE FILTRO */}
        <div className="flex flex-wrap items-center justify-start 2xl:justify-end gap-3">
          
          <div className="flex items-center bg-[#F5F5F7] p-1.5 rounded-2xl border border-slate-200/60 w-max overflow-hidden">
            {[
              { id: "HOY", label: "Hoy" },
              { id: "7DIAS", label: "7 Días" },
              { id: "30DIAS", label: "30 Días" },
              { id: "MES_ACTUAL", label: "Este Mes" },
              { id: "CUSTOM", label: "Personalizado" }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPeriodo(opt.id as PeriodoType)}
                className={`px-4 py-2.5 text-[13px] font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  periodo === opt.id 
                  ? "bg-white text-[#0071E3] shadow-sm" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                }`}
              >
                {opt.id === "CUSTOM" && <Filter size={14} strokeWidth={2.5} />}
                {opt.label}
              </button>
            ))}
          </div>

          {periodo === "CUSTOM" && (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-left-4 duration-300 w-max">
              <input 
                type="date" 
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-3 py-2 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-[13px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#0071E3]/20"
              />
              <span className="text-slate-400 font-black text-sm">-</span>
              <input 
                type="date" 
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-3 py-2 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-[13px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#0071E3]/20"
              />
              <button 
                onClick={aplicarFiltroCustom}
                className="px-5 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-bold rounded-xl transition-colors shadow-sm ml-1"
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-slate-400 font-bold gap-3">
          <BarChart3 className="animate-pulse text-[#0071E3]" size={48} />
          Compilando registros e índices del laboratorio...
        </div>
      ) : !stats ? (
        <div className="text-center py-20 text-slate-400 font-bold">
          Seleccione un rango válido para mostrar los datos.
        </div>
      ) : (
        <>
          {/* GRIDS DE DATOS BLINDADOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

            <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0071E3] flex items-center justify-center shrink-0">
                <Users size={26} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Órdenes Atendidas</p>
                <h3 className="text-2xl font-black text-[#1D1D1F] mt-1">{stats?.kpis?.totalOrdenes || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <UserCheck size={26} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Pacientes Únicos</p>
                <h3 className="text-2xl font-black text-[#1D1D1F] mt-1">{stats?.kpis?.pacientesUnicos || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Microscope size={26} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Exámenes Procesados</p>
                <h3 className="text-2xl font-black text-[#1D1D1F] mt-1">{stats?.kpis?.totalPruebas || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-sm flex items-center gap-5 relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 z-10">
                <CheckCircle2 size={26} strokeWidth={2.5} />
              </div>
              <div className="z-10">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tasa de Resolución</p>
                <h3 className="text-2xl font-black text-[#1D1D1F] mt-1">{stats?.kpis?.tasaProcesamiento || 0}%</h3>
              </div>
              {/* Barra de progreso de fondo */}
              <div className="absolute bottom-0 left-0 h-1.5 bg-orange-100 w-full">
                <div className="h-full bg-orange-500 rounded-r-full transition-all duration-1000" style={{ width: `${stats?.kpis?.tasaProcesamiento || 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* TENDENCIAS SEPARADAS: 2 COLUMNAS */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-black text-[#1D1D1F] flex items-center gap-2">
                  <Users size={20} className="text-[#0071E3]" /> Afluencia de Pacientes
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Evolución de ingresos de pacientes por día.</p>
              </div>
              {/* CORRECCIÓN RECHARTS */}
              <div className="w-full" style={{ height: 250, minHeight: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.graficoTendencia || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPacientes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0071E3" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0071E3" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11, fontWeight: 600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11, fontWeight: 600}} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
                    <Area type="monotone" dataKey="Pacientes" stroke="#0071E3" strokeWidth={3} fillOpacity={1} fill="url(#colorPacientes)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-black text-[#1D1D1F] flex items-center gap-2">
                  <Microscope size={20} className="text-[#8E44AD]" /> Carga Técnica de Pruebas
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Volumen de exámenes procesados diariamente.</p>
              </div>
              {/* CORRECCIÓN RECHARTS */}
              <div className="w-full" style={{ height: 250, minHeight: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.graficoTendencia || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPruebas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8E44AD" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8E44AD" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11, fontWeight: 600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11, fontWeight: 600}} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
                    <Area type="monotone" dataKey="Pruebas" stroke="#8E44AD" strokeWidth={3} fillOpacity={1} fill="url(#colorPruebas)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* SECCIÓN DEMOGRÁFICA DE PACIENTES */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-sm flex flex-col">
              <h3 className="text-lg font-black text-[#1D1D1F] flex items-center gap-2 mb-1">
                <PieIcon size={20} className="text-[#0071E3]" /> Distribución por Sexo de Pacientes
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-6">Proporción basada en el género biológico registrado.</p>
              
              {/* CORRECCIÓN RECHARTS */}
              <div className="flex-1 relative flex items-center justify-center w-full" style={{ minHeight: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.graficoSexo || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {(stats?.graficoSexo || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PALETA_COLORES[index % PALETA_COLORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-sm flex flex-col">
              <h3 className="text-lg font-black text-[#1D1D1F] flex items-center gap-2 mb-1">
                <Users size={20} className="text-[#0071E3]" /> Segmentación por Rangos de Edad
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-6">Agrupación epidemiológica del volumen de pacientes atendidos.</p>
              
              {/* CORRECCIÓN RECHARTS */}
              <div className="flex-1 w-full" style={{ minHeight: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.graficoEdad || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#1D1D1F', fontSize: 11, fontWeight: 700}} dy={5} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11, fontWeight: 600}} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" name="Pacientes" fill="#FF9500" radius={[8, 8, 0, 0]} barSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* SECCIÓN FIDELIZACIÓN Y ADMINISTRATIVA */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-sm flex flex-col">
              <h3 className="text-lg font-black text-[#1D1D1F] flex items-center gap-2 mb-1">
                <TrendingUp size={20} className="text-[#10B981]" /> Top Categorías
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-6">Áreas de procesamiento con mayor demanda.</p>
              
              <div className="flex-1 flex flex-col justify-center gap-4">
                {(stats?.topCategorias || []).map((cat: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded-xl border border-slate-200/40">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#10B981]/10 text-[#10B981] font-black text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-black text-[#1D1D1F] truncate max-w-[200px] uppercase" title={cat.nombre}>
                        {cat.nombre}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                      {cat.cantidad} Procesamientos
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-sm flex flex-col">
              <h3 className="text-lg font-black text-[#1D1D1F] flex items-center gap-2 mb-1">
                <Activity size={20} className="text-[#8E44AD]" /> Estado de las Órdenes
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-6">Clasificación de órdenes por su fase actual.</p>
              
              <div className="flex-1 w-full" style={{ minHeight: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.graficoEstados || []} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11, fontWeight: 600}} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#1D1D1F', fontSize: 11, fontWeight: 700}} width={100} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" name="Órdenes" fill="#8E44AD" radius={[0, 8, 8, 0]} barSize={25}>
                      {(stats?.graficoEstados || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PALETA_COLORES[index % PALETA_COLORES.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* VOLUMEN DE EXÁMENES POR CATEGORÍAS */}
          <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-sm flex flex-col mb-8">
            <h3 className="text-lg font-black text-[#1D1D1F] flex items-center gap-2 mb-1">
              <Layers size={20} className="text-[#0071E3]" /> Volumen de Exámenes por Categorías
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-6">Demanda analítica desglosada (Desliza si hay muchas categorías).</p>
            
            <div className="w-full overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              {/* CORRECCIÓN RECHARTS */}
              <div style={{ minWidth: categoryChartMinWidth, height: 320, minHeight: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.graficoCategorias || []} margin={{ top: 10, right: 20, left: -25, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      interval={0}
                      tick={{fill: '#1D1D1F', fontSize: 10, fontWeight: 700, angle: -35, textAnchor: 'end'}} 
                      dy={10} 
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11, fontWeight: 600}} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} cursor={{fill: '#F5F5F7'}} />
                    <Bar dataKey="value" name="Exámenes" fill="#0071E3" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* LISTA COMPLETA DE PRUEBAS */}
          <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-sm flex flex-col mb-8">
            <h3 className="text-lg font-black text-[#1D1D1F] flex items-center gap-2 mb-1">
              <ClipboardList size={20} className="text-[#0071E3]" /> Conteo General de Pruebas
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-6">Listado completo de volumen de procesamiento por examen técnico.</p>
            
            <div className="flex-1 overflow-y-auto max-h-96 pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(stats?.todasLasPruebas || []).map((prueba: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[#F5F5F7] hover:bg-white hover:shadow-md hover:border-[#0071E3]/20 rounded-xl border border-slate-200/60 transition-all group">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#0071E3]/10 text-[#0071E3] font-black text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-xs font-black text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors truncate max-w-[200px] uppercase" title={prueba.nombre}>
                        {prueba.nombre}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm shrink-0">
                      {prueba.cantidad} Pruebas
                    </span>
                  </div>
                ))}
              </div>
              {(stats?.todasLasPruebas || []).length === 0 && (
                <div className="text-center py-10 text-slate-400 font-bold">
                  No hay pruebas procesadas en este período.
                </div>
              )}
            </div>
          </div>

        </>
      )}
    </div>
  );
}