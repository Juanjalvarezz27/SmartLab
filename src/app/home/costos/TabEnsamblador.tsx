"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Trash2, CheckCircle2, ChevronRight, Calculator, FlaskConical, Beaker, ChevronDown, TrendingUp, X, Package } from "lucide-react";
import { toast } from "react-toastify";
import ModalConfirmacion from "../../components/ui/ModalConfirmacion";
import { normalizeSearchString } from "../../../lib/stringUtils";

export default function TabEnsamblador() {
  const [examenes, setExamenes] = useState<any[]>([]);
  const [isAddInsumoModalOpen, setIsAddInsumoModalOpen] = useState(false);
  const [insumosDisponibles, setInsumosDisponibles] = useState<any[]>([]);
  const [paquetesDisponibles, setPaquetesDisponibles] = useState<any[]>([]);
  const [selectedPrueba, setSelectedPrueba] = useState<any>(null);
  
  // Datos del ensamblador
  const [receta, setReceta] = useState<any[]>([]);
  const [costoVariable, setCostoVariable] = useState(0);
  const [costoFijoUnitario, setCostoFijoUnitario] = useState(0);
  const [margenGanancia, setMargenGanancia] = useState(30);

  // Selector
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInsumo, setSearchInsumo] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [insumosEnPreparacion, setInsumosEnPreparacion] = useState<any[]>([]);

  // Modal Eliminar Insumo de Receta
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [insumoToRemove, setInsumoToRemove] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [isCargandoEnsamblaje, setIsCargandoEnsamblaje] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/pruebas").then(r => r.json()),
      fetch("/api/costos/insumos").then(r => r.json()),
      fetch("/api/costos/insumos/paquetes").then(r => r.json())
    ]).then(([examenesData, insumosData, paquetesData]) => {
      setExamenes(Array.isArray(examenesData) ? examenesData : []);
      setInsumosDisponibles(Array.isArray(insumosData) ? insumosData : []);
      setPaquetesDisponibles(Array.isArray(paquetesData) ? paquetesData : []);
      setLoading(false);
    }).catch(() => {
      toast.error("Error al cargar datos base");
      setLoading(false);
    });
  }, []);

  const todasLasPruebas = examenes.filter(sub => !sub.esPaquete).flatMap(sub => sub.pruebas || []).map(p => ({ ...p, tipo: 'prueba' }));
  const todosLosPaquetes = examenes.filter(sub => sub.esPaquete === true).map(sub => ({
    id: sub.id,
    codigo: "PAQ",
    nombre: sub.nombre,
    precioUSD: sub.precioUSD,
    tipo: "paquete"
  }));

  const combinedItems = [...todasLasPruebas, ...todosLosPaquetes];

  const filteredItems = combinedItems.filter(p => {
    const st = normalizeSearchString(searchTerm);
    return normalizeSearchString(p.nombre).includes(st) || 
    (p.codigo && normalizeSearchString(p.codigo).includes(st))
  });

  const filteredInsumosDisponibles = insumosDisponibles.filter(i =>
    normalizeSearchString(i.nombre).includes(normalizeSearchString(searchInsumo))
  );

  const cargarEnsamblaje = async (pruebaId: string, tipo: string = 'prueba') => {
    setIsCargandoEnsamblaje(true);
    try {
      const res = await fetch(`/api/costos/ensamblador/${pruebaId}?tipo=${tipo}`);
      if (!res.ok) throw new Error("Error en la solicitud");
      const data = await res.json();
      
      setSelectedPrueba({ ...data.prueba, tipo });
      const recetaCargada = data.receta.map((r: any) => ({ ...r.insumo, cantidadUsada: r.cantidadUsada, insumoId: r.insumoId }));
      setReceta(recetaCargada);
      setCostoFijoUnitario(data.costoFijoPorPrueba || 0);
      recalcularTotal(recetaCargada);
    } catch (error: any) {
      toast.error(error?.message ? `Error al cargar la receta del examen: ${error?.message}` : "Error al cargar la receta del examen");
    } finally {
      setIsCargandoEnsamblaje(false);
    }
  };

  const recalcularTotal = (recetaActual: any[]) => {
    const total = recetaActual.reduce((sum, item) => sum + (item.cantidadUsada * item.costoUnitarioUSD), 0);
    setCostoVariable(total);
  };

  const handleSeleccionarInsumoParaPreparacion = (insumo: any) => {
    if (insumosEnPreparacion.find(i => i.id === insumo.id)) {
      toast.info("Este insumo ya está en la lista de preparación");
      return;
    }
    setInsumosEnPreparacion([...insumosEnPreparacion, { ...insumo, cantidadParaAgregar: "" }]);
    setSearchInsumo("");
    setIsDropdownOpen(false);
  };

  const handleRemoverDePreparacion = (id: number) => {
    setInsumosEnPreparacion(insumosEnPreparacion.filter(i => i.id !== id));
  };

  const handleCantidadPreparacionChange = (id: number, value: string) => {
    setInsumosEnPreparacion(insumosEnPreparacion.map(i => 
      i.id === id ? { ...i, cantidadParaAgregar: value } : i
    ));
  };

  // Agregar todos los insumos de un paquete a la lista de preparación
  const handleSeleccionarPaquete = (paquete: any) => {
    let agregados = 0;
    let omitidos = 0;

    const nuevosItems = [...insumosEnPreparacion];

    paquete.items.forEach((item: any) => {
      const yaEnPreparacion = nuevosItems.find(i => i.id === item.insumo.id);
      const yaEnReceta = receta.find(r => r.insumoId === item.insumo.id);

      if (yaEnPreparacion || yaEnReceta) {
        omitidos++;
      } else {
        nuevosItems.push({
          ...item.insumo,
          cantidadParaAgregar: item.cantidadUsada.toString(),
        });
        agregados++;
      }
    });

    if (agregados === 0) {
      return toast.info("Todos los insumos de este paquete ya están en la lista o receta.");
    }

    setInsumosEnPreparacion(nuevosItems);

    if (omitidos > 0) {
      toast.info(`Se agregaron ${agregados} insumos del paquete. ${omitidos} omitidos por estar repetidos.`);
    } else {
      toast.success(`Se agregaron ${agregados} insumos del paquete "${paquete.nombre}".`);
    }
  };

  const handleAgregarDesdePreparacion = () => {
    const validInsumos = insumosEnPreparacion.filter(i => parseFloat(i.cantidadParaAgregar || "0") > 0);
    
    if (validInsumos.length === 0) {
      return toast.warning("Asigna una cantidad mayor a 0 a por lo menos un insumo.");
    }

    let duplicados = 0;
    const agregados: any[] = [];

    validInsumos.forEach(insumo => {
      if (receta.find(r => r.insumoId === insumo.id)) {
        duplicados++;
      } else {
        agregados.push({ ...insumo, insumoId: insumo.id, cantidadUsada: parseFloat(insumo.cantidadParaAgregar) });
      }
    });

    if (agregados.length === 0 && duplicados > 0) {
      return toast.warning("Todos los insumos seleccionados ya están en la receta.");
    }

    const nuevaReceta = [...receta, ...agregados];
    setReceta(nuevaReceta);
    recalcularTotal(nuevaReceta);
    
    setInsumosEnPreparacion([]);
    setSearchInsumo("");
    setIsAddInsumoModalOpen(false);

    if (duplicados > 0) {
      toast.info(`Se agregaron ${agregados.length} insumos. Omitidos ${duplicados} por estar repetidos.`);
    }
  };

  const handleEliminarRequest = (insumoId: number) => {
    setInsumoToRemove(insumoId);
    setIsDeleteModalOpen(true);
  };

  const confirmarEliminacion = () => {
    if (insumoToRemove === null) return;
    const nuevaReceta = receta.filter(r => r.insumoId !== insumoToRemove);
    setReceta(nuevaReceta);
    recalcularTotal(nuevaReceta);
    setIsDeleteModalOpen(false);
    setInsumoToRemove(null);
  };

  const handleGuardarEnsamble = async () => {
    try {
      const res = await fetch(`/api/costos/ensamblador/${selectedPrueba.id}?tipo=${selectedPrueba.tipo || "prueba"}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receta: receta.map(r => ({ insumoId: r.insumoId, cantidadUsada: r.cantidadUsada }))
        })
      });
      if (res.ok) {
        toast.success("Estructura guardada con éxito");
        cargarEnsamblaje(selectedPrueba.id, selectedPrueba.tipo || "prueba");
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error en la petición");
      }
    } catch (error: any) {
      toast.error(error?.message ? `Error al guardar la estructura: ${error?.message}` : "Error al guardar la estructura");
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Cargando módulos...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start min-h-[600px]">
      {/* Modal Añadir Insumos (Tipo Carrito) */}
      {isAddInsumoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#0071E3] flex items-center justify-center">
                  <Beaker size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1D1D1F]">Añadir Insumos</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">a la receta de {selectedPrueba?.codigo}</p>
                </div>
              </div>
              <button onClick={() => setIsAddInsumoModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Sección de Paquetes */}
            {paquetesDisponibles.length > 0 && (
              <div className="px-6 pt-5 pb-3 border-b border-slate-100 bg-white shrink-0">
                <label className="text-[11px] font-black text-indigo-600 uppercase tracking-widest ml-1 mb-3 flex items-center gap-2">
                  <Package size={14} /> Paquetes Predefinidos
                </label>
                <div className="flex flex-wrap gap-2">
                  {paquetesDisponibles.map(paq => (
                    <button
                      key={paq.id}
                      type="button"
                      onClick={() => handleSeleccionarPaquete(paq)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-bold text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all group"
                    >
                      <Package size={16} className="text-indigo-400 group-hover:text-indigo-600" />
                      <span>{paq.nombre}</span>
                      <span className="text-[10px] font-bold bg-indigo-200/60 text-indigo-600 px-1.5 py-0.5 rounded-md">{paq.items.length}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="px-6 py-5 border-b border-slate-100 bg-white shrink-0 relative z-20">
              <label className="text-[11px] font-black text-[#0071E3] uppercase tracking-widest ml-1 mb-2 block">Buscador Inteligente</label>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Escribe el nombre del reactivo o insumo..."
                  value={searchInsumo}
                  onChange={e => {
                    setSearchInsumo(e.target.value);
                    if (e.target.value.trim() !== "") setIsDropdownOpen(true);
                    else setIsDropdownOpen(false);
                  }}
                  onFocus={() => { if(searchInsumo.trim() !== "") setIsDropdownOpen(true) }}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/10 transition-all shadow-sm"
                />
                
                {isDropdownOpen && searchInsumo.trim() !== "" && (
                  <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-xl py-2 flex flex-col z-50" style={{ maxHeight: "300px" }}>
                    <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {filteredInsumosDisponibles.map(i => (
                        <div 
                          key={i.id}
                          className="px-5 py-3 text-sm cursor-pointer hover:bg-[#0071E3]/5 hover:text-[#0071E3] transition-colors border-b border-slate-50 last:border-0 flex justify-between items-center group"
                          onClick={() => handleSeleccionarInsumoParaPreparacion(i)}
                        >
                          <div>
                            <p className="font-bold text-slate-700 group-hover:text-[#0071E3]">{i.nombre}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Costo: ${i.costoUnitarioUSD.toFixed(4)} / {i.unidadMedida}</p>
                          </div>
                          <Plus size={16} className="text-slate-300 group-hover:text-[#0071E3]" />
                        </div>
                      ))}
                      {filteredInsumosDisponibles.length === 0 && (
                        <div className="px-5 py-8 text-sm text-slate-400 font-medium text-center">No se encontraron resultados para "{searchInsumo}"</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/50 flex flex-col p-6 relative z-0">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                Lista de Preparación <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{insumosEnPreparacion.length}</span>
              </h4>
              
              {insumosEnPreparacion.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60">
                  <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 border border-slate-100">
                    <Search size={32} className="text-slate-300" strokeWidth={1.5} />
                  </div>
                  <p className="font-medium text-sm">Busca y selecciona insumos arriba para agregarlos aquí.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {insumosEnPreparacion.map(insumo => (
                    <div key={insumo.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:border-[#0071E3]/30 transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{insumo.nombre}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">Costo Unitario: <span className="text-[#0071E3] font-bold">${insumo.costoUnitarioUSD.toFixed(4)}</span> / {insumo.unidadMedida}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="relative w-32">
                          <input
                            type="number"
                            placeholder="0.00"
                            value={insumo.cantidadParaAgregar}
                            onChange={(e) => handleCantidadPreparacionChange(insumo.id, e.target.value)}
                            className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
                            min="0"
                            step="0.0001"
                          />
                          <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                            {insumo.unidadMedida}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleRemoverDePreparacion(insumo.id)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex gap-4 shrink-0">
              <button type="button" onClick={() => setIsAddInsumoModalOpen(false)} className="flex-1 md:flex-none md:w-32 py-3.5 bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-200 hover:text-slate-800 transition-colors">
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleAgregarDesdePreparacion} 
                disabled={insumosEnPreparacion.length === 0}
                className={`flex-1 py-3.5 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  insumosEnPreparacion.length > 0 
                    ? "bg-[#0071E3] text-white shadow-lg shadow-blue-500/20 hover:bg-[#0077ED]" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <CheckCircle2 size={18} strokeWidth={2.5} /> Guardar Insumos en la Receta
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalConfirmacion
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmarEliminacion}
        titulo="Remover Insumo"
        mensaje="¿Estás seguro de que deseas remover este insumo de la receta? Podrás volver a agregarlo después."
        textoConfirmar="Remover Insumo"
        textoCancelar="Cancelar"
        colorBoton="red"
      />
      
      {/* Sidebar: Catálogo de Exámenes */}
      <div className="w-full lg:w-[380px] flex flex-col bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100 shrink-0 h-[450px] lg:h-[calc(100vh-48px)] lg:sticky lg:top-6">
        <div className="p-5 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0071E3] flex items-center justify-center shadow-sm border border-blue-100/50">
              <FlaskConical size={18} strokeWidth={2.5} />
            </div>
            <h3 className="font-black text-slate-800 text-xl tracking-tight">Catálogo</h3>
          </div>
          <p className="text-slate-500 text-sm mb-4 font-medium leading-relaxed">Selecciona un examen para definir su estructura de reactivos y costos.</p>
          
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar examen o paquete..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#0071E3] outline-none text-sm shadow-sm transition-all font-semibold"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          {filteredItems.map(item => (
            <button 
              key={`${item.tipo}-${item.id}`}
              onClick={() => cargarEnsamblaje(item.id, item.tipo)}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group border border-transparent ${
                selectedPrueba?.id === item.id 
                  ? "bg-[#0071E3] text-white shadow-md shadow-blue-500/20 translate-x-1" 
                  : "bg-white hover:bg-slate-50 hover:translate-x-1 hover:border-slate-100"
              }`}
            >
              <div className="pr-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider uppercase ${
                    selectedPrueba?.id === item.id ? "bg-white/20 text-white" : 
                    item.tipo === "paquete" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {item.tipo === "paquete" ? "Paquete" : item.codigo}
                  </span>
                  {item.precioUSD !== undefined && item.precioUSD !== null && (
                    <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md ${
                      selectedPrueba?.id === item.id ? "bg-white/10 text-white" : "bg-emerald-50 text-emerald-600"
                    }`}>
                      ${item.precioUSD.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className={`text-[13px] mt-1.5 font-bold leading-snug line-clamp-2 ${
                  selectedPrueba?.id === item.id ? "text-white" : "text-slate-700"
                }`}>
                  {item.nombre}
                </p>
              </div>
              <ChevronRight size={16} className={selectedPrueba?.id === item.id ? "text-white opacity-100 shrink-0" : "text-slate-300 group-hover:text-[#0071E3] opacity-0 group-hover:opacity-100 transition-all shrink-0"} />
            </button>
          ))}
          {filteredItems.length === 0 && (
            <div className="text-center p-6 flex flex-col items-center justify-center opacity-60">
               <Search size={24} className="text-slate-300 mb-2" />
               <span className="text-slate-400 font-bold text-sm">Sin resultados</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Area: Ensamblador */}
      <div className="w-full lg:flex-1 flex flex-col relative bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
        {isCargandoEnsamblaje && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-[60]">
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-[#0071E3] animate-spin mb-4 shadow-sm"></div>
            <h3 className="font-black text-xl text-slate-800 tracking-tight">Cargando estructura...</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Obteniendo receta de la base de datos</p>
          </div>
        )}

        {!selectedPrueba ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <div className="w-24 h-24 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
              <Calculator size={40} className="text-slate-300" strokeWidth={1.5} />
            </div>
            <h3 className="font-bold text-xl text-slate-600 mb-2">Ensamblador de Costos</h3>
            <p className="font-medium text-slate-500">Selecciona un examen del panel izquierdo</p>
          </div>
        ) : (
          <div className="flex flex-col">
            
            <div className="p-6 bg-gradient-to-br from-[#0071E3] to-blue-600 text-white relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-xl uppercase tracking-widest shadow-sm">
                    Examen Seleccionado • {selectedPrueba.codigo}
                  </div>
                  {selectedPrueba.precioUSD !== undefined && selectedPrueba.precioUSD !== null && (
                    <div className="inline-block px-3 py-1 bg-green-500/80 backdrop-blur-md text-white text-xs font-bold rounded-xl uppercase tracking-widest shadow-sm border border-green-400/50">
                      Precio de Venta: ${selectedPrueba.precioUSD.toFixed(2)}
                    </div>
                  )}
                </div>
                <h2 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight mb-1">
                  {selectedPrueba.nombre}
                </h2>
                <p className="text-blue-100 font-medium text-sm">Define exactamente qué insumos y reactivos se consumen al realizar esta prueba.</p>
              </div>
            </div>

            <div className="p-6 flex flex-col">
              
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Beaker size={18} className="text-[#0071E3]" />
                  Estructura Actual de la Receta
                </h4>
                <button 
                  onClick={() => setIsAddInsumoModalOpen(true)}
                  className="bg-[#0071E3] text-white px-5 py-2.5 rounded-xl hover:bg-[#0077ED] font-bold text-[13px] transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
                >
                  <Plus size={18} strokeWidth={2.5} /> Añadir Insumo a la Receta
                </button>
              </div>

              {/* Lista de receta actual */}
              <div className="flex flex-col">
                
                <div className="rounded-2xl border border-slate-100 shadow-sm mb-4 bg-white">
                  <table className="w-full text-left bg-white relative">
                    <thead className="sticky top-0 bg-slate-50 shadow-sm z-10 border-b border-slate-100">
                      <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Insumo / Reactivo</th>
                        <th className="px-6 py-4 text-center">Cantidad Usada</th>
                        <th className="px-6 py-4 text-right">Costo Parcial</th>
                        <th className="px-6 py-4 text-center w-24">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {receta.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-16 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-300 mb-4">
                              <Beaker size={24} />
                            </div>
                            <p className="text-slate-500 font-medium">La receta de este examen está vacía.</p>
                            <p className="text-slate-400 text-sm">Agrega insumos usando el formulario de arriba.</p>
                          </td>
                        </tr>
                      )}
                      {receta.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-700 text-sm">{item.nombre}</p>
                            <p className="text-xs text-slate-500 font-medium mt-1">Costo: <span className="text-[#0071E3] font-bold">${item.costoUnitarioUSD.toFixed(4)}</span> / {item.unidadMedida}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-200 shadow-sm">
                              {item.cantidadUsada} <span className="text-slate-400 text-xs font-medium ml-1">{item.unidadMedida}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-black text-[#0071E3] text-base">
                              ${(item.cantidadUsada * item.costoUnitarioUSD).toFixed(4)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center">
                              <button 
                                onClick={() => handleEliminarRequest(item.insumoId)} 
                                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 bg-slate-50 transition-all border border-slate-100 shadow-sm hover:shadow"
                                title="Remover insumo de la receta"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer / Resumen */}
                <div className="mt-auto bg-slate-900 rounded-2xl shadow-xl relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  
                  {/* Fila de costos */}
                  <div className="relative z-10 flex items-stretch border-b border-slate-700/40">
                    <div className="flex-1 p-4 text-center border-r border-slate-700/40">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Fijo (Absorbido)</p>
                      <p className="text-xl font-black text-white">${costoFijoUnitario.toFixed(2)}</p>
                    </div>
                    <div className="flex-1 p-4 text-center border-r border-slate-700/40">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Variable (Reactivos)</p>
                      <p className="text-xl font-black text-white">${costoVariable.toFixed(2)}</p>
                    </div>
                    <div className="flex-1 p-4 text-center bg-blue-950/40">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Costo Total</p>
                      <p className="text-2xl font-black text-white">${(costoFijoUnitario + costoVariable).toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Fila de margen y precio sugerido */}
                  <div className="relative z-10 flex items-stretch border-b border-slate-700/40">
                    <div className="flex-1 p-4 flex items-center justify-center gap-3 border-r border-slate-700/40">
                      <TrendingUp size={16} className="text-emerald-400 shrink-0" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Margen</p>
                      <div className="relative w-20">
                        <input
                          type="number"
                          value={margenGanancia}
                          onChange={(e) => setMargenGanancia(Math.min(99, Math.max(0, Number(e.target.value))))}
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono font-bold text-center text-sm outline-none focus:border-emerald-400 transition-colors"
                          min="0"
                          max="99"
                          step="1"
                        />
                        <span className="absolute right-2 top-1.5 text-slate-400 font-bold text-sm">%</span>
                      </div>
                    </div>
                    <div className="flex-1 p-4 text-center bg-emerald-950/30">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Precio Sugerido</p>
                      <p className="text-2xl font-black text-emerald-300">
                        {margenGanancia > 0 && margenGanancia < 100
                          ? `$${((costoFijoUnitario + costoVariable) / (1 - margenGanancia / 100)).toFixed(2)}`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Fila del botón */}
                  <div className="relative z-10 p-3">
                    <button 
                      onClick={handleGuardarEnsamble}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-black text-sm uppercase tracking-wider flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/30"
                    >
                      <CheckCircle2 size={18} strokeWidth={2.5} /> GUARDAR RECETA
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
