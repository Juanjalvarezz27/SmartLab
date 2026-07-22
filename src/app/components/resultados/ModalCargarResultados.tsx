"use client";

import { useState, useEffect, useRef } from "react";
import { fetchJSON } from "@/lib/fetchWithRetry";
import { X, Microscope, CheckCircle, Save, Loader2, AlertCircle, FileSignature, Lock, Check, ChevronDown, Plus, Minus } from "lucide-react";
import { toast } from "react-toastify";

interface ModalCargarResultadosProps {
  orden: any;
  onClose: () => void;
  onSuccess: (cerrar?: boolean) => void; 
}

export default function ModalCargarResultados({ orden, onClose, onSuccess }: ModalCargarResultadosProps) {
  const [guardando, setGuardando] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [accionActualModal, setAccionActualModal] = useState<"FIRMAR" | "EDITAR">("FIRMAR");
  
  // Estados para Firmas
  const [bioanalistas, setBioanalistas] = useState<any[]>([]);
  const [selectedBioanalista, setSelectedBioanalista] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pinFirma, setPinFirma] = useState("");
  const [seleccionados, setSeleccionados] = useState<Record<string, boolean>>({});
  
  const [valores, setValores] = useState<Record<string, string[]>>({});
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});
  const [obsExpandidas, setObsExpandidas] = useState<Record<string, boolean>>({});
  const [notasSubcategoria, setNotasSubcategoria] = useState<Record<string, string>>({});
  const [notasSubcategoriaExpandidas, setNotasSubcategoriaExpandidas] = useState<Record<string, boolean>>({});
  const [valoresReferenciaCustom, setValoresReferenciaCustom] = useState<Record<string, string>>({});
  const [openSelect, setOpenSelect] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (dropdownRef.current && !dropdownRef.current.contains(target as Node)) {
        setDropdownOpen(false);
      }

      try {
        if (target && target.classList && target.classList.contains('overflow-y-auto')) {
          const rect = target.getBoundingClientRect();
          if (event.clientX >= rect.right - 25) return;
        }
        if (target && target.closest && !target.closest('.custom-select-container')) {
          setOpenSelect(null);
        }
      } catch (err: any) {
        setOpenSelect(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetch("/api/bioanalistas")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBioanalistas(data);
      })
      .catch(() => console.log("Error cargando bioanalistas"));

    if (orden && orden.detalles) {
      const initialValores: Record<string, string[]> = {};
      const initialObs: Record<string, string> = {};
      const initialExp: Record<string, boolean> = {};
      const initialSel: Record<string, boolean> = {};
      const initialValRefCustom: Record<string, string> = {};

      orden.detalles.forEach((d: any) => {
        initialValores[d.id] = Array(d.cantidad).fill("");

        if (d.resultado) {
          initialObs[d.id] = d.resultado.observaciones || "";
          if (d.resultado.observaciones) initialExp[d.id] = true;
          if (d.resultado.valoresReferencia) initialValRefCustom[d.id] = d.resultado.valoresReferencia;

          if (d.resultado.valores && d.resultado.valores.length > 0) {
            const arr = Array(Math.max(d.cantidad, d.resultado.valores.length)).fill("");
            d.resultado.valores.forEach((valObj: any, index: number) => {
              arr[index] = valObj.valorIngresado || "";
            });
            initialValores[d.id] = arr;
          }
        }
      });
      setValores(initialValores);
      setObservaciones(initialObs);
      setObsExpandidas(initialExp);
      setSeleccionados(initialSel);
      setSeleccionados(initialSel);
      setValoresReferenciaCustom(initialValRefCustom);

      const initialNotasSub: Record<string, string> = {};
      const initialNotasSubExp: Record<string, boolean> = {};
      if (orden.notasSubcategoria && Array.isArray(orden.notasSubcategoria)) {
        orden.notasSubcategoria.forEach((ns: any) => {
          initialNotasSub[ns.subcategoria] = ns.nota;
          if (ns.nota) initialNotasSubExp[ns.subcategoria] = true;
        });
      }
      setNotasSubcategoria(initialNotasSub);
      setNotasSubcategoriaExpandidas(initialNotasSubExp);
    }
  }, [orden]);

  // Autoscroll para el menú desplegable cuando se abre
  useEffect(() => {
    if (openSelect) {
      setTimeout(() => {
        const menu = document.getElementById(`dropdown-menu-${openSelect}`);
        if (menu) {
          menu.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    }
  }, [openSelect]);

  const handleValorChange = (detalleId: string, index: number, valorInput: string) => {
    setValores(prev => {
      const nuevosValores = prev[detalleId] ? [...prev[detalleId]] : [];
      nuevosValores[index] = valorInput;
      return { ...prev, [detalleId]: nuevosValores };
    });
  };

  const toggleSeleccionTodos = () => {
    const examenesLibres = orden.detalles.filter((d:any) => !d.resultado?.firmado);
    const todosSeleccionados = examenesLibres.every((d:any) => seleccionados[d.id]);
    const nuevoEstado = !todosSeleccionados;
    
    setSeleccionados(prev => {
      const nuevos = { ...prev };
      examenesLibres.forEach((d: any) => {
        nuevos[d.id] = nuevoEstado;
      });
      return nuevos;
    });
  };

  const sortedDetalles = [...orden.detalles].sort((a: any, b: any) => {
    const ordenA = a.prueba?.ordenVisual || 0;
    const ordenB = b.prueba?.ordenVisual || 0;
    return ordenA - ordenB;
  });

  const groupedDetalles = sortedDetalles.reduce((acc: any, det: any) => {
    // Si la prueba tiene una categoriaVisual o subcategoriaVisual, las usamos prioritariamente
    const catNombre = (det.prueba?.categoriaVisual || det.prueba?.subcategoria?.categoria?.nombre || "OTROS").trim().toUpperCase();
    const subcatNombre = (det.prueba?.subcategoriaVisual || det.prueba?.subcategoria?.nombre || "PRUEBAS INDIVIDUALES").trim().toUpperCase();
    if (!acc[catNombre]) acc[catNombre] = {};
    if (!acc[catNombre][subcatNombre]) acc[catNombre][subcatNombre] = [];
    acc[catNombre][subcatNombre].push(det);
    return acc;
  }, {});

  const abrirModalFirma = () => {
    setAccionActualModal("FIRMAR");
    const initialSel: Record<string, boolean> = {};
    orden.detalles.forEach((d: any) => {
      if (!d.resultado?.firmado) {
        initialSel[d.id] = false;
      }
    });
    setSeleccionados(initialSel);
    setPinFirma("");
    setSelectedBioanalista("");
    setShowPinModal(true);
  };

  const abrirModalEdicion = () => {
    setAccionActualModal("EDITAR");
    setPinFirma("");
    setSelectedBioanalista("");
    setShowPinModal(true);
  };

  const procesarResultados = async (accion: "GUARDAR" | "FIRMAR" | "EDITAR", pin = "") => {
    let faltantes = false;
    
    // Si es EDITAR, consideramos TODOS los detalles de la orden
    const examenesBase = accion === "EDITAR" 
      ? orden.detalles 
      : orden.detalles.filter((d: any) => !d.resultado?.firmado);
    
    const examenesAValidar = accion === "FIRMAR" 
      ? examenesBase.filter((d: any) => seleccionados[d.id]) 
      : examenesBase;

    if (accion === "FIRMAR" && examenesAValidar.length === 0) {
      toast.warning("Debe seleccionar al menos un examen para firmar.");
      return;
    }

    // Validación: Suma de porcentajes en RECUENTO DIFERENCIAL no debe exceder 100%
    for (const d of examenesBase) {
      if (d.prueba?.nombre?.toUpperCase().includes("RECUENTO DIFERENCIAL")) {
        const valoresDeDetalle = valores[d.id] || [];
        let totalPorcentaje = 0;
        for (const valText of valoresDeDetalle) {
          const match = valText.match(/\d+(\.\d+)?/);
          if (match) {
            totalPorcentaje += parseFloat(match[0]);
          }
        }
        if (totalPorcentaje > 100) {
          toast.error(`El porcentaje total en ${d.prueba.nombre} no puede exceder el 100%. (Suma actual: ${totalPorcentaje}%)`);
          return;
        }
      }
    }

    for (const d of examenesAValidar) {
      const valoresDeDetalle = valores[d.id];
      const itemsLength = Math.max(d.cantidad, valoresDeDetalle?.length || 0);
      for (let i = 0; i < itemsLength; i++) {
        if (!valoresDeDetalle?.[i]?.trim()) {
          faltantes = true;
          break;
        }
      }
      
      if (!d.prueba.valoresReferencia && !valoresReferenciaCustom[d.id]?.trim()) {
        faltantes = true;
      }
      
      if (faltantes) break;
    }

    if (faltantes && (accion === "FIRMAR" || accion === "EDITAR")) {
      toast.error(accion === "FIRMAR" ? "Asegúrese de haber transcrito todos los resultados y valores de referencia pendientes de los exámenes seleccionados." : "Debe llenar todos los resultados y valores de referencia antes de guardar la edición.");
      return;
    }

    const resultadosArray = examenesBase.map((d: any) => ({
      detalleOrdenId: d.id,
      observaciones: observaciones[d.id] || "",
      valoresReferencia: valoresReferenciaCustom[d.id] || null,
      marcadoParaFirma: (accion === "FIRMAR" || accion === "EDITAR") ? (accion === "EDITAR" ? true : !!seleccionados[d.id]) : false, 
      valores: (valores[d.id] || Array(d.cantidad).fill("")).map((valText: string) => ({
        pruebaId: d.prueba.id,
        valorIngresado: valText
      }))
    }));

    const payloadNotasSubcategoria = Object.entries(notasSubcategoria).map(([subcategoria, nota]) => ({
      subcategoria,
      nota
    }));

    setGuardando(true);
    try {
      await fetchJSON("/api/resultados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ordenId: orden.id, 
          resultados: resultadosArray, 
          accion, 
          pin, 
          bioanalistaId: selectedBioanalista,
          notasSubcategoria: payloadNotasSubcategoria
        })
      });

      setGuardando(false);

      if (accion === "FIRMAR" || accion === "EDITAR") {
        if (accion === "FIRMAR") {
          const pendientesRestantes = examenesBase.length - examenesAValidar.length;
          if (pendientesRestantes > 0) {
            toast.success("Resultados validados. Faltan pruebas por firmar.");
            setShowPinModal(false);
            setPinFirma("");
            setSelectedBioanalista("");
            onSuccess(false); 
          } else {
            toast.success("Todos los resultados han sido validados y firmados.");
            setShowPinModal(false);
            onSuccess(true); 
          }
        } else {
          // EDITAR
          toast.success("Edición guardada exitosamente.");
          setShowPinModal(false);
          onSuccess(true);
        }
      } else {
        toast.success("Transcripción guardada exitosamente.");
        onSuccess(true);
      }

    } catch (error: any) {
      toast.error(error.message);
      setGuardando(false); 
    }
  };

  const confirmarFirma = () => {
    if (accionActualModal === "FIRMAR") {
      if (!selectedBioanalista) return toast.error("Debe seleccionar una bioanalista.");
      if (pinFirma.length !== 4) return toast.error("El PIN debe tener 4 dígitos.");
    } else {
      if (!pinFirma) return toast.error("Debe ingresar la clave maestra.");
    }
    procesarResultados(accionActualModal, pinFirma);
  };

  const examenesPendientes = orden.detalles.filter((d: any) => !d.resultado?.firmado);

  // Agrupamos los pendientes por categoría para el modal de firma
  const pendientesAgrupados = examenesPendientes.reduce((acc: any, det: any) => {
    const catNombre = (det.prueba?.categoriaVisual || det.prueba?.subcategoria?.categoria?.nombre || "OTROS").trim().toUpperCase();
    if (!acc[catNombre]) acc[catNombre] = [];
    acc[catNombre].push(det);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      
      {/* Fondo estático */}
      <div className="absolute inset-0 bg-[#1D1D1F]/80" onClick={!guardando && !showPinModal ? onClose : undefined}></div>

      {/* MODAL PRINCIPAL */}
      {/* OJO: Quité la opacidad condicional para evitar el bug visual del fondo transparente */}
      <div className={`relative w-full max-w-5xl max-h-[95vh] bg-[#F5F5F7] rounded-[32px] shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${showPinModal ? 'pointer-events-none' : ''}`}>
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border ${orden.resultadosCompletados ? 'bg-green-50 border-green-100 text-green-600' : 'bg-purple-50 border-purple-100 text-purple-600'}`}>
              {orden.resultadosCompletados ? <CheckCircle size={28} strokeWidth={2.5} /> : <Microscope size={28} strokeWidth={2.5} />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">
                  {orden.resultadosCompletados ? 'Edición de Resultados' : 'Transcripción de Resultados'}
                </h2>
                <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                  Orden #{orden.id.toString().padStart(6, '0')}
                </span>
              </div>
              <p className="text-[15px] font-medium text-slate-500 mt-1">
                Paciente: <span className="font-black text-[#1D1D1F]">{orden.paciente.nombreCompleto}</span>
                <span className="mx-2 opacity-50">|</span>
                C.I: <span className="font-bold text-slate-700">{orden.paciente.cedula || 'S/N'}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={guardando || showPinModal} className="p-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 rounded-full transition-all shadow-sm">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 pb-40 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">

          {!orden.resultadosCompletados && (
            <div className="bg-white border-l-4 border-l-orange-500 border-y border-r border-slate-200 rounded-r-2xl p-5 flex gap-4 mb-8 shadow-sm">
              <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={24} />
              <div>
                <h4 className="text-[#1D1D1F] font-bold text-[15px]">Atención Asistente</h4>
                <p className="text-sm text-slate-600 font-medium mt-1">
                  Transcriba los valores cuidadosamente. Presione <strong>Guardar Transcripción</strong> al terminar. Las bioanalistas usarán el botón de <strong>Validar y Firmar</strong> para certificar los resultados.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
            {Object.entries(groupedDetalles).map(([catNombre, subcategorias]) => {
              const hasOpenSelectInCat = openSelect && Object.values(subcategorias as any).flat().some((d: any) => openSelect.startsWith(`${d.id}-`));
              return (
              <div key={catNombre} className={`mb-2 relative ${hasOpenSelectInCat ? 'z-50' : 'z-10'}`}>

                <div className="bg-slate-100/80 px-8 py-3.5 border-y border-slate-200 flex justify-between items-center">
                  <h3 className="text-[17px] font-black text-[#1D1D1F] tracking-widest uppercase">
                    {catNombre}
                  </h3>
                </div>

                {Object.entries(subcategorias as any).map(([subCatNombre, detalles]: [string, any]) => {
                  const hasOpenSelectInSubcat = openSelect && detalles.some((d: any) => openSelect.startsWith(`${d.id}-`));
                  return (
                  <div key={subCatNombre} className={`px-8 py-5 relative ${hasOpenSelectInSubcat ? 'z-50' : 'z-10'}`}>

                    <div className="mb-4 border-b-2 border-[#1D1D1F] pb-2 flex justify-between items-center">
                      <h4 className="text-sm font-black text-slate-600 uppercase tracking-widest">
                        {subCatNombre}
                      </h4>
                      <button
                        onClick={() => setNotasSubcategoriaExpandidas(prev => ({ ...prev, [subCatNombre]: !prev[subCatNombre] }))}
                        className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest ${notasSubcategoriaExpandidas[subCatNombre] || notasSubcategoria[subCatNombre] ? 'bg-blue-100 text-[#0071E3]' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-600'}`}
                        title="Añadir Nota a Subcategoría"
                      >
                        <FileSignature size={14} strokeWidth={2.5} />
                        Nota
                      </button>
                    </div>

                    {(notasSubcategoriaExpandidas[subCatNombre] || notasSubcategoria[subCatNombre]) && (
                      <div className="mb-4 px-2">
                        <textarea
                          placeholder={`Añadir nota general para ${subCatNombre}...`}
                          value={notasSubcategoria[subCatNombre] || ""}
                          onChange={(e) => setNotasSubcategoria(prev => ({ ...prev, [subCatNombre]: e.target.value }))}
                          className="w-full text-sm font-medium bg-yellow-50/50 border border-yellow-200 text-yellow-900 rounded-lg p-3 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 min-h-[60px] resize-y"
                        />
                      </div>
                    )}

                    <div className="flex items-center text-xs font-black text-slate-800 uppercase tracking-wider mb-2 px-2">
                      <div className="w-[30%]">Parametro</div>
                      <div className="w-[30%] text-center">Resultados</div>
                      <div className="w-[20%] text-center">Unidades</div>
                      <div className="w-[20%] text-center">Valores de Referencia</div>
                    </div>

                    <div className="space-y-1">
                      {detalles.map((det: any) => {
                        const estaFirmado = det.resultado?.firmado;
                        const esLectura = estaFirmado && !orden.resultadosCompletados;
                        
                        return (
                        <div key={det.id} className={`flex flex-col group rounded-xl p-2 border transition-colors ${estaFirmado ? 'bg-green-50/30 border-green-100' : 'hover:bg-slate-50 border-transparent hover:border-slate-200'} ${openSelect?.startsWith(`${det.id}-`) ? 'relative z-50' : 'relative z-10'}`}>

                          <div className="flex items-center">
                            
                            <div className="w-[30%] flex items-center gap-3 pl-2">
                              <div className="flex flex-col">
                                <span className={`text-[15px] font-semibold ${estaFirmado ? 'text-green-800' : 'text-[#1D1D1F]'}`}>
                                  {det.prueba.nombre}
                                </span>
                                {estaFirmado ? (
                                  <span className="text-[10px] text-emerald-600 font-black mt-0.5 flex items-center gap-1 uppercase">
                                    <Check size={12} strokeWidth={3} /> Firmado por: {det.resultado.procesadoPor?.nombre}
                                  </span>
                                ) : det.cantidad > 1 && (
                                  <span className="text-[10px] text-[#0071E3] font-black mt-0.5 uppercase tracking-wide">
                                    Requiere {det.cantidad} Muestras
                                  </span>
                                )}
                               </div>
                              {!esLectura && (
                                <button
                                  onClick={() => setObsExpandidas(prev => ({ ...prev, [det.id]: !prev[det.id] }))}
                                  className={`p-1.5 rounded-lg transition-colors ${obsExpandidas[det.id] || observaciones[det.id] ? 'bg-blue-100 text-[#0071E3]' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                                  title="Añadir Observación"
                                >
                                  <FileSignature size={14} strokeWidth={2.5} />
                                </button>
                              )}
                            </div>

                            <div className="w-[30%] px-2 flex flex-col gap-1.5">
                              {(() => {
                                const currentValores = valores[det.id] && valores[det.id].length > 0 ? valores[det.id] : Array(det.cantidad).fill("");

                                return currentValores.map((_, i) => {
                                  const tieneOpciones = !!det.prueba.opcionesPredefinidas;
                                  const opcionesArray = tieneOpciones ? det.prueba.opcionesPredefinidas.split(',').map((o: string) => o.trim()).filter(Boolean) : [];

                                  const isSelectOpen = openSelect === `${det.id}-${i}`;
                                  const selectedValue = valores[det.id]?.[i] || "";

                                  return (
                                    <div key={i} className="flex items-center gap-1 w-full">
                                      <div className="flex-1 relative">
                                        {tieneOpciones && opcionesArray.length > 0 ? (
                                          <div className={`relative w-full custom-select-container ${isSelectOpen ? 'z-50' : 'z-10'}`}>
                                            <div className="relative w-full flex items-center">
                                              <input
                                                type="text"
                                                disabled={esLectura}
                                                value={selectedValue}
                                                onChange={(e) => handleValorChange(det.id, i, e.target.value)}
                                                className={`w-full text-center text-[14px] font-black bg-white border rounded-lg pl-3 pr-8 py-1.5 outline-none transition-all shadow-sm focus:ring-2 focus:ring-[#0071E3]/20 ${
                                                  esLectura ? 'border-green-200 text-green-700 bg-green-50/50 cursor-not-allowed' : selectedValue.trim() ? 'border-[#0071E3] text-[#0071E3]' : 'border-slate-300 text-[#1D1D1F] focus:border-[#0071E3]'
                                                }`}
                                                placeholder="Seleccione o escriba"
                                              />
                                              <button
                                                type="button"
                                                disabled={esLectura}
                                                onClick={() => setOpenSelect(isSelectOpen ? null : `${det.id}-${i}`)}
                                                className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors ${esLectura ? 'cursor-not-allowed opacity-50' : 'hover:bg-slate-100 cursor-pointer'}`}
                                              >
                                                <ChevronDown size={14} className={`transition-transform ${isSelectOpen ? "rotate-180" : ""}`} />
                                              </button>
                                            </div>
                                            
                                            {isSelectOpen && (
                                              <div id={`dropdown-menu-${det.id}-${i}`} className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden py-1 z-50">
                                                <div className="max-h-40 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200">
                                                  <button
                                                    type="button"
                                                    onClick={() => { handleValorChange(det.id, i, ""); setOpenSelect(null); }}
                                                    className={`w-full text-center px-2 py-2 text-[13px] font-bold transition-colors ${!selectedValue ? "bg-[#0071E3]/10 text-[#0071E3]" : "text-slate-500 hover:bg-slate-50"}`}
                                                  >
                                                    Seleccione
                                                  </button>
                                                  {opcionesArray.map((opc: string) => (
                                                    <button
                                                      key={opc}
                                                      type="button"
                                                      onClick={() => { handleValorChange(det.id, i, opc); setOpenSelect(null); }}
                                                      className={`w-full text-center px-2 py-2 text-[13px] font-bold transition-colors ${selectedValue === opc ? "bg-[#0071E3]/10 text-[#0071E3]" : "text-slate-700 hover:bg-slate-50"}`}
                                                    >
                                                      {opc}
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <input
                                            type="text"
                                            disabled={esLectura}
                                            value={valores[det.id]?.[i] || ""}
                                            onChange={(e) => handleValorChange(det.id, i, e.target.value)}
                                            className={`w-full text-center text-[14px] font-black bg-white border rounded-lg py-1.5 outline-none transition-all shadow-sm focus:ring-2 focus:ring-[#0071E3]/20 ${
                                              esLectura ? 'border-green-200 text-green-700 bg-green-50/50 cursor-not-allowed' : valores[det.id]?.[i]?.trim() ? 'border-[#0071E3] text-[#0071E3]' : 'border-slate-300 text-[#1D1D1F] focus:border-[#0071E3]'
                                            }`}
                                            placeholder={currentValores.length > 1 ? `Resultado ${i + 1}` : "-"}
                                          />
                                        )}
                                      </div>

                                      {/* Controles Dinámicos */}
                                      {!esLectura && (
                                        <div className="flex items-center gap-1 shrink-0 ml-1">
                                          {i === currentValores.length - 1 && (
                                            <button
                                              type="button"
                                              title="Agregar Resultado"
                                              onClick={() => {
                                                const nuevos = [...currentValores, ""];
                                                setValores(prev => ({ ...prev, [det.id]: nuevos }));
                                              }}
                                              className="p-1.5 bg-blue-50 text-[#0071E3] border border-blue-200 hover:bg-[#0071E3] hover:text-white rounded-md transition-all shadow-sm"
                                            >
                                              <Plus size={14} strokeWidth={3} />
                                            </button>
                                          )}
                                          {currentValores.length > det.cantidad && i >= det.cantidad && (
                                            <button
                                              type="button"
                                              title="Eliminar Resultado"
                                              onClick={() => {
                                                const nuevos = [...currentValores];
                                                nuevos.splice(i, 1);
                                                setValores(prev => ({ ...prev, [det.id]: nuevos }));
                                              }}
                                              className="p-1.5 bg-red-50 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white rounded-md transition-all shadow-sm"
                                            >
                                              <Minus size={14} strokeWidth={3} />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                });
                              })()}
                            </div>

                            <div className="w-[20%] text-sm text-slate-600 font-medium text-center">
                              {det.prueba.unidades || "-"}
                            </div>

                            <div className="w-[20%] text-[13px] text-slate-500 font-medium text-center whitespace-pre-wrap leading-tight">
                              {det.prueba.valoresReferencia ? (
                                det.prueba.valoresReferencia
                              ) : (
                                <textarea
                                  disabled={esLectura}
                                  value={valoresReferenciaCustom[det.id] || ""}
                                  onChange={(e) => setValoresReferenciaCustom(prev => ({...prev, [det.id]: e.target.value}))}
                                  placeholder="Indique valores ref..."
                                  rows={2}
                                  className={`w-full text-center text-[13px] font-medium bg-white border rounded-lg p-2 outline-none transition-all shadow-sm focus:ring-2 focus:ring-[#0071E3]/20 resize-none placeholder:text-slate-400 placeholder:text-xs placeholder:font-normal leading-tight ${
                                    esLectura ? 'border-green-200 text-green-700 bg-green-50/50 cursor-not-allowed' : valoresReferenciaCustom[det.id]?.trim() ? 'border-[#0071E3] text-[#0071E3]' : 'border-dashed border-orange-300 text-[#1D1D1F] focus:border-orange-500 bg-orange-50/30'
                                  }`}
                                />
                              )}
                            </div>
                          </div>

                          {(obsExpandidas[det.id] || observaciones[det.id]) && (
                            <div className="mt-3 w-full pl-6 pr-2">
                              <textarea
                                value={observaciones[det.id] || ""}
                                disabled={esLectura}
                                onChange={(e) => setObservaciones({ ...observaciones, [det.id]: e.target.value })}
                                placeholder={`Observación específica para ${det.prueba.nombre}...`}
                                rows={2}
                                className={`w-full border rounded-xl p-3 text-sm font-medium outline-none resize-none ${esLectura ? 'bg-green-50 border-green-200 text-green-800 cursor-not-allowed' : 'bg-yellow-50/50 border-yellow-200/60 text-slate-700 focus:ring-2 focus:ring-yellow-400/20'}`}
                              />
                            </div>
                          )}
                        </div>
                      )})}
                    </div>
                  </div>
                )})}
              </div>
            )})}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-200 bg-white shrink-0 flex justify-end gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10">
          <button onClick={onClose} disabled={guardando} className="px-6 py-3.5 text-[15px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors">
            Cerrar
          </button>
          
          {!orden.resultadosCompletados && (
            <button onClick={() => procesarResultados("GUARDAR")} disabled={guardando} className="px-6 py-3.5 text-[15px] font-bold text-[#0071E3] bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-2xl transition-colors flex items-center gap-2">
              <Save size={18} strokeWidth={2.5} /> Guardar Transcripción
            </button>
          )}

          {!orden.resultadosCompletados && examenesPendientes.length > 0 && (
            <button onClick={abrirModalFirma} disabled={guardando} className="px-8 py-3.5 text-[15px] font-black text-white bg-emerald-500 hover:bg-emerald-600 rounded-2xl transition-colors shadow-sm flex items-center gap-2">
              <Lock size={20} strokeWidth={2.5} /> Validar y Firmar
            </button>
          )}

          {orden.resultadosCompletados && (
            <button onClick={abrirModalEdicion} disabled={guardando} className="px-8 py-3.5 text-[15px] font-black text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-colors shadow-sm flex items-center gap-2">
              <FileSignature size={20} strokeWidth={2.5} /> Guardar Edición
            </button>
          )}
        </div>
      </div>

      {/* --- MINI-MODAL SUPERPUESTO (CAPA NEGRA SÓLIDA PARA OSCURECER EL MODAL PRINCIPAL) --- */}
      {showPinModal && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center bg-[#1D1D1F]/80">
          <div className="bg-white rounded-[24px] shadow-2xl p-8 border border-slate-100 flex flex-col w-full max-w-2xl mx-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden">
            
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-4 shrink-0">
              <div className="w-12 h-12 bg-blue-50 text-[#0071E3] rounded-full flex items-center justify-center shrink-0">
                <Lock size={24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-black text-[#1D1D1F] leading-tight">Autorización Médica</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Seleccione los exámenes y valide su identidad.
                </p>
              </div>
            </div>
            
            {/* Lista de Exámenes Agrupados (Solo al Firmar, no al Editar para no confundir) */}
            {accionActualModal === "FIRMAR" ? (
              <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col flex-1 min-h-[150px] overflow-hidden">
                <div className="flex justify-between items-center mb-3 shrink-0">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Exámenes a Firmar</label>
                  <button onClick={toggleSeleccionTodos} className="text-xs font-bold text-[#0071E3] hover:underline">
                    Seleccionar Todos
                  </button>
                </div>
                
                <div className="space-y-5 overflow-y-auto min-h-0 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300">
                  {Object.entries(pendientesAgrupados).map(([cat, dets]: [string, any]) => (
                    <div key={cat} className="space-y-2">
                      <div className="flex items-center border-b border-slate-200 pb-1.5 mb-2">
                        <label className="flex items-center gap-2.5 cursor-pointer group w-full">
                          <input
                            type="checkbox"
                            checked={dets.every((d: any) => seleccionados[d.id]) && dets.length > 0}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSeleccionados(prev => {
                                const nuevos = { ...prev };
                                dets.forEach((d: any) => {
                                  nuevos[d.id] = checked;
                                });
                                return nuevos;
                              });
                            }}
                            className="w-4 h-4 rounded text-[#0071E3] border-slate-300 focus:ring-[#0071E3] cursor-pointer"
                          />
                          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-700 transition-colors">
                            {cat}
                          </h4>
                        </label>
                      </div>
                      {dets.map((d: any) => (
                        <label key={d.id} className="flex items-center gap-3 cursor-pointer group p-2.5 bg-white hover:bg-[#F5F5F7] border border-slate-200 hover:border-slate-300 rounded-lg transition-all shadow-sm">
                          <input 
                            type="checkbox" 
                            checked={seleccionados[d.id] || false} 
                            onChange={(e) => setSeleccionados({...seleccionados, [d.id]: e.target.checked})}
                            className="w-4 h-4 rounded text-[#0071E3] border-slate-300 focus:ring-[#0071E3] cursor-pointer"
                          />
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-[#1D1D1F] leading-tight">{d.prueba.nombre}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-6 bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-center shrink-0">
                <p className="text-sm font-medium text-blue-800">
                  Ingrese la <strong>Clave Maestra</strong> para autorizar y registrar la edición de estos resultados.
                  <br/>
                  <span className="text-xs text-blue-600 mt-1 block">Las firmas originales se mantendrán intactas.</span>
                </p>
              </div>
            )}

            <div className={`grid ${accionActualModal === "FIRMAR" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"} gap-4 mb-5 shrink-0`}>
              
              {accionActualModal === "FIRMAR" && (
                <div className="w-full relative" ref={dropdownRef}>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Bioanalista</label>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-[#F5F5F7] border border-slate-200 rounded-lg text-[13px] font-bold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 text-left"
                  >
                    <span className="truncate">
                      {selectedBioanalista ? bioanalistas.find(b => b.id === selectedBioanalista)?.nombre : "Seleccionar"}
                    </span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden py-1 z-50">
                      <div className="max-h-40 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200">
                        {bioanalistas.map(bio => (
                          <button
                            key={bio.id}
                            type="button"
                            onClick={() => { setSelectedBioanalista(bio.id); setDropdownOpen(false); }}
                            className={`w-full text-left px-5 py-3 text-[14px] font-bold transition-colors ${selectedBioanalista === bio.id ? "bg-[#0071E3]/10 text-[#0071E3]" : "text-slate-600 hover:bg-slate-50"}`}
                          >
                            {bio.nombre}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block text-center">
                  {accionActualModal === "FIRMAR" ? "PIN de Firma" : "Clave Maestra"}
                </label>
                <input
                  type="password"
                  maxLength={accionActualModal === "FIRMAR" ? 4 : 50}
                  value={pinFirma}
                  onChange={(e) => {
                    if (accionActualModal === "FIRMAR") {
                      setPinFirma(e.target.value.replace(/\D/g, ""));
                    } else {
                      setPinFirma(e.target.value);
                    }
                  }}
                  placeholder="****"
                  className={`w-full text-center placeholder:tracking-normal px-3 py-2 bg-[#F5F5F7] border border-slate-200 rounded-lg text-lg font-black text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 ${accionActualModal === "FIRMAR" ? "tracking-[0.5em]" : "tracking-normal"}`}
                />
              </div>
            </div>

            <div className="flex gap-3 w-full border-t border-slate-100 pt-4 mt-auto shrink-0">
              <button onClick={() => setShowPinModal(false)} className="flex-1 py-2.5 text-[14px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
              <button onClick={confirmarFirma} disabled={guardando} className="flex-1 py-2.5 text-[14px] font-bold text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-lg transition-colors shadow-[0_4px_12px_rgba(0,113,227,0.25)] flex justify-center items-center gap-2 hover:-translate-y-0.5 active:translate-y-0">
                {guardando ? <Loader2 size={18} className="animate-spin" /> : <FileSignature size={18} strokeWidth={2.5}/>}
                {accionActualModal === "FIRMAR" ? "Firmar Seleccionados" : "Confirmar Edición"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}