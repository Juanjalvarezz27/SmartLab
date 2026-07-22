"use client";

import { Baby, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";

interface FormularioPacienteProps {
  formData: any;
  setFormData: (data: any) => void;
  registrarNuevoPaciente: (e: React.FormEvent) => void;
  guardandoPaciente: boolean;
  limpiarSeleccion: () => void;
}

export default function FormularioPaciente({
  formData,
  setFormData,
  registrarNuevoPaciente,
  guardandoPaciente,
  limpiarSeleccion
}: FormularioPacienteProps) {

  // Máscara para borrar letras al instante
  const handleSoloNumeros = (campo: string, valor: string) => {
    setFormData({ ...formData, [campo]: valor.replace(/\D/g, '') });
  };

  // Evitar letras en Nombres (permite espacios)
  const handleSoloLetras = (campo: string, valor: string) => {
    setFormData({ ...formData, [campo]: valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') });
  };

  // Máscara automática para formato DD/MM/AAAA
  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Solo deja números
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
    if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9);
    setFormData({ ...formData, fechaNacimiento: val });
  };

  // Validación extra antes de enviar al padre
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar Fecha
    if (formData.fechaNacimiento.length !== 10) {
      toast.warning("La fecha de nacimiento debe tener el formato DD/MM/AAAA completo.");
      return;
    }

    const anioNacimiento = parseInt(formData.fechaNacimiento.substring(6, 10));
    const anioActual = new Date().getFullYear();

    if (anioNacimiento < 1900) {
      toast.error("Año de nacimiento inválido (No puede ser menor a 1900).");
      return;
    }

    if (anioNacimiento > anioActual) {
      toast.error(`Año de nacimiento inválido (No puede ser mayor al año en curso: ${anioActual}).`);
      return;
    }

    // Validar Teléfono (opcional, pero si lo ponen, que sea lógico en Venezuela)
    if (formData.telefono && formData.telefono.length < 10) {
      toast.warning("Si ingresa un teléfono, debe tener al menos 10 dígitos (Ej. 04141234567).");
      return;
    }

    // Si todo está bien, llamamos a la función original
    registrarNuevoPaciente(e);
  };

  return (
    <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={limpiarSeleccion}
            className="p-2 bg-[#F5F5F7] hover:bg-slate-200 text-slate-600 rounded-full transition-colors border border-slate-200/60"
            title="Volver al buscador"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <h3 className="text-lg font-bold text-[#1D1D1F]">Registro de Nuevo Paciente</h3>
        </div>
        
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-colors ${formData.esBebe ? 'bg-orange-50/50 border-orange-100' : 'bg-slate-50 border-slate-100'}`}>
          <Baby size={18} className={formData.esBebe ? "text-orange-500" : "text-slate-400"} />
          <span className={`text-sm font-bold uppercase tracking-wider ${formData.esBebe ? "text-orange-600" : "text-slate-500"}`}>
            Paciente Sin Cédula
          </span>
          <button
            type="button"
            onClick={() => setFormData({...formData, esBebe: !formData.esBebe, cedula: ""})}
            className={`w-12 h-6 rounded-full transition-colors relative shadow-inner flex items-center ${formData.esBebe ? 'bg-orange-500' : 'bg-slate-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute shadow-sm transition-transform duration-300 ease-in-out ${formData.esBebe ? 'translate-x-[26px]' : 'translate-x-[2px]'}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* --- FILA 1 --- */}
        {!formData.esBebe && (
          <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
            <label className="text-[11px] font-bold text-[#1D1D1F]/50 uppercase ml-2 tracking-[0.15em]">Cédula *</label>
            <input
              type="text"
              required
              maxLength={12}
              value={formData.cedula}
              onChange={(e) => handleSoloNumeros('cedula', e.target.value)}
              placeholder="Ej. 24123456"
              className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-2xl text-[#1D1D1F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]/50"
            />
          </div>
        )}

        <div className={`flex flex-col gap-1.5 ${formData.esBebe ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          <label className="text-[11px] font-bold text-[#1D1D1F]/50 uppercase ml-2 tracking-[0.15em]">Nombre Completo *</label>
          <input
            type="text"
            required
            value={formData.nombreCompleto}
            onChange={(e) => handleSoloLetras('nombreCompleto', e.target.value)}
            placeholder="Nombres y Apellidos"
            className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-2xl text-[#1D1D1F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]/50"
          />
        </div>

        {/* --- FILA 2 --- */}
        {/* Campo de Fecha con Máscara */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-[#1D1D1F]/50 uppercase ml-2 tracking-[0.15em]">Nacimiento (DD/MM/AAAA) *</label>
          <input
            type="text"
            required
            maxLength={10}
            value={formData.fechaNacimiento}
            onChange={handleFechaChange}
            placeholder="01/12/1990"
            className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-2xl text-[#1D1D1F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]/50 placeholder:text-slate-400"
          />
        </div>

        {/* Segmented Control para Sexo (Estilo iOS) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-[#1D1D1F]/50 uppercase ml-2 tracking-[0.15em]">Sexo *</label>
          <div className="flex p-1 bg-[#F5F5F7] border border-slate-200/60 rounded-2xl w-full">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, sexo: "M" })}
              className={`flex-1 py-2 text-sm font-bold rounded-[12px] transition-all duration-200 ${
                formData.sexo === "M"
                  ? "bg-white text-[#0071E3] shadow-sm border border-slate-200/50"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Masculino
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, sexo: "F" })}
              className={`flex-1 py-2 text-sm font-bold rounded-[12px] transition-all duration-200 ${
                formData.sexo === "F"
                  ? "bg-white text-pink-500 shadow-sm border border-slate-200/50"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Femenino
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-[#1D1D1F]/50 uppercase ml-2 tracking-[0.15em]">Teléfono</label>
          <input
            type="text"
            maxLength={11}
            value={formData.telefono}
            onChange={(e) => handleSoloNumeros('telefono', e.target.value)}
            placeholder="04141234567"
            className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-2xl text-[#1D1D1F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]/50"
          />
        </div>

        {/* --- FILA 3 (Nuevos campos) --- */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-[#1D1D1F]/50 uppercase ml-2 tracking-[0.15em]">Correo Electrónico</label>
          <input
            type="email"
            value={formData.correo}
            onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
            placeholder="paciente@correo.com"
            className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-2xl text-[#1D1D1F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]/50"
          />
        </div>

        <div className="flex flex-col gap-1.5 lg:col-span-2">
          <label className="text-[11px] font-bold text-[#1D1D1F]/50 uppercase ml-2 tracking-[0.15em]">Dirección</label>
          <input
            type="text"
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            placeholder="Sector, Calle, Casa/Apto"
            className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-2xl text-[#1D1D1F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]/50"
          />
        </div>

        {/* --- FILA 4 (Observaciones) --- */}
        <div className="flex flex-col gap-1.5 lg:col-span-3">
          <label className="text-[11px] font-bold text-[#1D1D1F]/50 uppercase ml-2 tracking-[0.15em]">Observaciones Médicas / Notas</label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            placeholder="Alergias, condiciones especiales, requerimientos para la toma de muestra..."
            rows={2}
            className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-2xl text-[#1D1D1F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]/50 resize-none"
          />
        </div>

      </div>

      <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button 
          type="button" 
          onClick={limpiarSeleccion}
          className="px-6 py-3 bg-slate-100 text-slate-600 font-semibold rounded-2xl hover:bg-slate-200 transition-colors"
        >
          Volver al buscador
        </button>
        <button 
          type="submit"
          disabled={guardandoPaciente}
          className="px-8 py-3 bg-[#0071E3] text-white font-semibold rounded-2xl shadow-[0_4px_12px_rgba(0,113,227,0.2)] hover:bg-[#0077ED] transition-all disabled:opacity-50"
        >
          {guardandoPaciente ? "Guardando..." : "Guardar y Continuar"}
        </button>
      </div>
    </form>
  );
}