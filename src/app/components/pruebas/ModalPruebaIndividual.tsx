"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface ModalPruebaIndividualProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  itemEditar: any;
}

export default function ModalPruebaIndividual({ isOpen, onClose, onSave, itemEditar }: ModalPruebaIndividualProps) {
  const [formData, setFormData] = useState<{
    codigo: string, nombre: string, precioUSD: string, unidades: string, valoresReferencia: string,
    opcionesPredefinidas: string[], mostrarOpciones: boolean,
    categoriaVisual: string, subcategoriaVisual: string
  }>({ 
    codigo: "", nombre: "", precioUSD: "", unidades: "", valoresReferencia: "",
    opcionesPredefinidas: [], mostrarOpciones: false,
    categoriaVisual: "", subcategoriaVisual: ""
  });

  useEffect(() => {
    if (itemEditar) {
      const opcs = itemEditar.opcionesPredefinidas ? itemEditar.opcionesPredefinidas.split(',').filter(Boolean) : [];
      setFormData({
        codigo: itemEditar.codigo,
        nombre: itemEditar.nombre,
        precioUSD: itemEditar.precioUSD?.toString() || "0",
        unidades: itemEditar.unidades || "",
        valoresReferencia: itemEditar.valoresReferencia || "",
        opcionesPredefinidas: opcs,
        mostrarOpciones: opcs.length > 0,
        categoriaVisual: itemEditar.categoriaVisual || "",
        subcategoriaVisual: itemEditar.subcategoriaVisual || ""
      });
    }
  }, [itemEditar, isOpen]);

  if (!isOpen || !itemEditar) return null;

  const toggleMostrar = (campo: 'mostrarOpciones') => {
    setFormData(prev => ({ ...prev, [campo]: !prev[campo] }));
  };

  const addTag = (campo: 'opcionesPredefinidas', valor: string) => {
    const trimmed = valor.trim();
    if (!trimmed) return;
    setFormData(prev => {
      if (!prev[campo].includes(trimmed)) {
        return { ...prev, [campo]: [...prev[campo], trimmed] };
      }
      return prev;
    });
  };

  const removeTag = (campo: 'opcionesPredefinidas', index: number) => {
    setFormData(prev => ({
      ...prev,
      [campo]: prev[campo].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      valoresReferencia: formData.valoresReferencia || null,
      opcionesPredefinidas: formData.opcionesPredefinidas.length > 0 ? formData.opcionesPredefinidas.join(',') : null
    });
  };

  return (
    // Removido el backdrop-blur y el fondo pesado para máxima velocidad
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/10">
      <div className="bg-white border border-slate-200 w-full max-w-[600px] rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-100 flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-6 pb-4 flex justify-between items-center border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-title text-xl font-bold text-[#1D1D1F]">Editar Prueba</h3>
            {/* Ahora muestra el nombre en lugar del código */}
            <p className="text-sm font-medium text-slate-500 mt-1">
              Modificando valores de <span className="font-bold text-[#0071E3]">{itemEditar.nombre}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 bg-slate-100 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="flex gap-4">
            <div className="w-1/3 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Código</label>
              <input type="text" required value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none" />
            </div>
            <div className="w-2/3 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Precio ($)</label>
              <input type="number" step="0.01" required value={formData.precioUSD} onChange={(e) => setFormData({ ...formData, precioUSD: e.target.value })} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre de la Prueba</label>
            <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none" />
          </div>

          <div className="flex gap-4">
            <div className="w-1/2 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Valores Referencia</label>
              <input type="text" value={formData.valoresReferencia} onChange={(e) => setFormData({ ...formData, valoresReferencia: e.target.value })} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none" placeholder="Vacío p/ llenado manual" />
            </div>
            <div className="w-1/2 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Unidades</label>
              <input type="text" value={formData.unidades} onChange={(e) => setFormData({ ...formData, unidades: e.target.value })} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none" />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-1/2 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Categoría Visual (Opcional)</label>
              <input type="text" value={formData.categoriaVisual} onChange={(e) => setFormData({ ...formData, categoriaVisual: e.target.value.toUpperCase() })} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none" placeholder="Ej. ORINA" />
            </div>
            <div className="w-1/2 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Subcategoría Visual (Opcional)</label>
              <input type="text" value={formData.subcategoriaVisual} onChange={(e) => setFormData({ ...formData, subcategoriaVisual: e.target.value.toUpperCase() })} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none" placeholder="Ej. ORINA COMPLETA" />
            </div>
          </div>

          <div className="flex gap-3 pt-2 mt-2 border-t border-slate-100">
            <button type="button" onClick={() => toggleMostrar('mostrarOpciones')} className={`flex-1 text-[11px] font-bold px-4 py-3 rounded-xl transition-all ${formData.mostrarOpciones ? 'bg-purple-100 text-purple-700 shadow-inner' : 'bg-[#F5F5F7] text-slate-500 hover:bg-purple-50 hover:text-purple-600'}`}>
              {formData.opcionesPredefinidas.length > 0 ? `✓ Opciones Cerradas (${formData.opcionesPredefinidas.length})` : '+ Opciones Cerradas'}
            </button>
          </div>

          {formData.mostrarOpciones && (
            <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 mt-2 animate-in fade-in">
              <label className="text-[11px] font-black text-purple-600 uppercase tracking-widest mb-3 block">Opciones Predefinidas</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.opcionesPredefinidas.map((opc, idx) => (
                  <span key={idx} className="flex items-center gap-2 bg-purple-200 text-purple-800 pl-3 pr-1 py-1 rounded-lg text-sm font-bold border border-purple-300">
                    {opc}
                    <button type="button" onClick={() => removeTag('opcionesPredefinidas', idx)} className="p-1 hover:bg-purple-300 rounded-md"><X size={14}/></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="Escribe y presiona Enter..." 
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('opcionesPredefinidas', e.currentTarget.value); e.currentTarget.value = ''; } }}
                  className="flex-1 px-4 py-2.5 bg-white border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button type="button" onClick={(e) => { const input = e.currentTarget.previousElementSibling as HTMLInputElement; addTag('opcionesPredefinidas', input.value); input.value = ''; }} className="px-4 py-2 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600">Añadir</button>
              </div>
            </div>
          )}
          </div>

          <div className="p-6 pt-4 flex gap-3 border-t border-slate-100 shrink-0 bg-white">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 py-3.5 bg-[#0071E3] text-white font-bold rounded-xl hover:bg-[#0077ED] shadow-md transition-colors">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}