"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Edit2, Power, PowerOff, Trash2, X, Save, UploadCloud, Users, Building2, KeyRound, Mail } from "lucide-react";
import Image from "next/image";
import { compressImage } from "@/lib/imageUtils";

interface UsuarioData {
  id: string;
  nombre: string;
  correo: string;
  activo: boolean;
  rol: string;
}

interface LaboratorioData {
  id: string;
  nombre: string;
  rif: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  ciudad: string | null;
  estado: string | null;
  activo: boolean;
  logoBase64: string | null;
  usuarios?: UsuarioData[];
}

export default function LaboratorioActions({ lab }: { lab: LaboratorioData }) {
  const router = useRouter();
  
  // States
  const [cargando, setCargando] = useState(false);
  
  // Component mounted state for portal
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"perfil" | "equipo">("perfil");
  const [formData, setFormData] = useState<LaboratorioData>(lab);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User Edit State (Equipo Tab)
  const [editandoUsuarioId, setEditandoUsuarioId] = useState<string | null>(null);
  const [usuarioForm, setUsuarioForm] = useState({ correo: "", nuevaClave: "" });

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Disable Modal State
  const [showDisableModal, setShowDisableModal] = useState(false);

  const handleToggleActivo = async () => {
    try {
      setCargando(true);
      const res = await fetch(`/api/laboratorios/${lab.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lab, activo: !lab.activo }),
      });

      if (!res.ok) throw new Error("Error al actualizar");
      
      toast.success(lab.activo ? "Laboratorio inhabilitado" : "Laboratorio habilitado");
      setShowDisableModal(false);
      router.refresh();
    } catch (error) {
      toast.error("Ocurrió un error");
    } finally {
      setCargando(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida");
      return;
    }

    try {
      const compressedBase64 = await compressImage(file, 300);
      setFormData({ ...formData, logoBase64: compressedBase64 });
    } catch (error) {
      toast.error("Error al procesar la imagen");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCargando(true);
      const res = await fetch(`/api/laboratorios/${lab.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Error al actualizar");
      
      toast.success("Laboratorio actualizado");
      setShowEditModal(false);
      router.refresh();
    } catch (error) {
      toast.error("Ocurrió un error");
    } finally {
      setCargando(false);
    }
  };

  const handleUpdateUsuario = async (userId: string) => {
    try {
      setCargando(true);
      const res = await fetch(`/api/superadmin/usuarios/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuarioForm),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al actualizar usuario");
      }
      
      toast.success("Usuario actualizado correctamente");
      setEditandoUsuarioId(null);
      setUsuarioForm({ correo: "", nuevaClave: "" });
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Ocurrió un error al actualizar");
    } finally {
      setCargando(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== "ELIMINAR") {
      toast.error("Debes escribir ELIMINAR para confirmar");
      return;
    }

    try {
      setCargando(true);
      const res = await fetch(`/api/laboratorios/${lab.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar");
      
      toast.success("Laboratorio eliminado definitivamente");
      setShowDeleteModal(false);
      router.refresh();
    } catch (error) {
      toast.error("Ocurrió un error al eliminar");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <div className="mt-auto flex items-center gap-2 pt-6 border-t border-slate-100">
        <button
          onClick={() => setShowEditModal(true)}
          disabled={cargando}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-xl text-sm font-bold transition-colors"
        >
          <Edit2 size={16} /> Editar
        </button>

        <button
          onClick={() => setShowDisableModal(true)}
          disabled={cargando}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-colors ${
            lab.activo 
              ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
          }`}
        >
          {lab.activo ? <><PowerOff size={16} /> Suspender</> : <><Power size={16} /> Reactivar</>}
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={cargando}
          className="flex-none flex items-center justify-center p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors"
          title="Eliminar Laboratorio"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* EDIT MODAL */}
      {mounted && showEditModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 sm:px-8 border-b border-slate-100">
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Building2 size={24} />
                </div>
                Administrar Cliente
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-6 sm:px-8">
              <button 
                onClick={() => setActiveTab("perfil")}
                className={`py-4 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === "perfil" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                Perfil del Laboratorio
              </button>
              <button 
                onClick={() => setActiveTab("equipo")}
                className={`py-4 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "equipo" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                Bioanalistas / Equipo
                <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-xs">{lab.usuarios?.length || 0}</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto">
              {activeTab === "perfil" && (
                <form id="lab-edit-form" onSubmit={handleEditSubmit} className="space-y-6">
                  <div className="flex justify-center mb-6">
                    <div 
                      className="w-32 h-32 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-all relative overflow-hidden group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {formData.logoBase64 ? (
                        <Image src={formData.logoBase64} alt="Logo" fill className="object-contain p-2" />
                      ) : (
                        <div className="text-slate-400 flex flex-col items-center">
                          <UploadCloud size={32} className="mb-2" />
                          <span className="text-xs font-semibold">Subir Logo</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold">Cambiar</span>
                      </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                      <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">RIF</label>
                      <input value={formData.rif || ""} onChange={e => setFormData({...formData, rif: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                      <input value={formData.telefono || ""} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correo de Contacto</label>
                      <input value={formData.correo || ""} onChange={e => setFormData({...formData, correo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dirección Física</label>
                      <input value={formData.direccion || ""} onChange={e => setFormData({...formData, direccion: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </form>
              )}

              {activeTab === "equipo" && (
                <div className="space-y-4">
                  {lab.usuarios && lab.usuarios.length > 0 ? (
                    lab.usuarios.map(usuario => (
                      <div key={usuario.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0">
                              {usuario.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 leading-tight">{usuario.nombre}</p>
                              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md inline-block mt-1">
                                {usuario.rol}
                              </span>
                            </div>
                          </div>
                          {editandoUsuarioId !== usuario.id ? (
                            <button 
                              onClick={() => {
                                setEditandoUsuarioId(usuario.id);
                                setUsuarioForm({ correo: usuario.correo, nuevaClave: "" });
                              }}
                              className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-xl transition-colors"
                              title="Editar Credenciales"
                            >
                              <Edit2 size={16} />
                            </button>
                          ) : (
                            <button 
                              onClick={() => setEditandoUsuarioId(null)}
                              className="text-slate-400 hover:bg-slate-200 p-2 rounded-xl transition-colors"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>

                        {editandoUsuarioId === usuario.id && (
                          <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Mail size={12}/> Correo de Acceso</label>
                              <input 
                                type="email" 
                                required
                                value={usuarioForm.correo} 
                                onChange={e => setUsuarioForm({...usuarioForm, correo: e.target.value})} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><KeyRound size={12}/> Nueva Contraseña <span className="text-[10px] text-slate-400 normal-case ml-1">(Opcional, dejar en blanco para no cambiar)</span></label>
                              <input 
                                type="password" 
                                placeholder="Escribe la nueva contraseña..."
                                value={usuarioForm.nuevaClave} 
                                onChange={e => setUsuarioForm({...usuarioForm, nuevaClave: e.target.value})} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                              />
                            </div>
                            <div className="flex justify-end pt-2">
                              <button 
                                onClick={() => handleUpdateUsuario(usuario.id)}
                                disabled={cargando}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                              >
                                <Save size={14} /> Actualizar Usuario
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">No hay usuarios registrados en este laboratorio.</div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {activeTab === "perfil" && (
              <div className="p-6 sm:px-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 mt-auto">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50">
                  Cancelar
                </button>
                <button form="lab-edit-form" type="submit" disabled={cargando} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                  <Save size={18} /> Guardar Laboratorio
                </button>
              </div>
            )}
            
            {activeTab === "equipo" && (
               <div className="p-6 sm:px-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 mt-auto">
                 <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50">
                   Cerrar
                 </button>
               </div>
            )}

          </div>
        </div>,
        document.body
      )}

      {/* DELETE MODAL */}
      {mounted && showDeleteModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8 border-t-8 border-rose-500 relative">
            <h3 className="text-2xl font-black text-rose-600 mb-2">Peligro: Borrado Destructivo</h3>
            <p className="text-slate-600 mb-6 font-medium">
              Estás a punto de eliminar el laboratorio <strong className="text-slate-900">{lab.nombre}</strong>. 
              Esto borrará de forma <strong>irreversible</strong> a todos sus pacientes, órdenes, configuraciones y usuarios.
            </p>
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Escribe <span className="text-rose-600">ELIMINAR</span> para confirmar
              </label>
              <input 
                type="text" 
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                className="w-full bg-rose-50 border border-rose-200 text-rose-900 font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="ELIMINAR"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => {setShowDeleteModal(false); setDeleteConfirmText("");}} className="px-5 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                disabled={cargando || deleteConfirmText !== "ELIMINAR"} 
                className="px-5 py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sí, Borrar Todo
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DISABLE/ENABLE MODAL */}
      {mounted && showDisableModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className={`bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8 border-t-8 ${lab.activo ? 'border-amber-500' : 'border-emerald-500'} relative`}>
            <h3 className={`text-2xl font-black mb-2 ${lab.activo ? 'text-amber-600' : 'text-emerald-600'}`}>
              {lab.activo ? 'Suspender Laboratorio' : 'Reactivar Laboratorio'}
            </h3>
            <p className="text-slate-600 mb-6 font-medium">
              {lab.activo 
                ? `¿Estás seguro que deseas inhabilitar a ${lab.nombre}? Sus usuarios ya no podrán acceder al sistema hasta que lo vuelvas a habilitar.` 
                : `¿Deseas volver a darle acceso al sistema a ${lab.nombre}?`}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDisableModal(false)} className="px-5 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">
                Cancelar
              </button>
              <button 
                onClick={handleToggleActivo}
                disabled={cargando} 
                className={`px-5 py-3 rounded-xl font-bold text-white disabled:opacity-50 ${lab.activo ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {lab.activo ? 'Sí, Suspender' : 'Sí, Reactivar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
