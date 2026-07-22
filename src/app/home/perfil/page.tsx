"use client";

import { useState, useEffect, useRef } from "react";
import { UserCog, Lock, KeyRound, UploadCloud, Save, Image as ImageIcon, CheckCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";

export default function PerfilPage() {
  const { data: session } = useSession();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    tienePin: false,
    pinActual: "",
    nuevoPin: "",
    firmaUrl: "",
    mpps: "",
    col: "",
    claveActual: "",
    nuevaClave: "",
    confirmarClave: "",
  });

  const [mostrarClaveActual, setMostrarClaveActual] = useState(false);
  const [mostrarNuevaClave, setMostrarNuevaClave] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await fetch("/api/perfil");
        if (!res.ok) throw new Error("Error al cargar datos");
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          nombre: data.nombre || "",
          correo: data.correo || "",
          tienePin: !!data.pinFirma,
          firmaUrl: data.firmaUrl || "",
          mpps: data.mpps || "",
          col: data.col || "",
        }));
      } catch (error: any) {
        toast.error(error?.message ? `No se pudo cargar la información del perfil.: ${error?.message}` : "No se pudo cargar la información del perfil.");
      } finally {
        setCargando(false);
      }
    };
    fetchPerfil();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de imagen válido.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_WIDTH) {
          const scaleSize = MAX_WIDTH / img.width;
          width = MAX_WIDTH;
          height = img.height * scaleSize;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/png");
          setFormData(prev => ({ ...prev, firmaUrl: compressedBase64 }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'pinActual' | 'nuevoPin') => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 4) {
      setFormData(prev => ({ ...prev, [field]: val }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.nuevaClave && formData.nuevaClave !== formData.confirmarClave) {
      toast.error("Las nuevas contraseñas no coinciden.");
      return;
    }

    if (formData.nuevoPin && formData.nuevoPin.length !== 4) {
      toast.error("El nuevo PIN debe tener exactamente 4 dígitos.");
      return;
    }

    if (formData.tienePin && formData.nuevoPin && formData.pinActual.length !== 4) {
      toast.error("Debe ingresar su PIN actual para poder cambiarlo.");
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        nombre: formData.nombre,
        firmaUrl: formData.firmaUrl,
        mpps: formData.mpps,
        col: formData.col,
        ...(formData.nuevoPin && {
          pinActual: formData.pinActual,
          nuevoPin: formData.nuevoPin
        }),
        ...(formData.nuevaClave && { 
          claveActual: formData.claveActual, 
          nuevaClave: formData.nuevaClave 
        })
      };

      const res = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Perfil actualizado correctamente.");
      setFormData(prev => ({ 
        ...prev, 
        claveActual: "", 
        nuevaClave: "", 
        confirmarClave: "",
        pinActual: "",
        nuevoPin: "",
        tienePin: !!(prev.tienePin || formData.nuevoPin)
      }));
    } catch (error: any) {
      toast.error(error.message ? `Ocurrió un error al guardar.: ${error.message}` : "Ocurrió un error al guardar.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <div className="p-8 text-center text-slate-500 font-bold">Cargando configuración...</div>;

  return (
    <div className="h-full flex flex-col pb-10 overflow-y-auto pr-4 outline-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
      
      {/* CABECERA */}
      <div className="mb-8">
        <h1 className="font-title text-4xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
          <UserCog className="text-[#0071E3]" size={36} strokeWidth={2.5} />
          Configuración de Perfil
        </h1>
        <p className="text-[#86868B] mt-2 font-medium text-[15px]">
          Gestiona tus datos personales, contraseña y credenciales de validación médica.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-[1400px] space-y-6">
        
        {/* --- FILA 1: DATOS Y SEGURIDAD --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* BLOQUE 1: DATOS PERSONALES */}
          <div className="bg-white border border-slate-200/80 rounded-[24px] p-8 shadow-sm flex flex-col h-full">
            <h2 className="text-lg font-black text-[#1D1D1F] flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 shrink-0">
              <UserCog size={20} className="text-[#0071E3]" /> Datos Personales
            </h2>
            
            <div className="space-y-5 flex-1">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1.5 block">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
                />
              </div>
              
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1.5 block">Correo Electrónico (No editable)</label>
                <input
                  type="email"
                  value={formData.correo}
                  disabled
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200/60 rounded-xl text-[15px] font-medium text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* BLOQUE 2: SEGURIDAD Y CONTRASEÑA */}
          <div className="bg-white border border-slate-200/80 rounded-[24px] p-8 shadow-sm flex flex-col h-full">
            <h2 className="text-lg font-black text-[#1D1D1F] flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 shrink-0">
              <Lock size={20} className="text-[#0071E3]" /> Seguridad de Acceso
            </h2>
            
            <div className="space-y-5 flex-1">
              <div className="relative">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1.5 block">Contraseña Actual</label>
                <input
                  type={mostrarClaveActual ? "text" : "password"}
                  value={formData.claveActual}
                  onChange={e => setFormData({...formData, claveActual: e.target.value})}
                  placeholder="Obligatorio si deseas cambiarla"
                  className="w-full pl-4 pr-12 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
                />
                <button type="button" onClick={() => setMostrarClaveActual(!mostrarClaveActual)} className="absolute right-4 top-[30px] text-slate-400 hover:text-slate-600">
                  {mostrarClaveActual ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1.5 block">Nueva Clave</label>
                  <input
                    type={mostrarNuevaClave ? "text" : "password"}
                    value={formData.nuevaClave}
                    onChange={e => setFormData({...formData, nuevaClave: e.target.value})}
                    className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
                  />
                  <button type="button" onClick={() => setMostrarNuevaClave(!mostrarNuevaClave)} className="absolute right-4 top-[30px] text-slate-400 hover:text-slate-600">
                    {mostrarNuevaClave ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1.5 block">Confirmar</label>
                  <input
                    type={mostrarNuevaClave ? "text" : "password"}
                    value={formData.confirmarClave}
                    onChange={e => setFormData({...formData, confirmarClave: e.target.value})}
                    className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- FILA 2: CREDENCIALES MÉDICAS --- */}
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-8 shadow-sm">
          <h2 className="text-lg font-black text-[#1D1D1F] flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 shrink-0">
            <KeyRound size={20} className="text-[#0071E3]" /> Credenciales de Validación (Bioanalista)
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* PIN DE FIRMA (IZQUIERDA) */}
            <div className="bg-orange-50/50 border border-orange-100 rounded-3xl p-6 md:p-8 flex flex-col h-full justify-between">
              <div>
                <h3 className="font-black text-xl text-orange-600 mb-2">PIN de Firma Rápida</h3>
                <p className="text-[14px] text-orange-600/80 font-medium mb-6 leading-relaxed max-w-lg">
                  Este PIN de 4 dígitos te permitirá firmar y validar resultados rápidamente en la pantalla de la asistente sin tener que iniciar sesión.
                </p>
              </div>
              
              <div className="flex flex-row flex-wrap gap-6 items-center mt-auto justify-center">
                {formData.tienePin && (
                  <div>
                    <label className="text-[11px] font-bold text-orange-600/80 uppercase tracking-widest ml-1 mb-2 block">PIN Actual</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={formData.pinActual}
                      onChange={(e) => handlePinChange(e, 'pinActual')}
                      placeholder="****"
                      className="w-36 text-center tracking-[0.5em] placeholder:tracking-normal placeholder:text-base placeholder:font-medium px-4 py-3.5 bg-white border border-orange-200 rounded-xl text-2xl font-black text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-[11px] font-bold text-orange-600/80 uppercase tracking-widest ml-1 mb-2 block">
                    {formData.tienePin ? "Nuevo PIN" : "Crear PIN"}
                  </label>
                  <div className="relative w-36">
                    <input
                      type="password"
                      maxLength={4}
                      value={formData.nuevoPin}
                      onChange={(e) => handlePinChange(e, 'nuevoPin')}
                      placeholder="1234"
                      className="w-full pr-10 text-center tracking-[0.5em] placeholder:tracking-normal placeholder:text-base placeholder:font-medium px-4 py-3.5 bg-white border border-orange-200 rounded-xl text-2xl font-black text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                    {formData.nuevoPin.length === 4 && (
                      <CheckCircle size={20} strokeWidth={2.5} className="text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* FIRMA DIGITAL (DERECHA) */}
            <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-6 md:p-8 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6 shrink-0">
                <div>
                  <h3 className="font-black text-xl text-slate-700 mb-2">Firma Digital</h3>
                  <p className="text-[14px] text-slate-500 leading-relaxed max-w-md">
                    Sube una imagen <span className="font-bold text-slate-700">(PNG fondo transparente)</span> de tu firma. Se estampará en los PDF.
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-[#0071E3] text-sm font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <UploadCloud size={18} strokeWidth={2.5} /> Subir Imagen
                </button>
              </div>

              {/* CONTENEDOR CENTRADO PARA QUE LA FIRMA NO SE ESTIRE */}
              <div className="flex-1 flex items-center justify-center">
                <div 
                  className="w-full max-w-sm h-40 bg-white border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center relative overflow-hidden group cursor-pointer" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.firmaUrl ? (
                    <img src={formData.firmaUrl} alt="Firma" className="max-w-full max-h-full object-contain p-4" />
                  ) : (
                    <div className="text-center text-slate-400 flex flex-col items-center p-6">
                      <ImageIcon size={32} className="mb-2 opacity-50" />
                      <span className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Haz clic para buscar tu firma</span>
                    </div>
                  )}
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-[#0071E3]/5 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-[#0071E3] shadow-sm flex items-center gap-2">
                      <UploadCloud size={18} /> Reemplazar Firma
                    </span>
                  </div>
                </div>
              </div>

              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

              {/* CREDENCIALES MPPS y COL */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">MPPS</label>
                  <input
                    type="text"
                    value={formData.mpps}
                    onChange={e => setFormData({...formData, mpps: e.target.value})}
                    placeholder="Ej. 12345"
                    className="w-full px-4 py-2 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Colegio (Col)</label>
                  <input
                    type="text"
                    value={formData.col}
                    onChange={e => setFormData({...formData, col: e.target.value})}
                    placeholder="Ej. 54321"
                    className="w-full px-4 py-2 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* BOTÓN DE GUARDAR GLOBAL */}
        <div className="flex justify-end pt-6 mt-6 border-t border-slate-200/60">
          <button 
            type="submit" 
            disabled={guardando}
            className="flex items-center gap-2 bg-[#0071E3] text-white px-10 py-4 rounded-2xl font-black shadow-[0_4px_16px_rgba(0,113,227,0.25)] hover:bg-[#0077ED] transition-all disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Save size={20} strokeWidth={2.5} />
            {guardando ? "Guardando cambios..." : "Guardar Configuración"}
          </button>
        </div>

      </form>
    </div>
  );
}