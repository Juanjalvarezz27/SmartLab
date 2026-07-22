"use client";

import { useState } from "react";
import { Edit2, Save, X, Phone, Calendar, Hash, IdCard, Loader2, Baby, User, UserCheck, Ban } from "lucide-react";
import { fetchJSON } from "@/lib/fetchWithRetry";
import { toast } from "react-toastify";

interface TarjetaPacienteProps {
  paciente: any;
  limpiarSeleccion: () => void;
  onActualizarPaciente: (pacienteActualizado: any) => void; 
}

export default function TarjetaPaciente({ paciente, limpiarSeleccion, onActualizarPaciente }: TarjetaPacienteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Utilidad para extraer YYYY-MM-DD a DD/MM/AAAA sin sufrir por zonas horarias
  const formatearFechaParaInput = (fechaStr: string) => {
    if (!fechaStr) return "";
    try {
      const [ano, mes, dia] = fechaStr.split('T')[0].split('-');
      return `${dia}/${mes}/${ano}`;
    } catch {
      return "";
    }
  };

  const [formData, setFormData] = useState({
    nombreCompleto: paciente.nombreCompleto || "",
    fechaNacimiento: formatearFechaParaInput(paciente.fechaNacimiento),
    sexo: paciente.sexo || "M",
    telefono: paciente.telefono || "",
    correo: paciente.correo || "",
    direccion: paciente.direccion || "",
    observaciones: paciente.observaciones || ""
  });

  const calcularEdad = (fechaNac: string) => {
    if (!fechaNac) return "N/A";
    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const guardarCambios = async () => {
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(formData.fechaNacimiento)) {
      toast.error("Formato de fecha inválido. Use DD/MM/AAAA");
      return;
    }
    const [dia, mes, ano] = formData.fechaNacimiento.split('/');
    const fechaISO = `${ano}-${mes}-${dia}`;

    setGuardando(true);
    try {
      const data = await fetchJSON(`/api/pacientes/${paciente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, fechaNacimiento: fechaISO })
      });

      toast.success("¡Datos del paciente actualizados!");
      setIsEditing(false);
      onActualizarPaciente(data); // Avisamos al componente padre
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setGuardando(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white border-2 border-[#0071E3]/30 rounded-[24px] p-6 relative shadow-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
          <Edit2 className="text-[#0071E3]" size={20} />
          <h3 className="font-bold text-[#1D1D1F]">Editando Paciente {paciente.cedula && `(C.I: ${paciente.cedula})`}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nombre Completo</label>
            <input type="text" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} className="w-full px-3 py-2 bg-[#F5F5F7] border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#0071E3]/20" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nacimiento (DD/MM/AAAA)</label>
            <input type="text" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} placeholder="Ej: 25/08/1990" className="w-full px-3 py-2 bg-[#F5F5F7] border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#0071E3]/20" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sexo</label>
            <select name="sexo" value={formData.sexo} onChange={handleChange} className="w-full px-3 py-2 bg-[#F5F5F7] border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#0071E3]/20">
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Teléfono</label>
            <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-3 py-2 bg-[#F5F5F7] border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#0071E3]/20" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Correo</label>
            <input type="email" name="correo" value={formData.correo} onChange={handleChange} className="w-full px-3 py-2 bg-[#F5F5F7] border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#0071E3]/20" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Dirección</label>
            <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="w-full px-3 py-2 bg-[#F5F5F7] border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#0071E3]/20" />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Observaciones Médicas</label>
            <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} rows={2} className="w-full px-3 py-2 bg-[#F5F5F7] border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#0071E3]/20 resize-none" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button onClick={() => setIsEditing(false)} disabled={guardando} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-2">
            <Ban size={16} /> Cancelar
          </button>
          <button onClick={guardarCambios} disabled={guardando} className="px-5 py-2 text-sm font-bold text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50">
            {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    );
  }

  // VISTA NORMAL (Con botón de editar añadido)
  return (
    <div className="bg-[#F5F5F7] border border-slate-200/60 rounded-[20px] p-6 relative flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
      
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button 
          onClick={() => setIsEditing(true)}
          className="p-2 text-slate-400 hover:text-[#0071E3] hover:bg-blue-50 rounded-full transition-colors"
          title="Editar datos del paciente"
        >
          <Edit2 size={18} strokeWidth={2.5} />
        </button>
        <button 
          onClick={limpiarSeleccion}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          title="Cambiar paciente"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>
      
      <div className="flex items-center gap-5">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${paciente.esBebe ? 'bg-orange-100 text-orange-600' : 'bg-[#0071E3]/10 text-[#0071E3]'}`}>
          {paciente.esBebe ? <Baby size={28} strokeWidth={2.5} /> : <User size={28} strokeWidth={2.5} />}
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#1D1D1F] flex items-center gap-2">
            {paciente.nombreCompleto}
            <UserCheck size={18} className="text-green-500" strokeWidth={3} />
          </h3>
          <div className="flex items-center gap-3 mt-1 text-sm font-medium text-slate-500">
            {!paciente.esBebe && (
              <><span>C.I: {paciente.cedula}</span> <span className="w-1 h-1 bg-slate-300 rounded-full"></span></>
            )}
            <span>{calcularEdad(paciente.fechaNacimiento)} {paciente.esBebe ? 'Meses/Días' : 'Años'}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>{paciente.sexo === 'M' ? 'Masculino' : 'Femenino'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}