"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Edit2, ShieldOff, ShieldAlert, BadgeCheck, Shield } from "lucide-react";
import { toast } from "react-toastify";
import ModalUsuario from "./ModalUsuario";
import ModalConfirmacion from "@/app/components/ui/ModalConfirmacion";

export default function GestionPersonal() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<any>(null);

  const [usuarioSuspender, setUsuarioSuspender] = useState<any>(null);
  const [isModalSuspenderOpen, setIsModalSuspenderOpen] = useState(false);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch("/api/laboratorios/usuarios");
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      }
    } catch (error) {
      toast.error("Error al cargar el personal");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const abrirModalNuevo = () => {
    setUsuarioEditando(null);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (usuario: any) => {
    setUsuarioEditando(usuario);
    setIsModalOpen(true);
  };

  const confirmarSuspension = (usuario: any) => {
    setUsuarioSuspender(usuario);
    setIsModalSuspenderOpen(true);
  };

  const handleSaveUsuario = async (formData: any) => {
    const isEdit = !!usuarioEditando;
    const url = isEdit ? `/api/laboratorios/usuarios/${usuarioEditando.id}` : "/api/laboratorios/usuarios";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || "Ocurrió un error");
        return;
      }

      toast.success(isEdit ? "Usuario actualizado" : "Usuario creado exitosamente");
      setIsModalOpen(false);
      fetchUsuarios();
    } catch (error) {
      toast.error("Error de red");
    }
  };

  const handleSuspenderUsuario = async () => {
    if (!usuarioSuspender) return;

    try {
      const nuevoEstado = !usuarioSuspender.activo;
      const res = await fetch(`/api/laboratorios/usuarios/${usuarioSuspender.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: nuevoEstado }),
      });

      if (res.ok) {
        toast.success(nuevoEstado ? "Usuario reactivado" : "Usuario suspendido");
        setIsModalSuspenderOpen(false);
        fetchUsuarios();
      } else {
        toast.error("Error al cambiar estado");
      }
    } catch (error) {
      toast.error("Error de red");
    }
  };

  return (
    <div className="mt-12">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="font-title text-2xl font-bold text-[#1D1D1F] flex items-center gap-2">
            <Users className="text-[#0071E3]" size={24} />
            Gestión de Personal
          </h2>
          <p className="text-slate-500 font-medium mt-1 text-sm">
            Administra los accesos de tus asistentes y colegas bioanalistas.
          </p>
        </div>
        <button 
          onClick={abrirModalNuevo}
          className="bg-[#0071E3] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-[0_4px_12px_rgba(0,113,227,0.25)] hover:bg-[#0077ED] transition-all active:scale-95 text-sm"
        >
          <Plus size={18} strokeWidth={2.5} /> Añadir Personal
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-10 text-center text-slate-400 font-bold">Cargando personal...</div>
        ) : usuarios.length === 0 ? (
          <div className="p-10 text-center text-slate-400 font-bold">No hay personal registrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 pl-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Usuario</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Rol</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Detalles de Firma</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="p-4 pr-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((u) => (
                  <tr key={u.id} className={`group transition-colors ${!u.activo ? 'bg-slate-50/50' : 'hover:bg-slate-50/50'}`}>
                    <td className="p-4 pl-6">
                      <div className="flex flex-col">
                        <span className={`font-bold text-sm ${!u.activo ? 'text-slate-400' : 'text-[#1D1D1F]'}`}>{u.nombre}</span>
                        <span className="text-xs text-slate-500">{u.correo}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {u.rol === "LABORATORIO" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">
                          <Shield size={12} /> Director
                        </span>
                      ) : u.rol === "BIOANALISTA" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                          <Shield size={12} /> Bioanalista
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                          Asistente
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {(u.rol === "BIOANALISTA" || u.rol === "LABORATORIO") ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-slate-500">MPPS: {u.mpps || <span className="text-slate-300 font-normal">N/A</span>}</span>
                          <span className="text-[10px] font-bold text-slate-500">COL: {u.col || <span className="text-slate-300 font-normal">N/A</span>}</span>
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            PIN: {u.pinFirma ? <span className="text-emerald-500 flex items-center gap-0.5"><BadgeCheck size={10} /> Configurado</span> : <span className="text-rose-400 font-normal">Sin PIN</span>}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 italic">No aplica</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${u.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        {u.activo ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button 
                          onClick={() => abrirModalEditar(u)}
                          className="w-8 h-8 rounded-lg bg-blue-50 text-[#0071E3] flex items-center justify-center hover:bg-[#0071E3] hover:text-white transition-all shadow-sm"
                          title="Editar"
                        >
                          <Edit2 size={14} strokeWidth={2.5} />
                        </button>
                        <button 
                          onClick={() => confirmarSuspension(u)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm ${u.activo ? 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                          title={u.activo ? "Suspender acceso" : "Reactivar acceso"}
                        >
                          {u.activo ? <ShieldOff size={14} strokeWidth={2.5} /> : <ShieldAlert size={14} strokeWidth={2.5} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalUsuario 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUsuario}
        usuarioEditar={usuarioEditando}
      />

      <ModalConfirmacion 
        isOpen={isModalSuspenderOpen}
        onClose={() => setIsModalSuspenderOpen(false)}
        onConfirm={handleSuspenderUsuario}
        titulo={usuarioSuspender?.activo ? "Suspender Usuario" : "Reactivar Usuario"}
        mensaje={usuarioSuspender?.activo 
          ? `¿Estás seguro de que deseas suspender el acceso a ${usuarioSuspender?.nombre}? No podrá iniciar sesión hasta que lo reactives.` 
          : `¿Deseas reactivar el acceso al sistema para ${usuarioSuspender?.nombre}?`}
        textoConfirmar={usuarioSuspender?.activo ? "Suspender" : "Reactivar"}
        colorBoton={usuarioSuspender?.activo ? "red" : "blue"}
      />
    </div>
  );
}
