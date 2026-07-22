"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X, Box, ChevronDown, ChevronLeft, ChevronRight, Search, Package, Beaker, ChevronUp } from "lucide-react";
import { toast } from "react-toastify";
import ModalConfirmacion from "../../components/ui/ModalConfirmacion";
import { normalizeSearchString } from "../../../lib/stringUtils";

export default function TabInsumos() {
  const [insumos, setInsumos] = useState<any[]>([]);
  const [paquetes, setPaquetes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  const [showForm, setShowForm] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaUnidad, setNuevaUnidad] = useState("und");
  const [nuevaCantidad, setNuevaCantidad] = useState("");
  const [nuevoCostoTotal, setNuevoCostoTotal] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const unidadesOptions = [
    { value: "und", label: "Unidades (und)" },
    { value: "ml", label: "Mililitros (ml)" },
    { value: "mg", label: "Miligramos (mg)" },
    { value: "kit", label: "Kit Completo" }
  ];

  // Edit Mode
  const [editId, setEditId] = useState<number | null>(null);
  const [oldCostoUnitario, setOldCostoUnitario] = useState<number | null>(null);

  // Modal Eliminar Insumo
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [insumoToDelete, setInsumoToDelete] = useState<number | null>(null);

  // Modal Eliminar Paquete
  const [isDeletePaqueteModalOpen, setIsDeletePaqueteModalOpen] = useState(false);
  const [paqueteToDelete, setPaqueteToDelete] = useState<number | null>(null);

  // Paquetes - UI state
  const [expandedPaquete, setExpandedPaquete] = useState<number | null>(null);

  // Modal Crear/Editar Paquete
  const [showPaqueteModal, setShowPaqueteModal] = useState(false);
  const [paqueteEditId, setPaqueteEditId] = useState<number | null>(null);
  const [paqueteNombre, setPaqueteNombre] = useState("");
  const [paqueteItems, setPaqueteItems] = useState<any[]>([]);
  const [paqueteSearchInsumo, setPaqueteSearchInsumo] = useState("");
  const [paqueteDropdownOpen, setPaqueteDropdownOpen] = useState(false);

  const fetchInsumos = async () => {
    try {
      const res = await fetch("/api/costos/insumos");
      const data = res.ok ? await res.json() : [];
      setInsumos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error?.message ? `Error al cargar insumos: ${error?.message}` : "Error al cargar insumos");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaquetes = async () => {
    try {
      const res = await fetch("/api/costos/insumos/paquetes");
      const data = res.ok ? await res.json() : [];
      setPaquetes(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error?.message ? `Error al cargar paquetes: ${error?.message}` : "Error al cargar paquetes");
    }
  };

  useEffect(() => {
    Promise.all([fetchInsumos(), fetchPaquetes()]);
  }, []);

  // --- Insumos CRUD ---
  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoCostoTotal || !nuevaCantidad) return toast.warning("Completa los campos");

    const cantidad = parseFloat(nuevaCantidad);
    const costoTotal = parseFloat(nuevoCostoTotal);
    if (cantidad <= 0) return toast.warning("La cantidad debe ser mayor a 0");

    const costoUnitarioCalculado = costoTotal / cantidad;
 
    try {
      const url = editId ? `/api/costos/insumos/${editId}` : "/api/costos/insumos";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nombre: nuevoNombre, 
          unidadMedida: nuevaUnidad, 
          costoUnitarioUSD: costoUnitarioCalculado,
          cantidadComprada: cantidad,
          costoTotalUSD: costoTotal
        })
      });
      if (res.ok) {
        toast.success(editId ? "Insumo actualizado" : "Insumo registrado");
        setNuevoNombre("");
        setNuevaCantidad("");
        setNuevoCostoTotal("");
        setEditId(null);
        setOldCostoUnitario(null);
        setShowForm(false);
        fetchInsumos();
        if (!editId) setCurrentPage(1);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || `Error al ${editId ? "actualizar" : "agregar"}`);
      }
    } catch (error: any) {
      toast.error(error?.message || `Error al ${editId ? "actualizar" : "agregar"}`);
    }
  };

  const handleEliminarRequest = (id: number) => {
    setInsumoToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmarEliminacion = async () => {
    if (!insumoToDelete) return;
    try {
      const res = await fetch(`/api/costos/insumos/${insumoToDelete}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Insumo eliminado");
        fetchInsumos();
      }
    } catch (error: any) {
      toast.error(error?.message ? `Error al eliminar: ${error?.message}` : "Error al eliminar");
    } finally {
      setIsDeleteModalOpen(false);
      setInsumoToDelete(null);
    }
  };



  // --- Paquetes CRUD ---
  const abrirModalCrearPaquete = () => {
    setPaqueteEditId(null);
    setPaqueteNombre("");
    setPaqueteItems([]);
    setPaqueteSearchInsumo("");
    setShowPaqueteModal(true);
  };

  const abrirModalEditarPaquete = (paquete: any) => {
    setPaqueteEditId(paquete.id);
    setPaqueteNombre(paquete.nombre);
    setPaqueteItems(paquete.items.map((item: any) => ({
      insumoId: item.insumo.id,
      nombre: item.insumo.nombre,
      unidadMedida: item.insumo.unidadMedida,
      costoUnitarioUSD: item.insumo.costoUnitarioUSD,
      cantidadUsada: item.cantidadUsada.toString(),
    })));
    setPaqueteSearchInsumo("");
    setShowPaqueteModal(true);
  };

  const handleAgregarInsumoPaquete = (insumo: any) => {
    if (paqueteItems.find(i => i.insumoId === insumo.id)) {
      toast.info("Este insumo ya está en el paquete");
      return;
    }
    setPaqueteItems([...paqueteItems, {
      insumoId: insumo.id,
      nombre: insumo.nombre,
      unidadMedida: insumo.unidadMedida,
      costoUnitarioUSD: insumo.costoUnitarioUSD,
      cantidadUsada: "",
    }]);
    setPaqueteSearchInsumo("");
    setPaqueteDropdownOpen(false);
  };

  const handleRemoverInsumoPaquete = (insumoId: number) => {
    setPaqueteItems(paqueteItems.filter(i => i.insumoId !== insumoId));
  };

  const handleCantidadPaqueteChange = (insumoId: number, value: string) => {
    setPaqueteItems(paqueteItems.map(i =>
      i.insumoId === insumoId ? { ...i, cantidadUsada: value } : i
    ));
  };

  const handleGuardarPaquete = async () => {
    if (!paqueteNombre.trim()) return toast.warning("El nombre del paquete es requerido");
    
    const validItems = paqueteItems.filter(i => parseFloat(i.cantidadUsada || "0") > 0);
    if (validItems.length === 0) return toast.warning("Agrega al menos un insumo con cantidad mayor a 0");

    const payload = {
      nombre: paqueteNombre,
      items: validItems.map(i => ({ insumoId: i.insumoId, cantidadUsada: parseFloat(i.cantidadUsada) })),
    };

    try {
      const url = paqueteEditId 
        ? `/api/costos/insumos/paquetes/${paqueteEditId}` 
        : "/api/costos/insumos/paquetes";
      const method = paqueteEditId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error ? `Error al guardar el paquete: ${errorData.error}` : "Error al guardar el paquete");
        return;
      }

      toast.success(paqueteEditId ? "Paquete actualizado" : "Paquete creado");
      // Refrescar datos antes de cerrar el modal
      await fetchPaquetes();
      setShowPaqueteModal(false);
    } catch (error: any) {
      toast.error(error?.message ? `Error al guardar el paquete: ${error?.message}` : "Error al guardar el paquete");
    }
  };

  const handleEliminarPaqueteRequest = (id: number) => {
    setPaqueteToDelete(id);
    setIsDeletePaqueteModalOpen(true);
  };

  const confirmarEliminacionPaquete = async () => {
    if (!paqueteToDelete) return;
    try {
      const res = await fetch(`/api/costos/insumos/paquetes/${paqueteToDelete}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Paquete eliminado");
        fetchPaquetes();
      }
    } catch (error: any) {
      toast.error(error?.message ? `Error al eliminar el paquete: ${error?.message}` : "Error al eliminar el paquete");
    } finally {
      setIsDeletePaqueteModalOpen(false);
      setPaqueteToDelete(null);
    }
  };

  // Costo total estimado de un paquete
  const calcularCostoPaquete = (paquete: any) => {
    return paquete.items.reduce((sum: number, item: any) => 
      sum + (item.cantidadUsada * item.insumo.costoUnitarioUSD), 0
    );
  };

  // Filtro de insumos disponibles en el modal de paquete
  const filteredInsumosParaPaquete = insumos.filter(i =>
    normalizeSearchString(i.nombre).includes(normalizeSearchString(paqueteSearchInsumo))
  );

  // Search logic
  const filteredInsumos = insumos.filter(i => normalizeSearchString(i.nombre).includes(normalizeSearchString(searchTerm)));

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInsumos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInsumos.length / itemsPerPage);

  if (loading) return <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Cargando inventario...</div>;

  return (
    <div className="w-full relative">
      <ModalConfirmacion
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmarEliminacion}
        titulo="Eliminar Insumo"
        mensaje="¿Estás seguro de que deseas eliminar este insumo del inventario? Si lo eliminas, los exámenes que lo usan en su receta podrían quedar incompletos."
        textoConfirmar="Eliminar Insumo"
        textoCancelar="Cancelar"
        colorBoton="red"
      />

      <ModalConfirmacion
        isOpen={isDeletePaqueteModalOpen}
        onClose={() => setIsDeletePaqueteModalOpen(false)}
        onConfirm={confirmarEliminacionPaquete}
        titulo="Eliminar Paquete"
        mensaje="¿Estás seguro de que deseas eliminar este paquete de insumos? Los insumos individuales no serán eliminados."
        textoConfirmar="Eliminar Paquete"
        textoCancelar="Cancelar"
        colorBoton="red"
      />

      {/* Modal Crear/Editar Paquete */}
      {showPaqueteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white w-full max-w-3xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-full max-h-[90vh] overflow-y-auto flex flex-col [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Package size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1D1D1F]">{paqueteEditId ? "Editar Paquete" : "Crear Paquete de Insumos"}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Agrupa insumos con cantidades predeterminadas</p>
                </div>
              </div>
              <button onClick={() => setShowPaqueteModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Nombre del paquete */}
            <div className="px-6 pt-5 pb-4 bg-white shrink-0">
              <label className="text-[11px] font-black text-indigo-600 uppercase tracking-widest ml-1 mb-2 block">Nombre del Paquete</label>
              <input
                type="text"
                placeholder="Ej. Kit Hematología, Pack Reactivos Tiroides..."
                value={paqueteNombre}
                onChange={e => setPaqueteNombre(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold"
                autoFocus
              />
            </div>

            {/* Buscador de insumos */}
            <div className="px-6 pb-4 bg-white shrink-0 relative z-20">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Agregar Insumos</label>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar insumo para agregar al paquete..."
                  value={paqueteSearchInsumo}
                  onChange={e => {
                    setPaqueteSearchInsumo(e.target.value);
                    if (e.target.value.trim() !== "") setPaqueteDropdownOpen(true);
                    else setPaqueteDropdownOpen(false);
                  }}
                  onFocus={() => { if (paqueteSearchInsumo.trim() !== "") setPaqueteDropdownOpen(true); }}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
                />
                {paqueteDropdownOpen && paqueteSearchInsumo.trim() !== "" && (
                  <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-xl py-2 flex flex-col z-50" style={{ maxHeight: "250px" }}>
                    <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {filteredInsumosParaPaquete.map(i => (
                        <div
                          key={i.id}
                          className="px-5 py-3 text-sm cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition-colors border-b border-slate-50 last:border-0 flex justify-between items-center group"
                          onClick={() => handleAgregarInsumoPaquete(i)}
                        >
                          <div>
                            <p className="font-bold text-slate-700 group-hover:text-indigo-600">{i.nombre}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Costo: ${i.costoUnitarioUSD.toFixed(4)} / {i.unidadMedida}</p>
                          </div>
                          <Plus size={16} className="text-slate-300 group-hover:text-indigo-600" />
                        </div>
                      ))}
                      {filteredInsumosParaPaquete.length === 0 && (
                        <div className="px-5 py-8 text-sm text-slate-400 font-medium text-center">No se encontraron insumos</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de insumos en el paquete */}
            <div className="bg-slate-50/50 p-6 relative z-0">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
                Insumos en el Paquete <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px]">{paqueteItems.length}</span>
              </h4>

              {paqueteItems.length === 0 ? (
                <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center text-slate-400 opacity-60">
                  <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 border border-slate-100">
                    <Package size={32} className="text-slate-300" strokeWidth={1.5} />
                  </div>
                  <p className="font-medium text-sm">Busca insumos arriba para agregarlos al paquete.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paqueteItems.map(item => (
                    <div key={item.insumoId} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:border-indigo-300 transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{item.nombre}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">Costo: <span className="text-indigo-600 font-bold">${item.costoUnitarioUSD.toFixed(4)}</span> / {item.unidadMedida}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="relative w-32">
                          <input
                            type="number"
                            placeholder="0.00"
                            value={item.cantidadUsada}
                            onChange={e => handleCantidadPaqueteChange(item.insumoId, e.target.value)}
                            className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                            min="0"
                            step="0.0001"
                          />
                          <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                            {item.unidadMedida}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoverInsumoPaquete(item.insumoId)}
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

            {/* Footer */}
            <div className="p-6 bg-white border-t border-slate-100 flex gap-4 shrink-0">
              <button type="button" onClick={() => setShowPaqueteModal(false)} className="flex-1 md:flex-none md:w-32 py-3.5 bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-200 hover:text-slate-800 transition-colors">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarPaquete}
                disabled={paqueteItems.length === 0}
                className={`flex-1 py-3.5 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  paqueteItems.length > 0
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Package size={18} strokeWidth={2.5} /> {paqueteEditId ? "Actualizar Paquete" : "Crear Paquete"}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Inventario de Insumos
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">Registra los reactivos y materiales descartables que consumes por prueba.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="text-left md:text-right bg-blue-50/50 px-5 py-3 rounded-2xl border border-blue-100/50 hidden md:block">
            <p className="text-[11px] font-black text-[#0071E3]/70 uppercase tracking-widest mb-1">Total en Inventario</p>
            <p className="text-2xl font-black text-[#0071E3] leading-none">{insumos.length}</p>
          </div>
        </div>
      </div>

      {/* Sección de Paquetes */}
      {paquetes.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 px-1">
            <Package size={18} className="text-indigo-500" />
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Paquetes de Insumos</h3>
            <span className="bg-indigo-100 text-indigo-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold">{paquetes.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paquetes.map(paquete => (
              <div key={paquete.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-indigo-200 group">
                <div 
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedPaquete(expandedPaquete === paquete.id ? null : paquete.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shrink-0">
                        <Package size={18} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-[15px] leading-tight">{paquete.nombre}</p>
                        <p className="text-xs font-medium text-slate-400 mt-1">{paquete.items.length} insumos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {expandedPaquete === paquete.id 
                        ? <ChevronUp size={18} className="text-slate-400" />
                        : <ChevronDown size={18} className="text-slate-400" />
                      }
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Costo estimado</span>
                    <span className="font-mono font-black text-indigo-600 text-lg">${calcularCostoPaquete(paquete).toFixed(4)}</span>
                  </div>
                </div>

                {/* Contenido expandido */}
                {expandedPaquete === paquete.id && (
                  <div className="border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                    <div className="px-5 py-3 bg-slate-50/80 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {paquete.items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-2">
                            <Beaker size={14} className="text-slate-400" />
                            <span className="text-sm font-medium text-slate-700">{item.insumo.nombre}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{item.cantidadUsada} {item.insumo.unidadMedida}</span>
                            <span className="text-xs font-mono font-bold text-indigo-600">${(item.cantidadUsada * item.insumo.costoUnitarioUSD).toFixed(4)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 py-3 bg-white border-t border-slate-100 flex justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); abrirModalEditarPaquete(paquete); }}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all"
                      >
                        <Edit2 size={14} /> Editar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEliminarPaqueteRequest(paquete.id); }}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all"
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      {!showForm && (
        <div className="flex flex-col md:flex-row justify-between md:justify-end items-center mb-6 gap-4">
          {/* Barra de Búsqueda */}
          <div className="relative w-full md:w-64 lg:w-80 md:mr-auto">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar insumo..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#0071E3] outline-none text-sm transition-all font-medium shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button 
              onClick={abrirModalCrearPaquete}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-indigo-200 rounded-xl text-indigo-600 font-bold hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md transition-all shadow-sm flex-1 md:flex-none"
            >
              <Package size={20} strokeWidth={2.5} /> Crear Paquete
            </button>
            <button 
              onClick={() => {
                setEditId(null);
                setOldCostoUnitario(null);
                setNuevoNombre("");
                setNuevaUnidad("und");
                setNuevaCantidad("");
                setNuevoCostoTotal("");
                setShowForm(true);
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:border-[#0071E3] hover:text-[#0071E3] hover:shadow-md transition-all shadow-sm flex-1 md:flex-none"
            >
              <Plus size={20} strokeWidth={2.5} /> Agregar Nuevo Insumo
            </button>
          </div>
        </div>
      )}

      {/* Formulario de agregar insumo individual */}
      {showForm && (
        <form id="form-insumo" onSubmit={handleAgregar} className="bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 md:p-8 mb-8 transform transition-all relative z-20">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0071E3] to-blue-400 rounded-t-3xl"></div>
          <h3 className="font-black text-slate-800 mb-6 text-lg">{editId ? "Editar Material" : "Registrar Nuevo Material"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Nombre</label>
              <input
                type="text"
                placeholder="Ej. Tubo Tapa Roja"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#0071E3] outline-none transition-all font-medium"
                autoFocus
                required
              />
            </div>
            
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Unidad</label>
              <div 
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer focus:ring-4 focus:ring-blue-50 transition-all"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="text-slate-700 font-medium">{unidadesOptions.find(o => o.value === nuevaUnidad)?.label}</span>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl py-2">
                  {unidadesOptions.map(option => (
                    <div 
                      key={option.value}
                      className={`px-5 py-3 text-sm cursor-pointer hover:bg-blue-50 hover:text-[#0071E3] transition-colors ${nuevaUnidad === option.value ? 'bg-blue-50 text-[#0071E3] font-bold' : 'text-slate-600 font-medium'}`}
                      onClick={() => {
                        setNuevaUnidad(option.value);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Cantidad Comprada</label>
              <input
                type="number"
                placeholder="Ej. 100"
                value={nuevaCantidad}
                onChange={(e) => setNuevaCantidad(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#0071E3] outline-none transition-all font-mono font-medium"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Costo Total (USD)</label>
              <div className="relative">
                <span className="absolute left-5 top-3.5 text-slate-400 font-black">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={nuevoCostoTotal}
                  onChange={(e) => setNuevoCostoTotal(e.target.value)}
                  className="w-full pl-10 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#0071E3] outline-none transition-all font-mono font-medium"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-stretch gap-4 mb-8">
            {editId && oldCostoUnitario !== null && (
              <div className="flex-1 p-5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white text-slate-400 flex items-center justify-center font-black shadow-sm border border-slate-100">
                  $
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Costo Unitario Actual</p>
                  <p className="font-mono font-black text-slate-700 text-2xl leading-none">
                    ${oldCostoUnitario.toFixed(4)} <span className="text-sm font-bold text-slate-400 ml-1">/ {nuevaUnidad}</span>
                  </p>
                </div>
              </div>
            )}
            
            {nuevaCantidad && nuevoCostoTotal && parseFloat(nuevaCantidad) > 0 && (
              <div className="flex-1 p-5 bg-gradient-to-r from-blue-50 to-indigo-50/30 rounded-2xl border border-blue-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white text-[#0071E3] flex items-center justify-center font-black shadow-sm">
                  $
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Nuevo Costo Calculado</p>
                  <p className="font-mono font-black text-[#0071E3] text-2xl leading-none">
                    ${(parseFloat(nuevoCostoTotal) / parseFloat(nuevaCantidad)).toFixed(4)} <span className="text-sm font-bold text-slate-400 ml-1">/ {nuevaUnidad}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); setOldCostoUnitario(null); }} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition">
              Cancelar
            </button>
            <button type="submit" className="px-8 py-3 bg-[#0071E3] text-white font-bold rounded-xl hover:bg-blue-600 transition shadow-md shadow-blue-500/20">
              {editId ? "Actualizar Insumo" : "Guardar en Inventario"}
            </button>
          </div>
        </form>
      )}

      {/* Tabla de insumos */}
      {filteredInsumos.length === 0 && !showForm ? (
         <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
             <Box size={32} />
           </div>
           <p className="text-slate-500 font-medium">{searchTerm ? "No se encontraron insumos con esa búsqueda." : "No tienes insumos registrados."}</p>
         </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-widest">
                  <th className="px-6 py-5">Nombre del Insumo</th>
                  <th className="px-6 py-5 text-center">Unidad</th>
                  <th className="px-6 py-5 text-right">Costo Unitario (USD)</th>
                  <th className="px-6 py-5 text-center w-32">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentItems.map(insumo => (
                  <tr key={insumo.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                          <Box size={18} />
                        </div>
                        <span className="font-bold text-slate-700 text-[15px]">{insumo.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1.5 bg-slate-100 text-slate-600 text-[11px] font-black rounded-lg uppercase tracking-wider border border-slate-200">
                        {insumo.unidadMedida}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-lg font-black text-slate-700 group-hover:text-[#0071E3] transition-colors">
                        ${insumo.costoUnitarioUSD.toFixed(4)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => { 
                            setEditId(insumo.id); 
                            setNuevoNombre(insumo.nombre);
                            setNuevaUnidad(insumo.unidadMedida);
                            setNuevaCantidad(insumo.cantidadComprada ? insumo.cantidadComprada.toString() : "");
                            setNuevoCostoTotal(insumo.costoTotalUSD ? insumo.costoTotalUSD.toString() : "");
                            setOldCostoUnitario(insumo.costoUnitarioUSD);
                            setShowForm(true);
                            setTimeout(() => {
                              document.getElementById('form-insumo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 50);
                          }}
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-[#0071E3] hover:bg-blue-50 bg-slate-50 transition-all border border-slate-100 shadow-sm hover:shadow"
                          title="Editar insumo"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleEliminarRequest(insumo.id)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 bg-slate-50 transition-all border border-slate-100 shadow-sm hover:shadow"
                          title="Eliminar insumo"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-6 bg-slate-50 border-t border-slate-100">
              <span className="text-sm font-medium text-slate-500">
                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredInsumos.length)} de {filteredInsumos.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors bg-white shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="px-4 py-2 rounded-xl bg-blue-50 text-[#0071E3] font-bold text-sm">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors bg-white shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
