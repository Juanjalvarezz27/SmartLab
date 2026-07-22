"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building2, User, Save, ArrowLeft, Loader2, ImagePlus, X } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import Image from "next/image";
import { compressImage } from "@/lib/imageUtils";

export default function NuevoLaboratorioPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor sube un archivo de imagen válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('La imagen no puede pesar más de 5MB');
      return;
    }

    try {
      // Comprimimos el logo a un ancho máximo de 300px
      const compressedBase64 = await compressImage(file, 300);
      setLogoBase64(compressedBase64);
    } catch (error) {
      toast.error('Hubo un error al procesar la imagen');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCargando(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Add logo to payload
    if (logoBase64) {
      data.logoBase64 = logoBase64;
    }

    try {
      const response = await fetch("/api/laboratorios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ocurrió un error al crear el laboratorio");
      }

      toast.success("Laboratorio y usuario administrador creados con éxito");
      router.push("/superadmin");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
      setCargando(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full pb-20 font-sans selection:bg-blue-100">
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link 
          href="/superadmin"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft size={16} />
          <span>Volver al listado</span>
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Building2 className="text-blue-600" size={32} />
          Nuevo Laboratorio (Tenant)
        </h1>
        <p className="text-slate-500 mt-1 font-medium">Registra un nuevo cliente y configúrale su cuenta de administrador principal.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* BLOQUE 1: DATOS DEL LABORATORIO */}
        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
          
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner">
              <Building2 className="text-blue-600 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Datos del Laboratorio</h2>
              <p className="text-sm text-slate-500 font-medium">Información comercial y de contacto del cliente.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Logo Upload Section */}
            <div className="col-span-1 md:col-span-12 flex items-center gap-6 mb-2">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-28 h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 ${logoBase64 ? 'border-transparent shadow-md' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 bg-slate-50'}`}
              >
                {logoBase64 ? (
                  <>
                    <Image src={logoBase64} alt="Logo preview" fill className="object-contain p-2" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Cambiar</span>
                    </div>
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Subir Logo</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Logotipo del Laboratorio</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">Este logo será procesado, comprimido (WebP) y usado en facturas, resultados e interfaz del cliente.</p>
                {logoBase64 && (
                  <button 
                    type="button" 
                    onClick={() => setLogoBase64(null)}
                    className="text-xs text-red-500 font-bold hover:text-red-600 mt-2 flex items-center gap-1"
                  >
                    <X size={14} /> Remover logo
                  </button>
                )}
              </div>
            </div>

            <div className="col-span-1 md:col-span-8 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Comercial *</label>
              <input 
                type="text" 
                name="labNombre" 
                required 
                placeholder="Ej. Laboratorio Clínico San José" 
                className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm" 
              />
            </div>
            
            <div className="col-span-1 md:col-span-4 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">RIF / Identificación</label>
              <input 
                type="text" 
                name="labRif" 
                placeholder="Ej. J-12345678-9" 
                className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm" 
              />
            </div>

            <div className="col-span-1 md:col-span-6 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono Principal</label>
              <input 
                type="text" 
                name="labTelefono" 
                placeholder="Ej. 0414-0000000" 
                className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm" 
              />
            </div>

            <div className="col-span-1 md:col-span-6 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Correo Electrónico (Contacto)</label>
              <input 
                type="email" 
                name="labCorreo" 
                placeholder="contacto@laboratoriosanjose.com" 
                className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm" 
              />
            </div>

            <div className="col-span-1 md:col-span-12 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección Física</label>
              <textarea 
                name="labDireccion" 
                rows={2}
                placeholder="Dirección completa del establecimiento" 
                className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none shadow-sm" 
              />
            </div>
          </div>
        </div>

        {/* BLOQUE 2: DATOS DEL USUARIO ADMIN */}
        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-400"></div>

          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-inner">
              <User className="text-indigo-600 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Usuario Administrador</h2>
              <p className="text-sm text-slate-500 font-medium">Credenciales de acceso para el dueño o director.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="col-span-1 md:col-span-12 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre del Responsable *</label>
              <input 
                type="text" 
                name="adminNombre" 
                required 
                placeholder="Ej. Dr. Juan Pérez" 
                className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm" 
              />
            </div>

            <div className="col-span-1 md:col-span-6 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Correo de Acceso (Login) *</label>
              <input 
                type="email" 
                name="adminCorreo" 
                required 
                placeholder="admin@laboratoriosanjose.com" 
                className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm" 
              />
            </div>

            <div className="col-span-1 md:col-span-6 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contraseña Inicial *</label>
              <input 
                type="text" 
                name="adminClave" 
                required 
                placeholder="Mínimo 6 caracteres" 
                className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm" 
              />
              <p className="text-[11px] text-slate-400 font-medium mt-1">Esta será la clave con la que el cliente ingresará al sistema por primera vez.</p>
            </div>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="flex justify-end gap-4 pt-4">
          <Link 
            href="/superadmin"
            className="px-6 py-4 rounded-xl font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </Link>
          <button 
            type="submit" 
            disabled={cargando}
            className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
          >
            {cargando ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            <span>{cargando ? 'Registrando Tenant...' : 'Crear Laboratorio'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
