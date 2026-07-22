"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Wallet, Edit2, Check, X, ChevronLeft, ChevronRight, Search, Settings, Save } from "lucide-react";
import { toast } from "react-toastify";
import ModalConfirmacion from "../../components/ui/ModalConfirmacion";
import { normalizeSearchString } from "../../../lib/stringUtils";

export default function TabCostosFijos() {
  const [costos, setCostos] = useState<any[]>([]);
  const [costoTotal, setCostoTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Formulario
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoMonto, setNuevoMonto] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Edit Mode
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editMonto, setEditMonto] = useState("");

  // Modal Eliminar
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [costoToDelete, setCostoToDelete] = useState<number | null>(null);

  // Configuración de Volumen
  const [volumenEstimado, setVolumenEstimado] = useState("");
  const [volumenOriginal, setVolumenOriginal] = useState("");
  const [cuotaFija, setCuotaFija] = useState(0);
  const [savingVolumen, setSavingVolumen] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/costos/fijos");
      const data = res.ok ? await res.json() : [];
      setCostos(Array.isArray(data) ? data : []);
      
      const total = Array.isArray(data) ? data.reduce((sum, item) => sum + item.montoMensualUSD, 0) : 0;
      setCostoTotal(total);
    } catch (error: any) {
      toast.error(error?.message ? `Error al cargar datos: ${error?.message}` : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/costos/config");
      if (res.ok) {
        const data = await res.json();
        setVolumenEstimado(data.config.volumenPruebasMensualEstimado.toString());
        setVolumenOriginal(data.config.volumenPruebasMensualEstimado.toString());
        setCuotaFija(data.cuotaFijaPorPrueba);
      }
    } catch (error: any) {
      console.error("Error al cargar configuración");
    }
  };

  useEffect(() => {
    fetchData();
    fetchConfig();
  }, []);

  const handleGuardarVolumen = async () => {
    const vol = parseInt(volumenEstimado);
    if (!vol || vol <= 0) return toast.warning("El volumen debe ser mayor a 0");
    setSavingVolumen(true);
    try {
      const res = await fetch("/api/costos/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volumenPruebasMensualEstimado: vol })
      });
      if (res.ok) {
        toast.success("Volumen actualizado");
        setVolumenOriginal(vol.toString());
        fetchConfig();
      }
    } catch (error: any) {
      toast.error(error?.message ? `Error al guardar: ${error?.message}` : "Error al guardar");
    } finally {
      setSavingVolumen(false);
    }
  };

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoMonto) return toast.warning("Completa los campos");

    try {
      const res = await fetch("/api/costos/fijos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoNombre, montoMensualUSD: parseFloat(nuevoMonto) })
      });
      if (res.ok) {
        toast.success("Gasto registrado");
        setNuevoNombre("");
        setNuevoMonto("");
        setShowForm(false);
        fetchData();
        setCurrentPage(1); // Go back to first page to see the new item
      }
    } catch (error: any) {
      toast.error(error?.message ? `Error al agregar: ${error?.message}` : "Error al agregar");
    }
  };

  const handleEliminarRequest = (id: number) => {
    setCostoToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmarEliminacion = async () => {
    if (!costoToDelete) return;
    try {
      const res = await fetch(`/api/costos/fijos/${costoToDelete}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Gasto eliminado");
        fetchData();
      }
    } catch (error: any) {
      toast.error(error?.message ? `Error al eliminar: ${error?.message}` : "Error al eliminar");
    } finally {
      setIsDeleteModalOpen(false);
      setCostoToDelete(null);
    }
  };

  const handleGuardarEdicion = async (id: number) => {
    if (!editNombre.trim() || !editMonto) return toast.warning("Nombre y monto requeridos");
    try {
      const res = await fetch(`/api/costos/fijos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: editNombre, montoMensualUSD: parseFloat(editMonto) })
      });
      if (res.ok) {
        toast.success("Costo actualizado");
        setEditId(null);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error?.message ? `Error al actualizar: ${error?.message}` : "Error al actualizar");
    }
  };

  // Search logic
  const filteredCostos = costos.filter(c => normalizeSearchString(c.nombre).includes(normalizeSearchString(searchTerm)));

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCostos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCostos.length / itemsPerPage);

  if (loading) return <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Cargando...</div>;

  return (
    <div className="w-full relative">
      <ModalConfirmacion
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmarEliminacion}
        titulo="Eliminar Gasto Fijo"
        mensaje="¿Estás seguro de que deseas eliminar este gasto mensual? Esta acción no se puede deshacer y afectará tu estructura de costos."
        textoConfirmar="Eliminar Gasto"
        textoCancelar="Cancelar"
        colorBoton="red"
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Gastos Fijos Mensuales
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">Registra aquí el alquiler, sueldos y servicios base.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar gasto..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset page on search
              }}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-[#0071E3] outline-none text-sm transition-all font-medium"
            />
          </div>
          
          <div className="text-left md:text-right bg-blue-50/50 px-5 py-3 rounded-2xl border border-blue-100/50 hidden md:block">
            <p className="text-[11px] font-black text-[#0071E3]/70 uppercase tracking-widest mb-1">Total Mensual Fijo</p>
            <p className="text-2xl font-black text-[#0071E3] leading-none">${costoTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Tarjeta de Configuración de Volumen */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <Settings size={22} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-base">Volumen Mensual Estimado de Pruebas</h3>
              <p className="text-slate-500 text-sm mt-1 font-medium">Este número define cuánto de tus gastos fijos absorbe cada prueba. Ajústalo según la temporada real de tu laboratorio.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-44">
              <input
                type="number"
                value={volumenEstimado}
                onChange={(e) => setVolumenEstimado(e.target.value)}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-400 outline-none transition-all font-mono font-bold text-lg text-center"
                min="1"
                placeholder="1000"
              />
              <span className="absolute -bottom-5 left-0 w-full text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">pruebas/mes</span>
            </div>
            {volumenEstimado !== volumenOriginal && (
              <button
                onClick={handleGuardarVolumen}
                disabled={savingVolumen}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                <Save size={16} /> Guardar
              </button>
            )}
          </div>
        </div>
        
        {volumenEstimado && parseInt(volumenEstimado) > 0 && costoTotal > 0 && (
          <div className="mt-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50/30 rounded-2xl border border-amber-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white text-amber-600 flex items-center justify-center font-black shadow-sm text-sm border border-amber-200">
              $
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Cuota Fija que absorbe cada prueba</p>
              <p className="font-mono font-black text-amber-700 text-xl leading-none">
                ${(costoTotal / parseInt(volumenEstimado)).toFixed(2)} <span className="text-sm font-bold text-slate-400">/ prueba</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {!showForm ? (
        <div className="flex justify-end mb-6">
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:border-[#0071E3] hover:text-[#0071E3] hover:shadow-md transition-all shadow-sm"
          >
            <Plus size={20} strokeWidth={2.5} /> Agregar Nuevo Gasto Fijo
          </button>
        </div>
      ) : (
        <form onSubmit={handleAgregar} className="bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 md:p-8 mb-8 transform transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0071E3] to-blue-400"></div>
          <h3 className="font-black text-slate-800 mb-6 text-lg">Registrar Nuevo Gasto Fijo</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Concepto</label>
              <input
                type="text"
                placeholder="Ej. Alquiler del Local"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#0071E3] outline-none transition-all font-medium"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Monto Mensual (USD)</label>
              <div className="relative">
                <span className="absolute left-5 top-3.5 text-slate-400 font-black">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={nuevoMonto}
                  onChange={(e) => setNuevoMonto(e.target.value)}
                  className="w-full pl-10 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#0071E3] outline-none transition-all font-mono font-medium"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition">
              Cancelar
            </button>
            <button type="submit" className="px-8 py-3 bg-[#0071E3] text-white font-bold rounded-xl hover:bg-blue-600 transition shadow-md shadow-blue-500/20">
              Guardar Gasto
            </button>
          </div>
        </form>
      )}

      {filteredCostos.length === 0 && !showForm ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
            <Wallet size={32} />
          </div>
          <p className="text-slate-500 font-medium">{searchTerm ? "No se encontraron gastos con esa búsqueda." : "No tienes gastos fijos registrados."}</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-widest">
                <th className="px-6 py-5">Concepto</th>
                <th className="px-6 py-5 text-right">Monto Mensual (USD)</th>
                <th className="px-6 py-5 text-center w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentItems.map(costo => (
                <tr key={costo.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:text-[#0071E3] group-hover:bg-blue-50 transition-colors shrink-0">
                        <Wallet size={18} />
                      </div>
                      {editId === costo.id ? (
                         <input 
                           type="text" 
                           value={editNombre}
                           onChange={e => setEditNombre(e.target.value)}
                           className="w-full px-3 py-2 bg-white border-2 border-[#0071E3] rounded-xl outline-none font-medium text-sm shadow-sm"
                         />
                      ) : (
                        <div>
                          <span className="font-bold text-slate-800 text-[15px] block">{costo.nombre}</span>
                          <span className="text-xs text-slate-400 font-medium">Gasto Operativo Fijo</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editId === costo.id ? (
                      <div className="flex items-center justify-end">
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                          <input 
                            type="number" 
                            value={editMonto}
                            onChange={e => setEditMonto(e.target.value)}
                            className="w-28 pl-7 pr-3 py-2 bg-white border-2 border-[#0071E3] rounded-xl outline-none font-mono text-sm shadow-sm"
                            step="0.01"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="font-mono text-xl font-black text-slate-700 group-hover:text-[#0071E3] transition-colors">
                        ${costo.montoMensualUSD.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editId === costo.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleGuardarEdicion(costo.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#0071E3] text-white hover:bg-blue-600 transition shadow-sm" title="Guardar cambios">
                          <Check size={18} strokeWidth={3} />
                        </button>
                        <button onClick={() => setEditId(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition" title="Descartar cambios">
                          <X size={18} strokeWidth={3} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => { 
                            setEditId(costo.id); 
                            setEditNombre(costo.nombre); 
                            setEditMonto(costo.montoMensualUSD.toString()); 
                          }}
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-[#0071E3] hover:bg-blue-50 bg-slate-50 transition-all border border-slate-100 shadow-sm hover:shadow"
                          title="Editar gasto fijo"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleEliminarRequest(costo.id)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 bg-slate-50 transition-all border border-slate-100 shadow-sm hover:shadow"
                          title="Eliminar gasto fijo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-6 bg-slate-50 border-t border-slate-100">
              <span className="text-sm font-medium text-slate-500">
                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredCostos.length)} de {filteredCostos.length}
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
