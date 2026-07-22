"use client";
import { useState, useEffect, useRef } from "react";
import { fetchJSON } from "@/lib/fetchWithRetry";
import { Plus, Edit2, Ban, CheckCircle2, Search, TestTubes, DollarSign, ClipboardList, ChevronDown, ChevronUp, Activity, FlaskConical, Tags, Filter, SlidersHorizontal, Check, Trash2, Package, Briefcase, GripVertical } from "lucide-react";
import { DndContext, useDraggable, useDroppable, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DroppableGroup = ({ id, children }: { id: string, children: React.ReactNode }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`transition-colors rounded-xl border border-transparent ${isOver ? 'bg-blue-50/50 border-blue-300 ring-4 ring-blue-100' : ''}`}>
      {children}
    </div>
  );
};

const SortablePrueba = ({ p, examen, children }: { p: any, examen: any, children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: p.id,
    data: { prueba: p, sourceExamen: examen }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 9999 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative group/drag transition-all ${isDragging ? 'opacity-50 shadow-2xl scale-[1.02] z-50' : ''}`}>
      {examen.activa && (
        <div 
          {...listeners} 
          {...attributes} 
          className="absolute left-[-26px] top-1/2 -translate-y-1/2 p-1.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-[#0071E3] opacity-0 group-hover/drag:opacity-100 transition-opacity"
        >
          <GripVertical size={16} />
        </div>
      )}
      {children}
    </div>
  );
};
import { toast } from "react-toastify";
import ModalPrueba from "../../components/pruebas/ModalPrueba";
import ModalPruebaIndividual from "../../components/pruebas/ModalPruebaIndividual";
import ModalServicioExtra from "../../components/pruebas/ModalServicioExtra";
import ModalConfirmacion from "../../components/ui/ModalConfirmacion";
import useTasaBCV from "../../hooks/useTasaBcv";
import { normalizeSearchString } from "../../../lib/stringUtils";

export default function PruebasPage() {
  const [examenes, setExamenes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  
  const [activeTab, setActiveTab] = useState<"pruebas" | "servicios">("pruebas");

  const [servicios, setServicios] = useState<any[]>([]);
  const [cargandoServicios, setCargandoServicios] = useState(true);
  const [isModalServicioOpen, setIsModalServicioOpen] = useState(false);
  const [servicioEditando, setServicioEditando] = useState<any>(null);
  const [servicioAEliminar, setServicioAEliminar] = useState<string | null>(null);
  
  const [openDropdownCategoria, setOpenDropdownCategoria] = useState(false);
  const [openDropdownEstado, setOpenDropdownEstado] = useState(false);
  const dropdownCategoriaRef = useRef<HTMLDivElement>(null);
  const dropdownEstadoRef = useRef<HTMLDivElement>(null);
  const [cargando, setCargando] = useState(true);
  const [examenExpandido, setExamenExpandido] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pruebaEditando, setPruebaEditando] = useState<any>(null);
  
  const [isModalItemOpen, setIsModalItemOpen] = useState(false);
  const [itemEditando, setItemEditando] = useState<any>(null);
  
  const [isModalConfirmOpen, setIsModalConfirmOpen] = useState(false);
  const [subcategoriaAEliminar, setSubcategoriaAEliminar] = useState<string | null>(null);
  
  const { tasa, loading: loadingTasa } = useTasaBCV();
  const tasaBCV = tasa ?? 36.5;

  const [modalConfirmDrop, setModalConfirmDrop] = useState<{isOpen: boolean, source: any, target: any} | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const sourceData = active.data.current;
    if (!sourceData) return;
    
    let targetData;
    try {
      targetData = JSON.parse(over.id as string);
      // === DROP EN GRUPO DISTINTO ===
      const p = sourceData.prueba;
      
      const currentCatVisual = (p.categoriaVisual || "SIN CATEGORIA").trim().toUpperCase();
      const currentSubcatVisual = (p.subcategoriaVisual || "SIN SUBCATEGORIA").trim().toUpperCase();
      
      if (
        p.subcategoriaId === targetData.subcategoriaId &&
        currentCatVisual === targetData.catVisual &&
        currentSubcatVisual === targetData.subcatVisual
      ) {
        return; // No se movió de grupo
      }

      setModalConfirmDrop({
        isOpen: true,
        source: sourceData,
        target: targetData
      });
      return;
    } catch (e) {
      // === DROP SOBRE OTRA PRUEBA (ORDENAMIENTO) ===
      if (active.id !== over.id) {
        const overData = over.data.current;
        if (!overData) return;

        const sourcePrueba = sourceData.prueba;
        const targetPrueba = overData.prueba;
        
        // Solo ordenamos si están en el mismo grupo visual
        if (sourcePrueba.subcategoriaId === targetPrueba.subcategoriaId && 
            (sourcePrueba.categoriaVisual || "SIN CATEGORIA").trim().toUpperCase() === (targetPrueba.categoriaVisual || "SIN CATEGORIA").trim().toUpperCase() && 
            (sourcePrueba.subcategoriaVisual || "SIN SUBCATEGORIA").trim().toUpperCase() === (targetPrueba.subcategoriaVisual || "SIN SUBCATEGORIA").trim().toUpperCase()) {
            
            // Encontrar índices y reordenar optimistamente
            const examenActual = examenes.find(e => e.id === sourcePrueba.subcategoriaId);
            if (!examenActual) return;
            
            const grupoPruebas = examenActual.pruebas.filter((p: any) => 
              (p.categoriaVisual || "SIN CATEGORIA").trim().toUpperCase() === (sourcePrueba.categoriaVisual || "SIN CATEGORIA").trim().toUpperCase() && 
              (p.subcategoriaVisual || "SIN SUBCATEGORIA").trim().toUpperCase() === (sourcePrueba.subcategoriaVisual || "SIN SUBCATEGORIA").trim().toUpperCase()
            ).sort((a: any, b: any) => (a.ordenVisual || 0) - (b.ordenVisual || 0));

            const oldIndex = grupoPruebas.findIndex((p: any) => p.id === active.id);
            const newIndex = grupoPruebas.findIndex((p: any) => p.id === over.id);

            const reorderedGroup = arrayMove(grupoPruebas, oldIndex, newIndex);
            
            // Re-calcular ordenVisual
            const updatedPruebas = reorderedGroup.map((p: any, index: number) => ({
              ...p,
              ordenVisual: index + 1
            }));

            // Actualizar UI optimistamente
            const newExamenes = examenes.map(e => {
              if (e.id === examenActual.id) {
                const otrasPruebas = e.pruebas.filter((p: any) => !updatedPruebas.some((up: any) => up.id === p.id));
                return { ...e, pruebas: [...otrasPruebas, ...updatedPruebas] };
              }
              return e;
            });
            setExamenes(newExamenes);

            // Guardar en backend
            try {
              const res = await fetch(`/api/pruebas/reorder`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pruebas: updatedPruebas.map((p: any) => ({ id: p.id, ordenVisual: p.ordenVisual })) })
              });
              if (!res.ok) throw new Error("Error al guardar el nuevo orden");
            } catch (error) {
              toast.error("Error al guardar el orden. Se revertirán los cambios.");
              fetchExamenes();
            }
        }
      }
    }
  };

  const confirmarDrop = async () => {
    if (!modalConfirmDrop) return;
    setCargando(true);
    
    const { source, target } = modalConfirmDrop;
    const { prueba } = source;
    setModalConfirmDrop(null);

    try {
      const res = await fetch(`/api/pruebas/item/${prueba.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subcategoriaId: target.subcategoriaId,
          categoriaVisual: target.catVisual === "SIN CATEGORIA" ? null : target.catVisual,
          subcategoriaVisual: target.subcatVisual === "SIN SUBCATEGORIA" ? null : target.subcatVisual,
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al mover la prueba");
      }

      toast.success("Prueba movida correctamente");
      fetchExamenes();
    } catch (error: any) {
      toast.error(error.message);
      setCargando(false);
    }
  };

  const fetchExamenes = async () => {
    try {
      const res = await fetch("/api/pruebas");
      const data = await res.json();
      setExamenes(data);
    } catch (error: any) {
      toast.error(error?.message ? `Error al cargar el catálogo de pruebas: ${error?.message}` : "Error al cargar el catálogo de pruebas");
    } finally {
      setCargando(false);
    }
  };

  const fetchServicios = async () => {
    try {
      const res = await fetch("/api/servicios-extra?todos=true");
      const data = await res.json();
      setServicios(data);
    } catch (error: any) {
      toast.error(error?.message ? `Error al cargar servicios extra: ${error?.message}` : "Error al cargar servicios extra");
    } finally {
      setCargandoServicios(false);
    }
  };

  useEffect(() => {
    fetchExamenes();
    fetchServicios();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownCategoriaRef.current && !dropdownCategoriaRef.current.contains(event.target as Node)) {
        setOpenDropdownCategoria(false);
      }
      if (dropdownEstadoRef.current && !dropdownEstadoRef.current.contains(event.target as Node)) {
        setOpenDropdownEstado(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSavePrueba = async (formData: any) => {
    const isEdit = !!pruebaEditando;
    const url = isEdit ? `/api/pruebas/${pruebaEditando.id}` : "/api/pruebas";
    const method = isEdit ? "PUT" : "POST";
    
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ocurrió un error inesperado");
      
      toast.success(isEdit ? "Catálogo actualizado" : "Catálogo registrado exitosamente");
      setIsModalOpen(false);
      fetchExamenes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSavePruebaIndividual = async (formData: any) => {
    try {
      await fetchJSON(`/api/pruebas/item/${itemEditando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      toast.success("Prueba individual actualizada");
      setIsModalItemOpen(false);
      fetchExamenes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleEstadoSubcategoria = async (id: string, estadoActual: boolean) => {
    try {
      const res = await fetchJSON(`/api/pruebas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: !estadoActual }),
      });
      if (res.ok) {
        toast.info(estadoActual ? "Subcategoría inhabilitada" : "Subcategoría activada");
        fetchExamenes();
      }
    } catch (error: any) {
      toast.error(error?.message ? `Error al cambiar estado: ${error?.message}` : "Error al cambiar estado");
    }
  };

  const toggleEstadoPruebaIndividual = async (id: string, estadoActual: boolean) => {
    try {
      const res = await fetchJSON(`/api/pruebas/item/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: !estadoActual }),
      });
      if (res.ok) {
        toast.info(estadoActual ? "Prueba individual inhabilitada" : "Prueba individual activada");
        fetchExamenes();
      }
    } catch (error: any) {
      toast.error(error?.message ? `Error al cambiar estado de la prueba: ${error?.message}` : "Error al cambiar estado de la prueba");
    }
  };

  const handleSaveServicio = async (formData: any) => {
    const isEdit = !!servicioEditando;
    const url = isEdit ? `/api/servicios-extra/${servicioEditando.id}` : "/api/servicios-extra";
    const method = isEdit ? "PUT" : "POST";
    
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ocurrió un error inesperado");
      
      toast.success(isEdit ? "Servicio actualizado" : "Servicio registrado");
      setIsModalServicioOpen(false);
      fetchServicios();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleEstadoServicio = async (id: string, estadoActual: boolean) => {
    try {
      const res = await fetchJSON(`/api/servicios-extra/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !estadoActual }),
      });
      if (res.ok) {
        toast.info(!estadoActual ? "Servicio activado" : "Servicio inhabilitado");
        fetchServicios();
      }
    } catch (error: any) {
      toast.error(error?.message ? `Error al cambiar estado: ${error?.message}` : "Error al cambiar estado");
    }
  };

  const handleDeleteSubcategoria = async (claveInput?: string) => {
    if (!subcategoriaAEliminar) return;
    if (!claveInput) {
      toast.warning("Debe ingresar la clave maestra para eliminar.");
      return;
    }
    try {
      const res = await fetch(`/api/pruebas/${subcategoriaAEliminar}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claveMaestra: claveInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");
      
      toast.success("Estructura eliminada permanentemente");
      fetchExamenes();
    } catch (error: any) {
      toast.error(error.message); 
    } finally {
      setSubcategoriaAEliminar(null);
    }
  };

  const handleDeleteServicio = async (claveInput?: string) => {
    if (!servicioAEliminar) return;
    if (!claveInput) {
      toast.warning("Debe ingresar la clave maestra para eliminar.");
      return;
    }
    try {
      const res = await fetch(`/api/servicios-extra/${servicioAEliminar}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claveMaestra: claveInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");
      
      toast.success("Servicio eliminado permanentemente");
      fetchServicios();
    } catch (error: any) {
      toast.error(error.message); 
    } finally {
      setServicioAEliminar(null);
    }
  };

  const abrirModalNuevo = () => {
    setPruebaEditando(null);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (examen: any) => {
    setPruebaEditando(examen);
    setIsModalOpen(true);
  };

  const abrirModalNuevoServicio = () => {
    setServicioEditando(null);
    setIsModalServicioOpen(true);
  };

  const abrirModalEditarServicio = (servicio: any) => {
    setServicioEditando(servicio);
    setIsModalServicioOpen(true);
  };

  const abrirModalEditarItem = (item: any) => {
    setItemEditando(item);
    setIsModalItemOpen(true);
  };

  const toggleExpandir = (id: string) => {
    setExamenExpandido(examenExpandido === id ? null : id);
  };

  const categoriasExistentes = Array.from(new Set(examenes.map(e => e.categoria.nombre)));
  const subcategoriasExistentes = Array.from(new Set(examenes.map(e => e.nombre)));
  
  const pruebasFiltradas = examenes.filter((p) => {
    const b = normalizeSearchString(busqueda);
    const matchBusqueda = normalizeSearchString(p.nombre).includes(b) || 
      normalizeSearchString(p.categoria.nombre).includes(b) ||
      p.pruebas.some((prueba: any) => normalizeSearchString(prueba.codigo).includes(b) || normalizeSearchString(prueba.nombre).includes(b));
    const matchCategoria = filtroCategoria === "Todas" || p.categoria.nombre === filtroCategoria;
    const matchEstado = filtroEstado === "Todos" ? true : filtroEstado === "Activas" ? p.activa === true : p.activa === false;
    
    return matchBusqueda && matchCategoria && matchEstado;
  }).sort((a, b) => a.nombre.localeCompare(b.nombre));
  
  const examenesAgrupados = pruebasFiltradas.reduce((acc, examen) => {
    const cat = examen.categoria.nombre;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(examen);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
    <div className="h-full flex flex-col pb-10 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="font-title text-4xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
            <ClipboardList className="text-[#0071E3]" size={36} strokeWidth={2.5} />
            Catálogo de Pruebas
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <p className="text-[#86868B] font-medium text-[15px]">Gestiona las categorías y subcategorías ({examenes.length} registradas).</p>
            <div className="h-5 w-px bg-slate-300"></div>
            <span className="text-[14px] font-black px-3 py-1.5 bg-[#0071E3]/10 text-[#0071E3] rounded-lg border border-[#0071E3]/20 flex items-center gap-1.5">
              <DollarSign size={16} strokeWidth={3} />
              BCV: {loadingTasa ? "Cargando..." : `Bs ${tasaBCV.toFixed(2)}`}
            </span>
          </div>
        </div>
        <button onClick={activeTab === 'pruebas' ? abrirModalNuevo : abrirModalNuevoServicio} className="bg-[#0071E3] text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-[0_4px_12px_rgba(0,113,227,0.25)] hover:bg-[#0077ED] transition-all active:scale-95 shrink-0">
          <Plus size={20} strokeWidth={2.5} /> {activeTab === 'pruebas' ? 'Nueva Prueba' : 'Nuevo Servicio'}
        </button>
      </div>

      <div className="flex bg-[#F5F5F7] p-1.5 rounded-xl border border-slate-200/60 w-max mb-6">
        <button
          onClick={() => setActiveTab("pruebas")}
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === "pruebas" ? "bg-white text-[#0071E3] shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <TestTubes size={16} /> Pruebas y Perfiles
        </button>
        <button
          onClick={() => setActiveTab("servicios")}
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === "servicios" ? "bg-white text-[#0071E3] shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Briefcase size={16} /> Servicios Extra
        </button>
      </div>

      <div className="mb-6 flex gap-3 shrink-0 relative z-20">
        <div className="relative flex-1 min-w-[300px]">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200/80 rounded-2xl text-[#1D1D1F] text-[15px] font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-[#0071E3]/10 focus:border-[#0071E3]/40" placeholder="Buscar por código (Ej. HEM-01)..." />
        </div>
        
        <div className="relative w-[280px] shrink-0" ref={dropdownCategoriaRef}>
          <button onClick={() => setOpenDropdownCategoria(!openDropdownCategoria)} className={`w-full flex items-center justify-between pl-4 pr-4 py-4 bg-white border rounded-2xl text-[14px] font-bold shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#0071E3]/10 ${openDropdownCategoria ? 'border-[#0071E3]/40' : 'border-slate-200/80 hover:border-slate-300'}`}>
            <div className="flex items-center gap-2 text-[#1D1D1F]">
              <Filter className="h-4 w-4 text-[#0071E3]" />
              <span className="truncate">Categoría: {filtroCategoria}</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${openDropdownCategoria ? 'rotate-180' : ''}`} />
          </button>
          {openDropdownCategoria && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 z-50">
              <button onClick={() => { setFiltroCategoria("Todas"); setOpenDropdownCategoria(false); }} className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors ${filtroCategoria === "Todas" ? 'bg-[#0071E3]/5 text-[#0071E3]' : 'text-slate-600 hover:bg-slate-50'}`}>Todas las categorías {filtroCategoria === "Todas" && <Check className="h-4 w-4" />}</button>
              <div className="h-px bg-slate-100 my-1 mx-2"></div>
              {categoriasExistentes.map(cat => (
                <button key={cat} onClick={() => { setFiltroCategoria(cat); setOpenDropdownCategoria(false); }} className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors ${filtroCategoria === cat ? 'bg-[#0071E3]/5 text-[#0071E3]' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className="truncate">{cat}</span> {filtroCategoria === cat && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="relative w-[220px] shrink-0" ref={dropdownEstadoRef}>
          <button onClick={() => setOpenDropdownEstado(!openDropdownEstado)} className={`w-full flex items-center justify-between pl-4 pr-4 py-4 bg-white border rounded-2xl text-[14px] font-bold shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#0071E3]/10 ${openDropdownEstado ? 'border-[#0071E3]/40' : 'border-slate-200/80 hover:border-slate-300'}`}>
            <div className="flex items-center gap-2 text-[#1D1D1F]">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              <span className="truncate">Estado: {filtroEstado}</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${openDropdownEstado ? 'rotate-180' : ''}`} />
          </button>
          {openDropdownEstado && (
            <div className="absolute top-full right-0 w-full mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 z-50">
              {["Todos", "Activas", "Inhabilitadas"].map((estado) => (
                <button key={estado} onClick={() => { setFiltroEstado(estado); setOpenDropdownEstado(false); }} className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors ${filtroEstado === estado ? 'bg-[#0071E3]/5 text-[#0071E3]' : 'text-slate-600 hover:bg-slate-50'}`}>
                  {estado === "Todos" ? "Todos los estados" : estado} {filtroEstado === estado && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeTab === "pruebas" ? (
      <div className="space-y-8 z-10 relative">
        {cargando ? (
          <div className="h-full flex items-center justify-center text-slate-400 font-bold">Cargando catálogo...</div>
        ) : pruebasFiltradas.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 font-medium opacity-60">
            <TestTubes size={48} strokeWidth={1.5} className="mb-4" />
            <p>No se encontraron registros con esos filtros.</p>
          </div>
        ) : (
          (Object.entries(examenesAgrupados) as [string, any[]][])
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([nombreCategoria, examenesDeCategoria]) => (
            <div key={nombreCategoria} className="space-y-4">
              
              <div className="flex items-center gap-3 py-3 mt-2 pl-2">
                <div className="flex items-center gap-2 opacity-70">
                  <Tags size={16} strokeWidth={2.5} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">{nombreCategoria}</span>
                </div>
                <div className="h-px bg-slate-200/80 flex-1 ml-2"></div>
              </div>

              {examenesDeCategoria.map((examen) => {
                const isExpanded = examenExpandido === examen.id;
                
                return (
                  <div key={examen.id} className={`flex flex-col p-6 rounded-[24px] border shadow-sm hover:shadow-md transition-all duration-300 ${examen.activa ? 'bg-white border-slate-200/80 hover:border-[#0071E3]/30' : 'bg-red-50/50 border-red-200/60'}`}>
                    <div className="flex items-center justify-between">
                      
                      {/* Lado Izquierdo */}
                      <div className="flex flex-col w-[50%]">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit ${examen.activa ? 'bg-[#0071E3]/10 text-[#0071E3]' : 'bg-red-100 text-red-500'}`}>
                            <Tags size={12} strokeWidth={2.5} /> Categoría: {examen.categoria.nombre}
                          </span>
                          
                          {/* INDICADOR DE PAQUETE */}
                          {examen.esPaquete && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-600 flex items-center gap-1.5 w-fit">
                              <Package size={12} strokeWidth={2.5} /> PAQUETE
                            </span>
                          )}
                          {!examen.activa && <span className="text-[10px] font-bold text-red-400 flex items-center gap-1"><Ban size={12} /> Inhabilitada</span>}
                        </div>
                        
                        <h3 className={`font-black text-xl tracking-tight flex items-center gap-2.5 ${examen.activa ? 'text-[#1D1D1F]' : 'text-red-900/60 line-through'}`}>
                          <FlaskConical size={22} strokeWidth={2.5} className={examen.activa ? "text-[#0071E3]" : "text-red-400"} />
                          {examen.nombre}
                        </h3>
                      </div>
                      
                      {/* Lado Derecho (Botones y Acciones de la Subcategoría) */}
                      <div className="flex items-center justify-end gap-4 w-[50%]">
                        
                        {examen.esPaquete && (
                          <div className="flex flex-col items-end mr-4">
                            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Precio Paquete</span>
                            <span className="font-black text-2xl text-[#1D1D1F]">${examen.precioUSD?.toFixed(2) || "0.00"}</span>
                          </div>
                        )}
                        
                        <button onClick={() => toggleExpandir(examen.id)} className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all border ${isExpanded ? 'bg-[#0071E3]/10 border-[#0071E3]/30 text-[#0071E3]' : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100 hover:text-[#0071E3]'}`}>
                          <div className="flex items-center gap-2">
                            <Activity size={18} strokeWidth={2.5} />
                            <span className="text-sm font-bold">Ver {examen.pruebas.length} Pruebas </span>
                          </div>
                          <div className={isExpanded ? 'text-[#0071E3]' : 'text-slate-400'}>{isExpanded ? <ChevronUp size={18} strokeWidth={3} /> : <ChevronDown size={18} strokeWidth={3} />}</div>
                        </button>
                        
                        <div className="h-8 w-px bg-slate-200 mx-1"></div>
                        
                        <div className="flex gap-2">
                          {/* BOTÓN: EDITAR SUBCATEGORÍA */}
                          <div className="relative group/btn flex flex-col items-center">
                            <button onClick={() => abrirModalEditar(examen)} className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:-translate-y-0.5 ${examen.activa ? 'bg-blue-50 text-[#0071E3] hover:bg-[#0071E3] hover:text-white hover:shadow-[0_4px_12px_rgba(0,113,227,0.3)]' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}>
                              <Edit2 size={18} strokeWidth={2.5} />
                            </button>
                            <div className="absolute -top-10 opacity-0 group-hover/btn:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/btn:-translate-y-1">
                              Editar Estructura
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                            </div>
                          </div>

                          {/* BOTÓN: ACTIVAR/DESACTIVAR SUBCATEGORÍA (Ajustado a red-50 y red-500) */}
                          <div className="relative group/btn flex flex-col items-center">
                            <button onClick={() => toggleEstadoSubcategoria(examen.id, examen.activa)} className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:-translate-y-0.5 ${examen.activa ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)]' : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white hover:shadow-[0_4px_12px_rgba(22,163,74,0.3)]'}`}>
                              {examen.activa ? <Ban size={18} strokeWidth={2.5} /> : <CheckCircle2 size={18} strokeWidth={2.5} />}
                            </button>
                            <div className="absolute -top-10 opacity-0 group-hover/btn:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/btn:-translate-y-1">
                              {examen.activa ? "Inhabilitar" : "Reactivar"}
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                            </div>
                          </div>

                          {/* BOTÓN: ELIMINAR SUBCATEGORÍA */}
                          <div className="relative group/btn flex flex-col items-center">
                            <button onClick={() => { setSubcategoriaAEliminar(examen.id); setIsModalConfirmOpen(true); }} className="flex items-center justify-center w-10 h-10 bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] rounded-xl transition-all duration-300 hover:-translate-y-0.5">
                              <Trash2 size={18} strokeWidth={2.5} />
                            </button>
                            <div className="absolute -top-10 opacity-0 group-hover/btn:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/btn:-translate-y-1">
                              Eliminar (Clave)
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-6 pt-5 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="flex items-center px-4 py-2 mb-2 text-[10px] font-black text-[#1D1D1F] uppercase tracking-widest">
                          <div className={examen.esPaquete ? "w-[40%] pl-2" : "w-[35%] pl-2"}>Ítem / Prueba</div>
                          <div className="w-[20%] text-center">Referencia</div> 
                          <div className={examen.esPaquete ? "w-[20%] text-center" : "w-[15%] text-center"}>Unidades</div> 
                          <div className={examen.esPaquete ? "w-[20%] text-right pr-2" : "w-[30%] text-right pr-2"}>
                            {examen.esPaquete ? "Estado" : "Precio y Estado"}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {examen.pruebas.length === 0 ? (
                            <div className="p-6 bg-slate-50 rounded-2xl text-center text-slate-400 text-sm font-medium border border-slate-200/50 border-dashed">
                              No hay pruebas asignadas.
                            </div>
                          ) : (
                            (() => {
                              const pruebasOrdenadas = [...examen.pruebas].sort((a: any, b: any) => (a.ordenVisual || 0) - (b.ordenVisual || 0));
                              const gruposPruebas = pruebasOrdenadas.reduce((acc: any, p: any) => {
                                const cat = (p.categoriaVisual || "SIN CATEGORIA").trim().toUpperCase();
                                const sub = (p.subcategoriaVisual || "SIN SUBCATEGORIA").trim().toUpperCase();
                                if (!acc[cat]) acc[cat] = {};
                                if (!acc[cat][sub]) acc[cat][sub] = [];
                                acc[cat][sub].push(p);
                                return acc;
                              }, {} as Record<string, Record<string, any[]>>);

                              return Object.entries(gruposPruebas).map(([cat, subs]) => (
                                <div key={cat} className="flex flex-col gap-3 mt-2">
                                  {Object.entries(subs as any).map(([sub, pruebasGrupo]) => (
                                    <DroppableGroup key={sub} id={JSON.stringify({ subcategoriaId: examen.id, catVisual: cat, subcatVisual: sub })}>
                                    <SortableContext items={(pruebasGrupo as any[]).map(p => p.id)} strategy={verticalListSortingStrategy}>
                                    <div className="flex flex-col gap-3 mt-1 p-1">
                                      {(cat !== "SIN CATEGORIA" || sub !== "SIN SUBCATEGORIA") && (
                                        <div className="flex items-center gap-3 px-4 mt-1 mb-1">
                                          <div className="flex items-center gap-2 shrink-0">
                                            {cat !== "SIN CATEGORIA" && (
                                              <span className="text-[11px] font-black tracking-widest uppercase text-slate-500">
                                                {cat}
                                              </span>
                                            )}
                                            {cat !== "SIN CATEGORIA" && sub !== "SIN SUBCATEGORIA" && (
                                              <span className="text-slate-300 font-bold">-</span>
                                            )}
                                            {sub !== "SIN SUBCATEGORIA" && (
                                              <span className="text-[11px] font-black tracking-widest uppercase text-[#0071E3]">
                                                {sub}
                                              </span>
                                            )}
                                          </div>
                                          <div className="h-px bg-slate-200/70 flex-1"></div>
                                        </div>
                                      )}
                                      
                                      {(pruebasGrupo as any[]).map((p: any, index: number) => {
                                    const isPar = index % 2 === 0;
                                    const bgFondoFila = p.activa && examen.activa
                                      ? (isPar ? 'bg-[#E8F2FF] border-[#0071E3]/20' : 'bg-[#E8F2FF]/40 border-[#0071E3]/10')
                                      : 'bg-slate-50/50 border-slate-200/40 opacity-75';

                                    return (
                                      <SortablePrueba key={p.id} p={p} examen={examen}>
                                      <div className={`flex items-center px-5 py-4 rounded-2xl border transition-all shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)] hover:border-[#0071E3]/40 ${bgFondoFila}`}>
                                        
                                        <div className={`flex items-center gap-4 ${examen.esPaquete ? 'w-[40%]' : 'w-[35%]'}`}>
                                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-black tracking-wider shrink-0 ${p.activa && examen.activa ? 'bg-white text-[#0071E3] shadow-sm' : 'bg-red-100/50 text-red-600'}`}>
                                            {p.codigo}
                                          </span>
                                          <span className={`font-black text-[14px] uppercase tracking-wide truncate pr-2 ${p.activa && examen.activa ? 'text-[#1D1D1F]' : 'text-slate-400 line-through'}`}>
                                            {p.nombre}
                                          </span>
                                        </div>

                                        <div className="w-[20%] flex justify-center">
                                          {p.valoresReferencia ? <span className="text-[13px] font-bold text-[#1D1D1F] bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">{p.valoresReferencia}</span> : <span className="text-slate-300">-</span>}
                                        </div>

                                        <div className={`${examen.esPaquete ? 'w-[20%]' : 'w-[15%]'} flex justify-center`}>
                                          {p.unidades ? <span className="text-[13px] font-bold text-[#1D1D1F] bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">{p.unidades}</span> : <span className="text-slate-300">-</span>}
                                        </div>

                                        <div className={`${examen.esPaquete ? 'w-[20%]' : 'w-[30%]'} flex items-center justify-end gap-5`}>
                                          {/* SOLO MUESTRA PRECIO INDIVIDUAL SI NO ES PAQUETE */}
                                          {!examen.esPaquete && (
                                            <span className={`font-black text-[16px] ${p.activa && examen.activa ? 'text-[#1D1D1F]' : 'text-slate-400'}`}>
                                              ${p.precioUSD?.toFixed(2) || "0.00"}
                                            </span>
                                          )}
                                          
                                          <div className="flex items-center gap-2">
                                            {/* BOTÓN: EDITAR PRUEBA INDIVIDUAL */}
                                            <div className="relative group/btn flex flex-col items-center">
                                              <button onClick={() => abrirModalEditarItem(p)} disabled={!examen.activa} className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${!examen.activa ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-blue-50 text-[#0071E3] hover:bg-[#0071E3] hover:text-white hover:shadow-[0_4px_12px_rgba(0,113,227,0.3)] hover:-translate-y-0.5'}`}>
                                                <Edit2 size={14} strokeWidth={2.5}/>
                                              </button>
                                              {examen.activa && (
                                                <div className="absolute -top-9 opacity-0 group-hover/btn:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[10px] font-bold px-2.5 py-1 rounded-md whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/btn:-translate-y-1">
                                                  Editar Ítem
                                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                                                </div>
                                              )}
                                            </div>

                                            {/* BOTÓN: ACTIVAR/DESACTIVAR PRUEBA INDIVIDUAL */}
                                            <div className="relative group/btn flex flex-col items-center">
                                              <button onClick={() => toggleEstadoPruebaIndividual(p.id, p.activa)} disabled={!examen.activa} className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${!examen.activa ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : p.activa ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:-translate-y-0.5' : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white hover:shadow-[0_4px_12px_rgba(22,163,74,0.3)] hover:-translate-y-0.5'}`}>
                                                {p.activa ? <Ban size={14} strokeWidth={2.5}/> : <CheckCircle2 size={14} strokeWidth={2.5}/>}
                                              </button>
                                              {examen.activa && (
                                                <div className="absolute -top-9 opacity-0 group-hover/btn:opacity-100 transition-all duration-300 pointer-events-none bg-[#1D1D1F] text-white text-[10px] font-bold px-2.5 py-1 rounded-md whitespace-nowrap shadow-xl z-50 translate-y-1 group-hover/btn:-translate-y-1">
                                                  {p.activa ? "Ocultar" : "Reactivar"}
                                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1D1F]"></div>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                        </div>
                                      </div>
                                      </SortablePrueba>
                                    );
                                  })}
                                  </div>
                                  </SortableContext>
                                </DroppableGroup>
                              ))}
                            </div>
                              ));
                            })()
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
      ) : (
      <div className="space-y-4 z-10 relative">
        {cargandoServicios ? (
          <div className="h-full flex items-center justify-center text-slate-400 font-bold">Cargando servicios...</div>
        ) : servicios.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 font-medium opacity-60">
            <Briefcase size={48} strokeWidth={1.5} className="mb-4" />
            <p>No hay servicios extra registrados.</p>
          </div>
        ) : (
          servicios.map((s) => (
            <div key={s.id} className={`flex items-center justify-between p-6 rounded-[24px] border shadow-sm transition-all duration-300 ${s.activo ? 'bg-white border-slate-200/80 hover:border-[#0071E3]/30' : 'bg-red-50/50 border-red-200/60'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${s.activo ? 'bg-[#0071E3]/10 text-[#0071E3]' : 'bg-red-100 text-red-400'}`}>
                  <Briefcase size={24} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <h3 className={`font-black text-xl tracking-tight ${s.activo ? 'text-[#1D1D1F]' : 'text-red-900/60 line-through'}`}>
                    {s.nombre}
                  </h3>
                  {!s.activo && <span className="text-[11px] font-bold text-red-400 flex items-center gap-1 mt-0.5"><Ban size={14} /> Inhabilitado</span>}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className={`font-black text-2xl ${s.activo ? 'text-[#1D1D1F]' : 'text-slate-400'}`}>
                  ${s.precioUSD?.toFixed(2)}
                </span>
                <div className="h-8 w-px bg-slate-200 mx-1"></div>
                <div className="flex gap-2">
                  <div className="relative group/btn flex flex-col items-center">
                    <button onClick={() => abrirModalEditarServicio(s)} className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:-translate-y-0.5 ${s.activo ? 'bg-blue-50 text-[#0071E3] hover:bg-[#0071E3] hover:text-white hover:shadow-[0_4px_12px_rgba(0,113,227,0.3)]' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}>
                      <Edit2 size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                  <div className="relative group/btn flex flex-col items-center">
                    <button onClick={() => toggleEstadoServicio(s.id, s.activo)} className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:-translate-y-0.5 ${s.activo ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)]' : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white hover:shadow-[0_4px_12px_rgba(22,163,74,0.3)]'}`}>
                      {s.activo ? <Ban size={18} strokeWidth={2.5} /> : <CheckCircle2 size={18} strokeWidth={2.5} />}
                    </button>
                  </div>
                  <div className="relative group/btn flex flex-col items-center">
                    <button onClick={() => { setServicioAEliminar(s.id); setIsModalConfirmOpen(true); }} className="flex items-center justify-center w-10 h-10 bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] rounded-xl transition-all duration-300 hover:-translate-y-0.5">
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      )}

      <ModalPrueba isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSavePrueba} pruebaEditar={pruebaEditando} categoriasExistentes={categoriasExistentes} subcategoriasExistentes={subcategoriasExistentes} catalogoExamenes={examenes} />
      <ModalPruebaIndividual isOpen={isModalItemOpen} onClose={() => setIsModalItemOpen(false)} onSave={handleSavePruebaIndividual} itemEditar={itemEditando} />
      <ModalServicioExtra
        isOpen={isModalServicioOpen}
        onClose={() => setIsModalServicioOpen(false)}
        itemEditar={servicioEditando}
        onSave={handleSaveServicio}
      />
      
      {/* Modal de Confirmación Drop */}
      <ModalConfirmacion
        isOpen={!!modalConfirmDrop}
        onClose={() => setModalConfirmDrop(null)}
        onConfirm={confirmarDrop}
        titulo="Mover Prueba"
        mensaje={`¿Estás seguro de mover la prueba ${modalConfirmDrop?.source?.prueba?.nombre} al grupo ${modalConfirmDrop?.target?.subcatVisual === "SIN SUBCATEGORIA" ? modalConfirmDrop?.target?.catVisual : modalConfirmDrop?.target?.subcatVisual}?`}
        textoConfirmar="Mover"
        colorBoton="blue"
      />

      <ModalConfirmacion 
        isOpen={isModalConfirmOpen && activeTab === 'pruebas'}
        onClose={() => setIsModalConfirmOpen(false)}
        onConfirm={handleDeleteSubcategoria}
        titulo="Eliminar Estructura"
        mensaje="Esta acción borrará permanentemente la subcategoría y todas sus pruebas asociadas. Ingrese la clave maestra para continuar."
        textoConfirmar="Eliminar"
        colorBoton="red"
        requiereInput={true}
        placeholderInput="Clave maestra..."
      />

      <ModalConfirmacion 
        isOpen={isModalConfirmOpen && activeTab === 'servicios'}
        onClose={() => {setIsModalConfirmOpen(false); setServicioAEliminar(null);}}
        onConfirm={handleDeleteServicio}
        titulo="Eliminar Servicio Extra"
        mensaje="Esta acción borrará permanentemente este servicio extra. Ingrese la clave maestra para continuar."
        textoConfirmar="Eliminar"
        colorBoton="red"
        requiereInput={true}
        placeholderInput="Clave maestra..."
      />
    </div>
    </DndContext>
  );
}