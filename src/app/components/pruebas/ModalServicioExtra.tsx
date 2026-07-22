"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface ModalServicioExtraProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  itemEditar: any;
}

export default function ModalServicioExtra({ isOpen, onClose, onSave, itemEditar }: ModalServicioExtraProps) {
  const [formData, setFormData] = useState({ 
    nombre: "", precioUSD: "" 
  });

  useEffect(() => {
    if (itemEditar) {
      setFormData({
        nombre: itemEditar.nombre,
        precioUSD: itemEditar.precioUSD.toString()
      });
    } else {
      setFormData({
        nombre: "",
        precioUSD: ""
      });
    }
  }, [itemEditar, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/10">
      <div className="bg-white border border-slate-200 w-full max-w-[500px] rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-100">
        
        <div className="p-6 pb-4 flex justify-between items-center border-b border-slate-100">
          <div>
            <h3 className="font-title text-xl font-bold text-[#1D1D1F]">
              {itemEditar ? "Editar Servicio Extra" : "Nuevo Servicio Extra"}
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {itemEditar ? (
                <>Modificando servicio <span className="font-bold text-[#0071E3]">{itemEditar.nombre}</span></>
              ) : (
                "Ingrese los datos del nuevo servicio"
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 bg-slate-100 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre del Servicio</label>
            <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none" placeholder="Ej. Recargo a Domicilio" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Precio ($)</label>
            <input type="number" step="0.01" required value={formData.precioUSD} onChange={(e) => setFormData({ ...formData, precioUSD: e.target.value })} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none" placeholder="0.00" />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 py-3.5 bg-[#0071E3] text-white font-bold rounded-xl hover:bg-[#0077ED] shadow-md transition-colors">{itemEditar ? "Guardar Cambios" : "Crear Servicio"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
