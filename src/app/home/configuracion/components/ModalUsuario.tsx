import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

interface ModalUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  usuarioEditar: any;
}

export default function ModalUsuario({ isOpen, onClose, onSave, usuarioEditar }: ModalUsuarioProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    clave: "",
    rol: "ASISTENTE",
    mpps: "",
    col: "",
    pinFirma: "",
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (usuarioEditar) {
      setFormData({
        nombre: usuarioEditar.nombre || "",
        correo: usuarioEditar.correo || "",
        clave: "", // No se muestra la clave actual
        rol: usuarioEditar.rol || "ASISTENTE",
        mpps: usuarioEditar.mpps || "",
        col: usuarioEditar.col || "",
        pinFirma: usuarioEditar.pinFirma || "",
      });
    } else {
      setFormData({
        nombre: "",
        correo: "",
        clave: "",
        rol: "ASISTENTE",
        mpps: "",
        col: "",
        pinFirma: "",
      });
    }
  }, [usuarioEditar, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    await onSave(formData);
    setGuardando(false);
  };

  const isBioanalista = formData.rol === "BIOANALISTA" || formData.rol === "LABORATORIO";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-6 pb-4 flex justify-between items-center border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div>
            <h3 className="font-title text-xl font-bold text-[#1D1D1F]">
              {usuarioEditar ? "Editar Personal" : "Añadir Personal"}
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {usuarioEditar ? "Modifica los datos del usuario" : "Registra un nuevo asistente o bioanalista"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 bg-slate-100 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</label>
                <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-all" placeholder="Ej. Dra. María Pérez" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Correo Electrónico</label>
                <input type="email" required value={formData.correo} onChange={(e) => setFormData({ ...formData, correo: e.target.value })} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-all" placeholder="usuario@laboratorio.com" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Contraseña {usuarioEditar && <span className="text-amber-500 lowercase normal-case text-[10px] ml-1">(Dejar vacío para no cambiar)</span>}
                </label>
                <input type="password" required={!usuarioEditar} minLength={6} value={formData.clave} onChange={(e) => setFormData({ ...formData, clave: e.target.value })} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-all" placeholder="Mínimo 6 caracteres" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rol en el Sistema</label>
                <div className="flex bg-[#F5F5F7] rounded-xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, rol: "ASISTENTE" })}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      formData.rol === "ASISTENTE"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    }`}
                  >
                    Asistente
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, rol: "BIOANALISTA" })}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      formData.rol === "BIOANALISTA"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    }`}
                  >
                    Bioanalista
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, rol: "LABORATORIO" })}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      formData.rol === "LABORATORIO"
                        ? "bg-white text-purple-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    }`}
                  >
                    Director
                  </button>
                </div>
              </div>
            </div>

            {isBioanalista && (
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Datos de Firma y Colegiatura
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-blue-700/70 uppercase">MPPS</label>
                    <input type="text" value={formData.mpps} onChange={(e) => setFormData({ ...formData, mpps: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none" placeholder="Opcional" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-blue-700/70 uppercase">COL. Bioanalistas</label>
                    <input type="text" value={formData.col} onChange={(e) => setFormData({ ...formData, col: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none" placeholder="Opcional" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-blue-700/70 uppercase">PIN de Firma (4 a 6 dígitos)</label>
                  <input type="password" maxLength={6} value={formData.pinFirma} onChange={(e) => setFormData({ ...formData, pinFirma: e.target.value.replace(/\D/g, '') })} className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none" placeholder="PIN para aprobar resultados" />
                  <p className="text-[10px] text-blue-600/70">Requerido para poder validar órdenes y generar PDFs.</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
            <button type="button" onClick={onClose} disabled={guardando} className="flex-1 py-3.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white bg-[#0071E3] hover:bg-[#0077ED] shadow-[0_4px_12px_rgba(0,113,227,0.25)] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {guardando && <Loader2 size={16} className="animate-spin" />}
              {usuarioEditar ? "Guardar Cambios" : "Crear Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
