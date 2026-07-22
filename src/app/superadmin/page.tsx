import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus, Building2, Calendar, Phone, Mail, MapPin, Users, User, Activity, ArrowRight } from "lucide-react";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  const laboratorios = await prisma.laboratorio.findMany({
    include: {
      usuarios: {
        select: { nombre: true, correo: true, activo: true, rol: true }
      },
      _count: {
        select: { ordenes: true, pacientes: true }
      }
    },
    orderBy: { fechaCreacion: 'desc' }
  });

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full min-h-screen bg-transparent selection:bg-blue-100">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 rounded-2xl">
              <Building2 className="text-blue-600 w-8 h-8" strokeWidth={2.5} />
            </div>
            Laboratorios Clientes
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg max-w-xl">
            Gestiona todos los tenants del sistema SmartLab SaaS. Monitorea su actividad y usuarios.
          </p>
        </div>
        
        <Link 
          href="/superadmin/nuevo"
          className="group relative bg-slate-900 hover:bg-black text-white px-6 py-3.5 rounded-2xl font-bold shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] transition-all duration-300 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Plus size={20} strokeWidth={3} className="relative z-10" />
          <span className="relative z-10">Nuevo Laboratorio</span>
        </Link>
      </div>

      {laboratorios.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[32px] p-16 text-center flex flex-col items-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-blue-100/50">
            <Building2 className="text-blue-500 w-12 h-12" strokeWidth={2} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">No hay laboratorios registrados</h3>
          <p className="text-slate-500 max-w-md text-lg leading-relaxed">Comienza agregando tu primer cliente (tenant) al sistema para que puedan empezar a utilizar SmartLab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {laboratorios.map((lab, i) => {
            const admin = lab.usuarios.find(u => u.rol === 'LABORATORIO');
            const asistentes = lab.usuarios.filter(u => u.rol === 'ASISTENTE');
            
            return (
              <div 
                key={lab.id} 
                className="group relative bg-white/70 backdrop-blur-xl border border-white/80 rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Fondo Decorativo */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/40 to-purple-100/40 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-700"></div>

                {/* Indicador de Estado Superior */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1.5 rounded-b-full transition-all duration-500 ${lab.activo ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] group-hover:w-1/2' : 'bg-rose-400 shadow-[0_0_15px_rgba(251,113,133,0.5)] group-hover:w-1/2'}`}></div>
                
                {/* Cabecera de la Tarjeta */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-5 items-center w-full">
                    {/* Logo (Si existe) o Icono por defecto */}
                    <div className="w-20 h-20 rounded-[20px] bg-white border border-slate-100/80 flex items-center justify-center shrink-0 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] relative overflow-hidden group-hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.12)] transition-all">
                      {lab.logoBase64 ? (
                        <Image src={lab.logoBase64} alt={`Logo ${lab.nombre}`} fill className="object-contain p-2" />
                      ) : (
                        <Building2 className="text-slate-300 w-10 h-10" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${lab.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {lab.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lab.rif || 'Sin RIF'}</span>
                      </div>
                      <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight line-clamp-2">{lab.nombre}</h3>
                    </div>
                  </div>
                </div>
                
                {/* Información de Contacto con Glassmorphism */}
                <div className="bg-slate-50/60 backdrop-blur-md rounded-2xl p-4 border border-slate-100/60 mb-6 space-y-3">
                  {lab.correo && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-slate-400 group-hover:text-blue-500 transition-colors">
                        <Mail size={14} />
                      </div>
                      <span className="truncate font-medium">{lab.correo}</span>
                    </div>
                  )}
                  {lab.telefono && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-slate-400 group-hover:text-blue-500 transition-colors">
                        <Phone size={14} />
                      </div>
                      <span className="truncate font-medium">{lab.telefono}</span>
                    </div>
                  )}
                </div>

                {/* Métricas y Cifras */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-white/80 rounded-2xl p-4 shadow-sm border border-slate-100/80 group-hover:border-blue-100 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <Activity size={12} strokeWidth={3} />
                      </div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Órdenes</p>
                    </div>
                    <p className="text-2xl font-black text-slate-800">{lab._count.ordenes}</p>
                  </div>
                  <div className="bg-white/80 rounded-2xl p-4 shadow-sm border border-slate-100/80 group-hover:border-blue-100 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                        <Users size={12} strokeWidth={3} />
                      </div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pacientes</p>
                    </div>
                    <p className="text-2xl font-black text-slate-800">{lab._count.pacientes}</p>
                  </div>
                </div>

                {/* Sección de Usuarios */}
                <div className="mt-auto bg-slate-50/50 rounded-2xl p-5 border border-slate-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-800">Equipo</h4>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Users size={12} /> {asistentes.length} Asistentes
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Administrador */}
                    {admin && (
                      <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-slate-100/80 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm shrink-0 border border-indigo-100">
                          {admin.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-800 truncate">{admin.nombre}</p>
                            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">Admin</span>
                          </div>
                          <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{admin.correo}</p>
                        </div>
                      </div>
                    )}

                    {/* Asistentes Preview */}
                    {asistentes.length > 0 && (
                      <div className="flex -space-x-3 mt-3">
                        {asistentes.slice(0, 4).map((asistente, idx) => (
                          <div 
                            key={idx} 
                            className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs shadow-sm hover:-translate-y-1 transition-transform cursor-help"
                            title={`${asistente.nombre} (${asistente.correo})`}
                          >
                            {asistente.nombre.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {asistentes.length > 4 && (
                          <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-50 text-slate-500 font-bold flex items-center justify-center text-xs shadow-sm">
                            +{asistentes.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
