import prisma from "@/lib/prisma";
import { Building2, Users, Activity, Stethoscope, BriefcaseMedical } from "lucide-react";

export const dynamic = "force-dynamic"; // Asegurar que siempre traiga datos frescos

export default async function MetricasPage() {
  // 1. Ejecutar las consultas de conteo en paralelo (muy eficiente)
  const [
    totalLabs,
    labsActivos,
    totalPacientes,
    totalOrdenes,
    totalUsuarios,
    topLaboratorios
  ] = await Promise.all([
    prisma.laboratorio.count(),
    prisma.laboratorio.count({ where: { activo: true } }),
    prisma.paciente.count(),
    prisma.orden.count(),
    prisma.usuario.count({ where: { rol: { not: "SUPERADMIN" } } }),
    prisma.laboratorio.findMany({
      take: 5,
      orderBy: { ordenes: { _count: 'desc' } },
      select: {
        id: true,
        nombre: true,
        _count: {
          select: { ordenes: true, pacientes: true }
        }
      }
    })
  ]);

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Métricas Generales</h1>
        <p className="text-slate-500 mt-2 font-medium">Visión global súper rápida del ecosistema SmartLab.</p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        
        {/* KPI: Laboratorios */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-lg">
                {labsActivos} Activos
              </span>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Laboratorios</p>
            <h3 className="text-4xl font-black text-slate-800">{totalLabs}</h3>
          </div>
        </div>

        {/* KPI: Pacientes */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                <Users size={24} />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Pacientes Globales</p>
            <h3 className="text-4xl font-black text-slate-800">{totalPacientes}</h3>
          </div>
        </div>

        {/* KPI: Órdenes */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                <Activity size={24} />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Órdenes Procesadas</p>
            <h3 className="text-4xl font-black text-slate-800">{totalOrdenes}</h3>
          </div>
        </div>

        {/* KPI: Usuarios Staff */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 relative overflow-hidden group lg:col-span-3">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                  <BriefcaseMedical size={20} />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Personal de Laboratorio (Bioanalistas y Asistentes)</p>
              </div>
              <h3 className="text-4xl font-black text-slate-800">{totalUsuarios} <span className="text-lg font-medium text-slate-400">usuarios en todo el sistema</span></h3>
            </div>
          </div>
        </div>
      </div>

      {/* TOP LABORATOIRES LIST */}
      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Stethoscope className="text-blue-600" /> Top 5 Laboratorios por Volumen
      </h3>
      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500">Laboratorio</th>
                <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 text-right">Pacientes</th>
                <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-blue-600 text-right">Órdenes (Score)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topLaboratorios.map((lab, i) => (
                <tr key={lab.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-xs">
                        #{i + 1}
                      </div>
                      <span className="font-bold text-slate-800">{lab.nombre}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right font-medium text-slate-600">
                    {lab._count.pacientes}
                  </td>
                  <td className="py-4 px-6 text-right font-black text-blue-600">
                    {lab._count.ordenes}
                  </td>
                </tr>
              ))}
              {topLaboratorios.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500 font-medium">Aún no hay suficientes datos procesados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
