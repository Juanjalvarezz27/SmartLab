"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, Image as ImageIcon, Loader2, Save } from "lucide-react";
import Image from "next/image";
import { compressImage } from "@/lib/imageUtils";
import { toast } from "react-toastify";

interface ModalEditarConfigProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  datosActuales: any;
}

export default function ModalEditarConfig({ isOpen, onClose, onSaveSuccess, datosActuales }: ModalEditarConfigProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    rif: "",
    telefono: "",
    correo: "",
    direccion: "",
    ciudad: "",
    estado: "",
    logoBase64: "",
  });
  
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && datosActuales) {
      setFormData({
        nombre: datosActuales.nombre || "",
        rif: datosActuales.rif || "",
        telefono: datosActuales.telefono || "",
        correo: datosActuales.correo || "",
        direccion: datosActuales.direccion || "",
        ciudad: datosActuales.ciudad || "",
        estado: datosActuales.estado || "",
        logoBase64: datosActuales.logoBase64 || "",
      });
      setPreviewLogo(datosActuales.logoBase64 || null);
    }
  }, [isOpen, datosActuales]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressImage(file);
      setPreviewLogo(base64);
      setFormData({ ...formData, logoBase64: base64 });
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar la imagen");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const res = await fetch("/api/laboratorios/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Configuración actualizada correctamente");
        onSaveSuccess();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al actualizar");
      }
    } catch (error) {
      toast.error("Error de red al actualizar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-6 pb-4 flex justify-between items-center border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div>
            <h3 className="font-title text-xl font-bold text-[#1D1D1F]">
              Editar Configuración
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Modifica los datos y la identidad visual de tu laboratorio
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 bg-slate-100 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col overflow-hidden">
          <div className="p-6 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* COLUMNA IZQUIERDA: LOGO */}
              <div className="w-full md:w-1/3 flex flex-col gap-3">
                <label className="text-sm font-bold text-slate-700">Logo del Laboratorio</label>
                <div 
                  className={`w-full aspect-square rounded-3xl border-2 border-dashed ${previewLogo ? 'border-slate-200 bg-white' : 'border-slate-300 bg-slate-50 hover:bg-blue-50 hover:border-blue-300'} flex flex-col items-center justify-center relative overflow-hidden group transition-all cursor-pointer shadow-sm`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewLogo ? (
                    <>
                      <Image src={previewLogo} alt="Logo Laboratorio" fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                        <span className="bg-white text-slate-900 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg">
                          <Upload size={16} /> Cambiar
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-blue-500 transition-colors px-6 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:shadow-blue-100 transition-all">
                        <ImageIcon size={32} strokeWidth={1.5} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-sm">Haz clic para subir logo</p>
                      </div>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" />
                <p className="text-[11px] text-slate-400 text-center font-medium leading-relaxed">
                  Formatos soportados: PNG, JPG, WEBP. Max 5MB (será optimizado automáticamente).
                </p>
              </div>

              {/* COLUMNA DERECHA: DATOS */}
              <div className="w-full md:w-2/3 flex flex-col gap-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700">Nombre del Laboratorio</label>
                    <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none" placeholder="Ej. Laboratorio San José" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700">RIF / Identificación Fiscal</label>
                    <input type="text" name="rif" required value={formData.rif} onChange={handleChange} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none" placeholder="Ej. J-12345678-9" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700">Teléfono</label>
                    <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none" placeholder="Ej. +58 412 1234567" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700">Correo Electrónico</label>
                    <input type="email" name="correo" value={formData.correo} onChange={handleChange} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none" placeholder="Ej. contacto@laboratorio.com" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">Dirección Completa</label>
                  <textarea name="direccion" value={formData.direccion} onChange={handleChange} rows={3} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none resize-none" placeholder="Dirección exacta del laboratorio" />
                </div>

              </div>
            </div>

          </div>

          <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
            <button type="button" onClick={onClose} disabled={guardando} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="px-6 py-3 bg-[#0071E3] text-white font-semibold rounded-xl shadow-sm hover:bg-[#0077ED] shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-70">
              {guardando ? (
                <><Loader2 size={18} className="animate-spin" /> Guardando...</>
              ) : (
                <><Save size={18} /> Guardar Cambios</>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
