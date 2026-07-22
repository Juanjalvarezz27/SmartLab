"use client";
import { X, Plus, Trash2, ChevronDown, ChevronUp, Loader2, Package, LayoutList, Search, Edit2, Check, GripVertical } from "lucide-react";
import { fetchJSON } from "@/lib/fetchWithRetry";
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent, closestCenter, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { normalizeSearchString } from "../../../lib/stringUtils";

const SortableRowModal = ({ id, children }: { id: string, children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : 'none', // Evitamos el "vuelo" al cambiar de grupo
    zIndex: isDragging ? 9999 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative group/drag ${isDragging ? 'opacity-50 shadow-2xl z-50' : 'z-10'}`}>
      <div 
        {...listeners} 
        {...attributes} 
        className="absolute left-[-26px] top-6 p-1.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-[#0071E3] opacity-0 group-hover/drag:opacity-100 transition-opacity"
      >
        <GripVertical size={16} />
      </div>
      {children}
    </div>
  );
};

const DroppableGroupModal = ({ id, children }: { id: string, children: React.ReactNode }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`transition-colors rounded-xl border border-transparent ${isOver ? 'bg-blue-50/50 border-blue-300 ring-4 ring-blue-100' : ''}`}>
      {children}
    </div>
  );
};

export default function ModalPrueba({ isOpen, onClose, onSave, pruebaEditar, categoriasExistentes, subcategoriasExistentes, catalogoExamenes = [] }: any) {
  const [formData, setFormData] = useState({ 
    categoria: "", 
    subcategoria: "", 
    esPaquete: false, 
    precioPaqueteUSD: "" 
  });
  const [pruebas, setPruebas] = useState<any[]>([]);
  
  const [openDropdownCategoria, setOpenDropdownCategoria] = useState(false);
  const [openDropdownSubcategoria, setOpenDropdownSubcategoria] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const dropdownCategoriaRef = useRef<HTMLDivElement>(null);
  const dropdownSubcategoriaRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [editingOption, setEditingOption] = useState<{pruebaIndex: number, optionIndex: number, tempValue: string} | null>(null);

  // Computar listado unificado para el buscador
  const individualTestsMap = new Map();
  catalogoExamenes.forEach((sub: any) => {
    (sub.pruebas || []).forEach((p: any) => {
      if (!individualTestsMap.has(p.codigo)) {
        individualTestsMap.set(p.codigo, {
          tipo: 'prueba',
          categoriaNombre: sub.categoria?.nombre || 'S/C',
          subcategoriaNombre: sub.nombre,
          ...p
        });
      }
    });
  });
  
  const pruebasIndividualesUnicas = Array.from(individualTestsMap.values());
  
  const subcategoriasYPaquetes = catalogoExamenes.map((cat: any) => ({
    tipo: cat.esPaquete ? 'paquete' : 'subcategoria',
    id: cat.id,
    nombre: cat.nombre,
    codigoCategoria: cat.categoria?.nombre || 'S/C',
    pruebas: cat.pruebas || []
  }));

  const busquedaUnificada = [...subcategoriasYPaquetes, ...pruebasIndividualesUnicas];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownCategoriaRef.current && !dropdownCategoriaRef.current.contains(event.target as Node)) {
        setOpenDropdownCategoria(false);
      }
      if (dropdownSubcategoriaRef.current && !dropdownSubcategoriaRef.current.contains(event.target as Node)) {
        setOpenDropdownSubcategoria(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showSearchResults && searchRef.current && searchQuery.trim() !== "") {
      setTimeout(() => {
        searchRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [showSearchResults, searchQuery]);

  useEffect(() => {
    if (pruebaEditar) {
      setFormData({ 
        categoria: pruebaEditar.categoria.nombre,
        subcategoria: pruebaEditar.nombre,
        esPaquete: pruebaEditar.esPaquete || false,
        precioPaqueteUSD: pruebaEditar.precioUSD ? pruebaEditar.precioUSD.toString() : ""
      });
      const pruebasOrdenadas = [...pruebaEditar.pruebas].sort((a: any, b: any) => (a.ordenVisual || 0) - (b.ordenVisual || 0));
      
      const grouped = pruebasOrdenadas.reduce((acc: any, p: any) => {
        const cat = (p.categoriaVisual || "SIN CATEGORIA").trim().toUpperCase();
        const sub = (p.subcategoriaVisual || "SIN SUBCATEGORIA").trim().toUpperCase();
        const key = `${cat}|${sub}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
      }, {} as Record<string, any[]>);
      
      const flatPruebas = Object.values(grouped).flat();

      setPruebas(flatPruebas.map((p: any) => ({
        tempId: p.id || Math.random().toString(36).substring(7),
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        precioUSD: p.precioUSD ? p.precioUSD.toString() : "",
        unidades: p.unidades || "",
        valoresReferencia: p.valoresReferencia || "",
        opcionesPredefinidas: p.opcionesPredefinidas ? p.opcionesPredefinidas.split(',').filter(Boolean) : [],
        mostrarOpciones: !!p.opcionesPredefinidas,
        categoriaVisual: p.categoriaVisual || "",
        subcategoriaVisual: p.subcategoriaVisual || ""
      })));
    } else {
      setFormData({ categoria: "", subcategoria: "", esPaquete: false, precioPaqueteUSD: "" });
      setPruebas([{ id: "", codigo: "", nombre: "", precioUSD: "", unidades: "", valoresReferencia: "", opcionesPredefinidas: [], mostrarOpciones: false, categoriaVisual: "", subcategoriaVisual: "" }]);
    }
    setGuardando(false);
  }, [pruebaEditar, isOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  if (!isOpen) return null;

  const agregarFila = () => {
    setPruebas([...pruebas, { 
      tempId: Math.random().toString(36).substring(7),
      id: "", 
      codigo: "", nombre: "", precioUSD: "", unidades: "", valoresReferencia: "", 
      opcionesPredefinidas: [], mostrarOpciones: false,
      categoriaVisual: "", subcategoriaVisual: "" 
    }]);
  };

  const eliminarFila = (index: number) => {
    if (pruebas.length === 1) {
      toast.warning("Debe existir al menos una prueba.");
      return;
    }
    const nuevas = [...pruebas];
    nuevas.splice(index, 1);
    setPruebas(nuevas);
  };

  const agregarAlListadoBusqueda = (item: any) => {
    if (item.tipo === 'paquete' || item.tipo === 'subcategoria') {
      const nuevasPruebas = item.pruebas.filter((p: any) => !pruebas.some((pr: any) => pr.codigo === p.codigo)).map((p: any) => ({
        tempId: Math.random().toString(36).substring(7),
        id: "",
        codigo: p.codigo, nombre: p.nombre, precioUSD: p.precioUSD ? p.precioUSD.toString() : "", 
        unidades: p.unidades || "", valoresReferencia: p.valoresReferencia || "", 
        opcionesPredefinidas: p.opcionesPredefinidas ? p.opcionesPredefinidas.split(',').filter(Boolean) : [], 
        mostrarOpciones: !!p.opcionesPredefinidas,
        categoriaVisual: p.categoriaVisual || item.codigoCategoria || "",
        subcategoriaVisual: p.subcategoriaVisual || item.nombre
      }));
      
      if (nuevasPruebas.length > 0) {
        setPruebas(prev => {
          const prevLimpio = (prev.length === 1 && !prev[0].codigo && !prev[0].nombre) ? [] : prev;
          return [...prevLimpio, ...nuevasPruebas];
        });
        toast.success(`Se agregaron ${nuevasPruebas.length} pruebas de ${item.nombre}`);
      } else {
        toast.info("Todas las pruebas de este grupo ya estaban agregadas.");
      }
    } else {
      if (!pruebas.some(pr => pr.codigo === item.codigo)) {
        setPruebas(prev => {
          const prevLimpio = (prev.length === 1 && !prev[0].codigo && !prev[0].nombre) ? [] : prev;
          return [...prevLimpio, { 
            tempId: Math.random().toString(36).substring(7),
            id: "",
            codigo: item.codigo, nombre: item.nombre, precioUSD: item.precioUSD ? item.precioUSD.toString() : "", 
            unidades: item.unidades || "", valoresReferencia: item.valoresReferencia || "", 
            opcionesPredefinidas: item.opcionesPredefinidas ? item.opcionesPredefinidas.split(',').filter(Boolean) : [], 
            mostrarOpciones: !!item.opcionesPredefinidas,
            categoriaVisual: item.categoriaNombre || item.codigoCategoria || "",
            subcategoriaVisual: item.subcategoriaNombre || item.nombre || ""
          }];
        });
      } else {
        toast.info("Esta prueba ya está en la lista.");
      }
    }
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const actualizarPrueba = (index: number, campo: string, valor: any) => {
    const nuevas = [...pruebas];
    nuevas[index][campo] = valor;
    setPruebas(nuevas);
  };

  const toggleMostrar = (index: number, campo: string) => {
    const nuevas = [...pruebas];
    nuevas[index][campo] = !nuevas[index][campo];
    setPruebas(nuevas);
  };

  const addTag = async (index: number, campo: string, valor: string) => {
    const trimmed = valor.trim();
    if (!trimmed) return;
    const nuevas = [...pruebas];
    if (!nuevas[index][campo].includes(trimmed)) {
      nuevas[index][campo] = [...nuevas[index][campo], trimmed];
      setPruebas(nuevas);

      const p = nuevas[index];
      if (p.id && campo === 'opcionesPredefinidas') {
        try {
          await fetchJSON(`/api/pruebas/item/${p.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...p,
              opcionesPredefinidas: p[campo].join(','),
              precioUSD: formData.esPaquete ? 0 : (parseFloat(p.precioUSD) || 0)
            })
          });
          toast.success("Opción añadida a la BD.");
        } catch (e) {
          toast.error("Error al guardar en BD.");
        }
      }
    }
  };

  const removeTag = async (index: number, campo: string, tagIndex: number) => {
    const nuevas = [...pruebas];
    nuevas[index][campo] = nuevas[index][campo].filter((_: any, i: number) => i !== tagIndex);
    setPruebas(nuevas);

    const p = nuevas[index];
    if (p.id && campo === 'opcionesPredefinidas') {
      try {
        await fetchJSON(`/api/pruebas/item/${p.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...p,
            opcionesPredefinidas: p[campo].length > 0 ? p[campo].join(',') : null,
            precioUSD: formData.esPaquete ? 0 : (parseFloat(p.precioUSD) || 0)
          })
        });
        toast.success("Opción removida de la BD.");
      } catch (e) {
        toast.error("Error al guardar en BD.");
      }
    }
  };

  const guardarEdicionOpcion = async (index: number, idx: number) => {
    if (!editingOption || !editingOption.tempValue.trim()) return;
    
    const nuevas = [...pruebas];
    const p = nuevas[index];
    p.opcionesPredefinidas[idx] = editingOption.tempValue;
    setPruebas(nuevas);
    setEditingOption(null);

    if (p.id) {
      try {
        await fetchJSON(`/api/pruebas/item/${p.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...p,
            opcionesPredefinidas: p.opcionesPredefinidas.join(','),
            precioUSD: formData.esPaquete ? 0 : (parseFloat(p.precioUSD) || 0)
          })
        });
        toast.success("Opción editada en la BD.");
      } catch (e) {
        toast.error("Error al guardar en BD.");
      }
    } else {
      toast.success("Opción editada (aún no existe en BD).");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    let targetGroup: any = null;
    try {
      targetGroup = JSON.parse(over.id as string);
    } catch (e) {
      // Es un ID normal de sortable
    }

    setPruebas((items) => {
      const oldIndex = items.findIndex((item) => item.tempId === active.id);
      if (oldIndex === -1) return items;

      if (targetGroup) {
        // === DROP SOBRE EL HEADER DE UN GRUPO ===
        // Encontrar el último índice de este grupo ANTES de modificar el elemento
        let lastIndexOfGroup = -1;
        for (let i = items.length - 1; i >= 0; i--) {
          if (i !== oldIndex && // Excluir el elemento que estamos arrastrando
              (items[i].categoriaVisual || "SIN CATEGORIA") === targetGroup.categoriaVisual &&
              (items[i].subcategoriaVisual || "SIN SUBCATEGORIA") === targetGroup.subcategoriaVisual) {
            lastIndexOfGroup = i;
            break;
          }
        }

        const newItems = [...items];
        const draggedItem = { ...newItems[oldIndex] };
        
        draggedItem.categoriaVisual = targetGroup.categoriaVisual;
        draggedItem.subcategoriaVisual = targetGroup.subcategoriaVisual;
        newItems[oldIndex] = draggedItem;

        if (lastIndexOfGroup !== -1) {
          let toIndex = lastIndexOfGroup;
          if (oldIndex > lastIndexOfGroup) {
            toIndex = lastIndexOfGroup + 1;
          }
          return arrayMove(newItems, oldIndex, toIndex);
        }
        return newItems;
      } else {
        // === DROP NORMAL DE ORDENAMIENTO ===
        if (active.id === over.id) return items;
        const newIndex = items.findIndex((item) => item.tempId === over.id);
        if (newIndex === -1) return items;
        
        const draggedItemOriginal = items[oldIndex];
        const targetItem = items[newIndex];
        
        const newItems = [...items];
        const draggedItem = { ...newItems[oldIndex] };
        
        // Siempre adoptamos la categoría del item sobre el cual soltamos
        draggedItem.categoriaVisual = targetItem.categoriaVisual;
        draggedItem.subcategoriaVisual = targetItem.subcategoriaVisual;
        newItems[oldIndex] = draggedItem;

        return arrayMove(newItems, oldIndex, newIndex);
      }
    });
  };

  const moverGrupoArriba = (index: number) => {
    const cat = pruebas[index].categoriaVisual || "SIN CATEGORIA";
    const sub = pruebas[index].subcategoriaVisual || "SIN SUBCATEGORIA";

    let endIndex = index;
    for (let i = index; i < pruebas.length; i++) {
      if ((pruebas[i].categoriaVisual || "SIN CATEGORIA") === cat &&
          (pruebas[i].subcategoriaVisual || "SIN SUBCATEGORIA") === sub) {
        endIndex = i;
      } else {
        break;
      }
    }

    if (index === 0) return;
    
    const prevEndIndex = index - 1;
    const prevCat = pruebas[prevEndIndex].categoriaVisual || "SIN CATEGORIA";
    const prevSub = pruebas[prevEndIndex].subcategoriaVisual || "SIN SUBCATEGORIA";
    
    let prevStartIndex = prevEndIndex;
    for (let i = prevEndIndex; i >= 0; i--) {
      if ((pruebas[i].categoriaVisual || "SIN CATEGORIA") === prevCat &&
          (pruebas[i].subcategoriaVisual || "SIN SUBCATEGORIA") === prevSub) {
        prevStartIndex = i;
      } else {
        break;
      }
    }

    setPruebas(prev => {
      const result = [...prev];
      const prevGroup = result.slice(prevStartIndex, prevEndIndex + 1);
      const currentGroup = result.slice(index, endIndex + 1);
      
      result.splice(prevStartIndex, (endIndex - prevStartIndex) + 1, ...currentGroup, ...prevGroup);
      return result;
    });
  };

  const moverGrupoAbajo = (index: number) => {
    const cat = pruebas[index].categoriaVisual || "SIN CATEGORIA";
    const sub = pruebas[index].subcategoriaVisual || "SIN SUBCATEGORIA";

    let endIndex = index;
    for (let i = index; i < pruebas.length; i++) {
      if ((pruebas[i].categoriaVisual || "SIN CATEGORIA") === cat &&
          (pruebas[i].subcategoriaVisual || "SIN SUBCATEGORIA") === sub) {
        endIndex = i;
      } else {
        break;
      }
    }

    if (endIndex >= pruebas.length - 1) return;
    moverGrupoArriba(endIndex + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.esPaquete && !formData.precioPaqueteUSD) {
      toast.error("Debe ingresar el precio total del paquete.");
      return;
    }
    if (pruebas.some(p => !p.nombre.trim() || !p.codigo.trim() || (!formData.esPaquete && !p.precioUSD))) {
      toast.error("Complete los códigos, nombres y precios requeridos.");
      return;
    }
    
    setGuardando(true);
    try {
      const payloadLimpio = {
        categoria: formData.categoria,
        subcategoria: formData.subcategoria,
        esPaquete: formData.esPaquete,
        precioPaqueteUSD: formData.esPaquete ? parseFloat(formData.precioPaqueteUSD) : null, 
        
        pruebas: pruebas.map(p => ({
          id: p.id ? p.id : undefined, 
          codigo: p.codigo,
          nombre: p.nombre,
          precioUSD: !formData.esPaquete ? parseFloat(p.precioUSD) : null,
          unidades: p.unidades,
          valoresReferencia: p.valoresReferencia || null,
          opcionesPredefinidas: p.opcionesPredefinidas.length > 0 ? p.opcionesPredefinidas.join(',') : null,
          categoriaVisual: p.categoriaVisual || null,
          subcategoriaVisual: p.subcategoriaVisual || null
        }))
      };

      await onSave(payloadLimpio);
    } finally {
      setGuardando(false);
    }
  };

  const categoriasFiltradas = categoriasExistentes?.filter((c: string) => 
    normalizeSearchString(c).includes(normalizeSearchString(formData.categoria))
  ) || [];

  const subcategoriasFiltradas = subcategoriasExistentes?.filter((s: string) => 
    normalizeSearchString(s).includes(normalizeSearchString(formData.subcategoria))
  ) || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20">
      <div className="bg-white w-full max-w-[1100px] max-h-[90vh] flex flex-col rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="text-2xl font-black text-[#1D1D1F]">
              {pruebaEditar ? "Editar Estructura" : "Configurar Catálogo"}
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Organiza por Categoría y define si es un Paquete Cerrado o Ítems Individuales.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 bg-slate-100 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full relative z-0">
          
          <div className="p-8 pb-4 space-y-8 relative z-50">
            {/* SECTOR DE MODALIDAD */}
            <div className="flex gap-4 mb-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, esPaquete: false })}
              className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                !formData.esPaquete 
                ? 'border-[#0071E3] bg-[#0071E3]/5 text-[#0071E3]' 
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <div className={`p-2 rounded-xl ${!formData.esPaquete ? 'bg-[#0071E3] text-white' : 'bg-slate-100'}`}>
                <LayoutList size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Ítems Individuales</p>
                <p className="text-xs opacity-70">El paciente paga cada prueba por separado.</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, esPaquete: true })}
              className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                formData.esPaquete 
                ? 'border-purple-500 bg-purple-50 text-purple-700' 
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <div className={`p-2 rounded-xl ${formData.esPaquete ? 'bg-purple-500 text-white' : 'bg-slate-100'}`}>
                <Package size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Paquete / Perfil</p>
                <p className="text-xs opacity-70">Se cobra un único precio por todo el combo.</p>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 bg-[#F5F5F7] p-6 rounded-2xl border border-slate-200/60 relative z-50">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#0071E3] rounded-l-2xl"></div>
            
            <div className="flex flex-col gap-1.5 pl-2 relative" ref={dropdownCategoriaRef}>
              <label className="text-[11px] font-black text-[#0071E3] uppercase tracking-widest">Categoría</label>
              <div className="relative">
                <input 
                  type="text" required 
                  value={formData.categoria} 
                  onFocus={() => setOpenDropdownCategoria(true)}
                  onChange={(e) => {
                    setFormData({ ...formData, categoria: e.target.value.toUpperCase() });
                    setOpenDropdownCategoria(true);
                  }} 
                  className="w-full px-4 py-3.5 bg-white border border-slate-200/80 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20" 
                  placeholder="Ej. HEMATOLOGIA" 
                />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              </div>
              {openDropdownCategoria && (
                <div className="absolute top-[100%] left-2 right-0 mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-y-auto max-h-[220px] py-1.5 z-50">
                  {categoriasFiltradas.length > 0 ? (
                    categoriasFiltradas.map((cat: string) => (
                      <button key={cat} type="button" onClick={() => { setFormData({ ...formData, categoria: cat }); setOpenDropdownCategoria(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-[#0071E3]/5 hover:text-[#0071E3] transition-colors">
                        {cat}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm font-medium text-slate-400 italic">Se creará como nueva categoría</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 relative" ref={dropdownSubcategoriaRef}>
              <label className="text-[11px] font-black text-[#0071E3] uppercase tracking-widest">Subcategoría (Título)</label>
              <div className="relative">
                <input 
                  type="text" required
                  value={formData.subcategoria} 
                  onFocus={() => setOpenDropdownSubcategoria(true)}
                  onChange={(e) => {
                    setFormData({ ...formData, subcategoria: e.target.value });
                    setOpenDropdownSubcategoria(true);
                  }} 
                  className="w-full px-4 py-3.5 bg-white border border-slate-200/80 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20" 
                  placeholder="Ej. Hematología Completa" 
                />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              </div>
              {openDropdownSubcategoria && (
                <div className="absolute top-[100%] left-0 right-0 mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-y-auto max-h-[220px] py-1.5 z-50">
                  {subcategoriasFiltradas.length > 0 ? (
                    subcategoriasFiltradas.map((sub: string) => (
                      <button key={sub} type="button" onClick={() => { setFormData({ ...formData, subcategoria: sub }); setOpenDropdownSubcategoria(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-[#0071E3]/5 hover:text-[#0071E3] transition-colors">
                        {sub}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm font-medium text-slate-400 italic">Se creará como nueva subcategoría</div>
                  )}
                </div>
              )}
            </div>

            {/* PRECIO DEL PAQUETE (Solo se muestra si es paquete) */}
            <div className={`flex flex-col gap-1.5 transition-opacity ${formData.esPaquete ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <label className="text-[11px] font-black text-purple-600 uppercase tracking-widest">Precio del Paquete ($)</label>
              <input 
                type="number" step="0.01"
                required={formData.esPaquete}
                value={formData.precioPaqueteUSD} 
                onChange={(e) => setFormData({ ...formData, precioPaqueteUSD: e.target.value })} 
                className="w-full px-4 py-3.5 bg-white border border-purple-200 rounded-xl text-sm font-black text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20" 
                placeholder="0.00" 
              />
            </div>
          </div>
          </div>

          <div className="px-8 pb-8 space-y-4 relative z-10">
            <div className="flex justify-between items-center relative z-[60]">
              <div>
                <h4 className="text-[14px] font-black text-[#1D1D1F] uppercase tracking-widest">
                  {formData.esPaquete ? "Parámetros del Paquete" : "Pruebas e Ítems Individuales"}
                </h4>
              </div>
              <div className="flex items-center gap-3">
                  <div className="relative" ref={searchRef}>
                    <div className="relative flex items-center">
                      <Search className="absolute left-3 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
                        onFocus={() => setShowSearchResults(true)}
                        placeholder="Buscar prueba existente..."
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 w-80"
                      />
                    </div>
                    {showSearchResults && searchQuery.trim() && (
                      <div className="absolute top-[100%] right-0 mt-2 w-[600px] max-w-[85vw] bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-y-auto max-h-[350px] py-1.5 z-50">
                        {busquedaUnificada
                          .filter(item => {
                            const sq = normalizeSearchString(searchQuery);
                            return normalizeSearchString(item.nombre).includes(sq) || 
                            (item.codigo && normalizeSearchString(item.codigo).includes(sq)) ||
                            (item.codigoCategoria && normalizeSearchString(item.codigoCategoria).includes(sq))
                          })
                          .slice(0, 15)
                          .map((item: any) => (
                            <button 
                              key={`${item.tipo}-${item.id}`} 
                              type="button" 
                              onClick={() => agregarAlListadoBusqueda(item)} 
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                            >
                              <div className="flex items-start gap-3">
                                <span className={`mt-0.5 text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 uppercase tracking-widest ${
                                  item.tipo === 'paquete' ? 'bg-purple-100 text-purple-600' :
                                  item.tipo === 'subcategoria' ? 'bg-blue-100 text-[#0071E3]' :
                                  'bg-slate-100 text-slate-500'
                                }`}>
                                  {item.tipo === 'prueba' ? item.codigo : (item.tipo === 'paquete' ? 'Paquete' : 'Subcat.')}
                                </span>
                                <div className="flex flex-col text-left">
                                  <span className="text-sm font-bold text-[#1D1D1F] leading-tight break-words">{item.nombre}</span>
                                  {item.tipo !== 'prueba' ? (
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                      {item.pruebas.length} pruebas • Cat: {item.codigoCategoria}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                      Cat: {item.categoriaNombre} • Sub: {item.subcategoriaNombre}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                        ))}
                        {busquedaUnificada.filter(item => { const sq = normalizeSearchString(searchQuery); return normalizeSearchString(item.nombre).includes(sq) || (item.codigo && normalizeSearchString(item.codigo).includes(sq)) || (item.codigoCategoria && normalizeSearchString(item.codigoCategoria).includes(sq))}).length === 0 && (
                           <div className="px-4 py-3 text-sm text-slate-400 italic">No se encontraron resultados</div>
                        )}
                      </div>
                    )}
                  </div>
                <button type="button" onClick={agregarFila} className="text-[13px] font-bold bg-[#0071E3] text-white px-5 py-2.5 rounded-xl hover:bg-[#0077ED] transition-all flex items-center gap-2 shadow-sm">
                  <Plus size={18} strokeWidth={3} /> Agregar Prueba
                </button>
              </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pruebas.map(p => p.tempId)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4 pb-4">
              {pruebas.map((p, index) => {
                const prev = index > 0 ? pruebas[index - 1] : null;
                const cat = p.categoriaVisual || "SIN CATEGORIA";
                const sub = p.subcategoriaVisual || "SIN SUBCATEGORIA";
                const prevCat = prev ? (prev.categoriaVisual || "SIN CATEGORIA") : null;
                const prevSub = prev ? (prev.subcategoriaVisual || "SIN SUBCATEGORIA") : null;
                
                const isNewGroup = cat !== prevCat || sub !== prevSub;
                const hasGroup = cat !== "SIN CATEGORIA" || sub !== "SIN SUBCATEGORIA";

                return (
                  <div key={index} className="flex flex-col">
                    {isNewGroup && !hasGroup && (
                      <div className="flex justify-end px-2 mt-4 mb-1">
                        <button type="button" onClick={() => {
                          const nuevas = [...pruebas];
                          for (let i = index; i < nuevas.length; i++) {
                            if ((nuevas[i].categoriaVisual || "SIN CATEGORIA") === "SIN CATEGORIA" && (nuevas[i].subcategoriaVisual || "SIN SUBCATEGORIA") === "SIN SUBCATEGORIA") {
                              nuevas[i].categoriaVisual = "NUEVA CATEGORIA";
                              nuevas[i].subcategoriaVisual = "NUEVA SUBCATEGORIA";
                            } else {
                              break;
                            }
                          }
                          setPruebas(nuevas);
                        }} className="text-[9px] font-black text-slate-400 hover:text-[#0071E3] uppercase flex items-center gap-1 transition-colors bg-white border border-slate-200 hover:border-[#0071E3]/30 px-2 py-1 rounded-md shadow-sm">
                          <Plus size={10} strokeWidth={4} /> Asignar Grupo
                        </button>
                      </div>
                    )}

                    {isNewGroup && hasGroup && (
                      <DroppableGroupModal id={JSON.stringify({categoriaVisual: cat, subcategoriaVisual: sub})}>
                      <div className="flex justify-between items-center px-2 mt-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1">
                            <button type="button" onClick={() => moverGrupoArriba(index)} title="Mover grupo arriba" className="p-0.5 text-slate-300 hover:text-[#0071E3] hover:bg-slate-100 rounded transition-colors disabled:opacity-30" disabled={index === 0}>
                              <ChevronUp size={14} strokeWidth={3} />
                            </button>
                            <button type="button" onClick={() => moverGrupoAbajo(index)} title="Mover grupo abajo" className="p-0.5 text-slate-300 hover:text-[#0071E3] hover:bg-slate-100 rounded transition-colors disabled:opacity-30">
                              <ChevronDown size={14} strokeWidth={3} />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0 bg-white border border-slate-200/80 rounded-lg px-3 py-1.5 shadow-sm focus-within:border-[#0071E3] focus-within:ring-2 focus-within:ring-[#0071E3]/20 transition-all">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black tracking-widest uppercase text-slate-400 mb-0.5">Editar Categoría Visual</span>
                            <div className="grid">
                              <span className="invisible whitespace-pre col-start-1 row-start-1 text-[11px] font-black tracking-widest uppercase min-w-[80px]">
                                {cat || "Categoría..."}
                              </span>
                              <input 
                                type="text"
                                value={cat}
                                onChange={(e) => {
                                  const val = e.target.value.toUpperCase();
                                  const nuevas = [...pruebas];
                                  for (let i = index; i < nuevas.length; i++) {
                                    const currentCat = nuevas[i].categoriaVisual || "SIN CATEGORIA";
                                    const currentSub = nuevas[i].subcategoriaVisual || "SIN SUBCATEGORIA";
                                    if (currentCat === cat && currentSub === sub) {
                                      nuevas[i].categoriaVisual = val;
                                    } else {
                                      break;
                                    }
                                  }
                                  setPruebas(nuevas);
                                }}
                                className="col-start-1 row-start-1 w-full text-[11px] font-black tracking-widest uppercase text-slate-600 bg-transparent outline-none placeholder:text-slate-300 placeholder:font-medium"
                                placeholder="Categoría..."
                                onClick={(e) => {
                                  if (cat === "NUEVA CATEGORIA") {
                                    const target = e.target as HTMLInputElement;
                                    target.select();
                                  }
                                }}
                              />
                            </div>
                          </div>
                          
                          <span className="text-slate-300 font-bold mt-2">-</span>
                          
                          <div className="flex flex-col ml-1">
                            <span className="text-[8px] font-black tracking-widest uppercase text-[#0071E3]/60 mb-0.5">Editar Subcategoría</span>
                            <div className="grid">
                              <span className="invisible whitespace-pre col-start-1 row-start-1 text-[11px] font-black tracking-widest uppercase min-w-[100px]">
                                {sub || "Subcategoría..."}
                              </span>
                              <input 
                                type="text"
                                value={sub}
                                onChange={(e) => {
                                  const val = e.target.value.toUpperCase();
                                  const nuevas = [...pruebas];
                                  for (let i = index; i < nuevas.length; i++) {
                                    const currentCat = nuevas[i].categoriaVisual || "SIN CATEGORIA";
                                    const currentSub = nuevas[i].subcategoriaVisual || "SIN SUBCATEGORIA";
                                    if (currentCat === cat && currentSub === sub) {
                                      nuevas[i].subcategoriaVisual = val;
                                    } else {
                                      break;
                                    }
                                  }
                                  setPruebas(nuevas);
                                }}
                                className="col-start-1 row-start-1 w-full text-[11px] font-black tracking-widest uppercase text-[#0071E3] bg-transparent outline-none placeholder:text-blue-200 placeholder:font-medium"
                                placeholder="Subcategoría..."
                                onClick={(e) => {
                                  if (sub === "NUEVA SUBCATEGORIA") {
                                    const target = e.target as HTMLInputElement;
                                    target.select();
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        </div>
                        <div className="h-px bg-slate-200/70 flex-1"></div>
                        <button type="button" onClick={() => {
                          const nuevas = [...pruebas];
                          const targetCat = index > 0 ? (nuevas[index - 1].categoriaVisual || "") : "";
                          const targetSub = index > 0 ? (nuevas[index - 1].subcategoriaVisual || "") : "";
                          
                          for (let i = index; i < nuevas.length; i++) {
                            if ((nuevas[i].categoriaVisual || "SIN CATEGORIA") === cat && (nuevas[i].subcategoriaVisual || "SIN SUBCATEGORIA") === sub) {
                              nuevas[i].categoriaVisual = targetCat;
                              nuevas[i].subcategoriaVisual = targetSub;
                            } else {
                              break;
                            }
                          }
                          setPruebas(nuevas);
                        }} className="text-red-400 hover:text-red-600 text-[10px] ml-2 font-bold uppercase tracking-widest bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors">
                          Quitar Grupo / Unir Arriba
                        </button>
                      </div>
                      </DroppableGroupModal>
                    )}

                    {!isNewGroup && hasGroup && (
                      <div className="relative group/divide w-full h-0 flex items-center justify-center my-0 opacity-0 hover:opacity-100 hover:h-8 transition-all z-20">
                        <div className="absolute w-full h-px bg-[#0071E3]/20"></div>
                        <button type="button" onClick={() => {
                          const nuevas = [...pruebas];
                          const targetCat = "NUEVA CATEGORIA " + Math.floor(Math.random() * 1000); // Para forzar que sea un grupo distinto aunque haya otra "NUEVA CATEGORIA" adyacente
                          const targetSub = "NUEVA SUBCATEGORIA";
                          for (let i = index; i < nuevas.length; i++) {
                            if ((nuevas[i].categoriaVisual || "SIN CATEGORIA") === cat && (nuevas[i].subcategoriaVisual || "SIN SUBCATEGORIA") === sub) {
                              nuevas[i].categoriaVisual = targetCat;
                              nuevas[i].subcategoriaVisual = targetSub;
                            } else {
                              break;
                            }
                          }
                          setPruebas(nuevas);
                        }} className="relative bg-[#F5F5F7] text-[#0071E3] hover:bg-[#0071E3] hover:text-white border border-[#0071E3]/30 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm transition-colors flex items-center gap-1">
                          <Plus size={10} strokeWidth={4} /> Dividir Grupo Aquí
                        </button>
                      </div>
                    )}

                    <SortableRowModal id={p.tempId}>
                    <div className={`flex flex-col bg-[#F5F5F7]/60 border border-slate-200/80 p-5 shadow-sm hover:border-[#0071E3]/30 transition-colors ${hasGroup && isNewGroup ? 'rounded-2xl rounded-t-lg' : 'rounded-2xl mt-4'}`}>
                      
                      <div className="grid grid-cols-12 gap-4 items-end w-full">
                        <div className="col-span-2 xl:col-span-1 flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Código</label>
                          <input type="text" required value={p.codigo} onChange={(e) => actualizarPrueba(index, 'codigo', e.target.value.toUpperCase())} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20" placeholder="HE-01" />
                        </div>

                        <div className={`${formData.esPaquete ? 'col-span-5' : 'col-span-4'} flex flex-col gap-1.5`}>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre</label>
                          <textarea rows={1} required value={p.nombre} onChange={(e) => actualizarPrueba(index, 'nombre', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 resize-y min-h-[46px]" placeholder="Ej. GLOBULOS BLANCOS" />
                        </div>

                    <div className="col-span-3 flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Valores Referencia</label>
                      <textarea rows={1} value={p.valoresReferencia} onChange={(e) => actualizarPrueba(index, 'valoresReferencia', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 resize-y min-h-[46px]" placeholder="Vacío para manual" />
                    </div>

                    <div className={`${formData.esPaquete ? 'col-span-2' : 'col-span-1'} flex flex-col gap-1.5`}>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Unidades</label>
                      <input type="text" value={p.unidades} onChange={(e) => actualizarPrueba(index, 'unidades', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20" placeholder="mm3" />
                    </div>

                    {!formData.esPaquete && (
                      <div className="col-span-2 flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Precio ($)</label>
                        <input type="number" step="0.01" required value={p.precioUSD} onChange={(e) => actualizarPrueba(index, 'precioUSD', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20" placeholder="0.00" />
                      </div>
                    )}

                    <div className="col-span-1 flex justify-end">
                      <button type="button" onClick={() => eliminarFila(index)} className="p-3 bg-white border border-slate-200 text-slate-500 rounded-xl hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm">
                        <Trash2 size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex gap-3 pt-4 mt-4 border-t border-slate-200/50">
                    <button type="button" onClick={() => toggleMostrar(index, 'mostrarOpciones')} className={`text-[11px] font-bold px-4 py-2 rounded-xl transition-all ${p.mostrarOpciones ? 'bg-purple-100 text-purple-700 shadow-inner' : 'bg-white border border-slate-200 text-slate-500 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200'}`}>
                      {p.opcionesPredefinidas.length > 0 ? `✓ Opciones Cerradas (${p.opcionesPredefinidas.length})` : '+ Opciones Cerradas para Resultados'}
                    </button>
                  </div>

                  {/* Paneles */}
                  {p.mostrarOpciones && (
                    <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="text-[11px] font-black text-purple-600 uppercase tracking-widest mb-3 block">Configurar Opciones Predefinidas</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {p.opcionesPredefinidas.map((opc: string, idx: number) => {
                          const isEditing = editingOption?.pruebaIndex === index && editingOption?.optionIndex === idx;
                          return (
                            <span key={idx} className="flex items-center gap-1 bg-purple-100 text-purple-700 pl-3 pr-1 py-1 rounded-lg text-sm font-bold border border-purple-200 shadow-sm">
                              {isEditing ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingOption.tempValue}
                                  onChange={(e) => setEditingOption({...editingOption, tempValue: e.target.value})}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      guardarEdicionOpcion(index, idx);
                                    }
                                  }}
                                  className="bg-white px-2 py-0.5 rounded text-sm outline-none border border-purple-300 text-purple-700 min-w-[60px]"
                                  style={{ width: `${Math.max(editingOption.tempValue.length + 2, 8)}ch` }}
                                />
                              ) : (
                                <span>{opc}</span>
                              )}
                              
                              <div className="flex items-center gap-0.5 ml-1">
                                {isEditing ? (
                                  <button type="button" onClick={() => guardarEdicionOpcion(index, idx)} className="p-1 hover:bg-green-200 text-green-700 rounded-md transition-colors" title="Guardar"><Check size={14}/></button>
                                ) : (
                                  <button type="button" onClick={() => setEditingOption({pruebaIndex: index, optionIndex: idx, tempValue: opc})} className="p-1 hover:bg-blue-200 text-blue-700 rounded-md transition-colors" title="Editar"><Edit2 size={14}/></button>
                                )}
                                <button type="button" onClick={() => removeTag(index, 'opcionesPredefinidas', idx)} className="p-1 hover:bg-purple-200 text-purple-700 rounded-md transition-colors" title="Eliminar"><X size={14}/></button>
                              </div>
                            </span>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Escribe una opción (Ej. Positivo) y presiona Enter..." 
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(index, 'opcionesPredefinidas', e.currentTarget.value); e.currentTarget.value = ''; } }}
                          className="flex-1 px-4 py-2.5 bg-white border border-purple-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-purple-300 shadow-sm"
                        />
                        <button type="button" onClick={(e) => { 
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement; 
                            addTag(index, 'opcionesPredefinidas', input.value); 
                            input.value = ''; 
                          }} 
                          className="px-4 py-2.5 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 shadow-sm transition-colors"
                        >
                          Añadir
                        </button>
                      </div>
                    </div>
                  )}

                    </div>
                  </SortableRowModal>
                  </div>
                );
              })}
            </div>
            </SortableContext>
            </DndContext>
          </div>
        </form>

        <div className="p-6 bg-white border-t border-slate-100 flex gap-4 shrink-0 relative z-40">
          <button type="button" onClick={onClose} disabled={guardando} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors disabled:opacity-50">Cancelar</button>
          <button type="submit" onClick={handleSubmit} disabled={guardando} className="flex-1 py-4 bg-[#0071E3] text-white font-bold rounded-2xl shadow-lg hover:bg-[#0077ED] transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
            {guardando && <Loader2 className="animate-spin" size={20} strokeWidth={3} />}
            {guardando ? "Guardando..." : "Guardar Estructura"}
          </button>
        </div>
      </div>
    </div>
  );
}