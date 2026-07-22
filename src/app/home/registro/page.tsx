"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FileSignature, ArrowLeft, AlertTriangle, ExternalLink, X, ChevronDown, ChevronUp, DollarSign, CreditCard, Stethoscope, Calculator, Wallet, Calendar, Activity, FlaskConical, Package, Syringe } from "lucide-react";

// Hooks y Componentes
import useTasaBCV from "../../hooks/useTasaBcv";
import BuscadorPaciente from "../../components/registro/BuscadorPaciente";
import TarjetaPaciente from "../../components/registro/TarjetaPaciente";
import FormularioPaciente from "../../components/registro/FormularioPaciente";
import SeleccionPruebas from "../../components/registro/SeleccionPruebas";
import ResumenPago from "../../components/registro/ResumenPago";
import ServiciosExtras from "../../components/registro/ServiciosExtras";

function RegistroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  // Estados del Paciente
  const [cedulaBusqueda, setCedulaBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]);
  const [isCreandoNuevo, setIsCreandoNuevo] = useState(false);
  const [guardandoPaciente, setGuardandoPaciente] = useState(false);
  const [guardandoOrden, setGuardandoOrden] = useState(false);
  const [formData, setFormData] = useState({
    esBebe: false, cedula: "", nombreCompleto: "", fechaNacimiento: "",
    sexo: "M", telefono: "", correo: "", direccion: "", observaciones: ""
  });

  // Estado para la validación de órdenes
  const [modalOrdenesAbiertas, setModalOrdenesAbiertas] = useState(false);
  const [ordenesConflictivas, setOrdenesConflictivas] = useState<any[]>([]);
  const [ordenExpandidaId, setOrdenExpandidaId] = useState<number | null>(null);

  // Estados de Pruebas y Tasa
  const [pruebasCatalogo, setPruebasCatalogo] = useState<any[]>([]);
  const [pruebasSeleccionadas, setPruebasSeleccionadas] = useState<any[]>([]);
  const [serviciosCatalogo, setServiciosCatalogo] = useState<any[]>([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<any[]>([]);
  const { tasa } = useTasaBCV();
  const tasaBCV = tasa ?? 36.5;

  // 1. Cargar Catálogo de Pruebas
  useEffect(() => {
    const fetchCatalogo = async () => {
      try {
        const res = await fetch("/api/pruebas");
        const subcategorias = await res.json();
        
        const listaAplanada: any[] = [];
        
        subcategorias.forEach((sub: any) => {
          if (!sub.activa) return;
          
          if (sub.esPaquete) {
            listaAplanada.push({
              id: `sub-${sub.id}`,
              idReal: sub.id,
              tipo: "PAQUETE",
              codigo: sub.pruebas[0]?.codigo.split('-')[0] || "PK", 
              nombre: sub.nombre,
              precioUSD: sub.precioUSD,
              pruebasHijas: sub.pruebas,
              categoriaNombre: sub.categoria?.nombre || "S/C",
              subcategoriaNombre: sub.nombre 
            });
          } else {
            sub.pruebas.forEach((p: any) => {
              if (!p.activa) return;
              listaAplanada.push({
                ...p,
                tipo: "INDIVIDUAL",
                idReal: p.id,
                nombre: p.nombre,
                precioUSD: p.precioUSD,
                categoriaNombre: sub.categoria?.nombre || "S/C",
                subcategoriaNombre: sub.nombre
              });
            });
          }
        });
        
        setPruebasCatalogo(listaAplanada);
      } catch (e: any) {
        toast.error(e?.message ? `Error al cargar el catálogo de pruebas: ${e?.message}` : "Error al cargar el catálogo de pruebas");
      }
    };
    fetchCatalogo();
  }, []);

  // 1b. Cargar Catálogo de Servicios Extra
  useEffect(() => {
    const fetchServicios = async () => {
      try {
        const res = await fetch("/api/servicios-extra");
        if (res.ok) {
          const data = await res.json();
          setServiciosCatalogo(data);
        }
      } catch (e: any) {
        // Silencioso — los servicios son opcionales
      }
    };
    fetchServicios();
  }, []);

  // 2. Lógica de Edición
  useEffect(() => {
    if (editId) {
      const cargarOrdenParaEdicion = async () => {
        try {
          const res = await fetch(`/api/ordenes/${editId}`);
          const orden = await res.json();

          if (res.ok && orden) {
            setPacienteSeleccionado(orden.paciente);
            const pruebasReconstruidas: any[] = [];
            const paquetesMap = new Map<string, any>();

            orden.detalles.forEach((d: any) => {
              if (d.prueba?.subcategoria?.esPaquete) {
                const subcatId = d.prueba.subcategoria.id;
                if (!paquetesMap.has(subcatId)) {
                  paquetesMap.set(subcatId, {
                    tipo: "PAQUETE",
                    id: subcatId,
                    codigo: d.prueba.codigo.split('-')[0] || "PK",
                    nombre: d.prueba.subcategoria.nombre,
                    precioUSD: d.precioCongeladoUSD || 0,
                    descInd: d.descuento || 0,
                    tipoDescInd: d.tipoDescuento?.nombre || "PORCENTAJE",
                    cantidad: d.cantidad || 1,
                    pruebasHijas: [d.prueba],
                    categoriaNombre: d.prueba.subcategoria.categoria?.nombre || "S/C",
                    subcategoriaNombre: d.prueba.subcategoria.nombre
                  });
                } else {
                  const paq = paquetesMap.get(subcatId);
                  paq.pruebasHijas.push(d.prueba);
                  if (d.precioCongeladoUSD > 0) {
                    paq.precioUSD = d.precioCongeladoUSD;
                    paq.descInd = d.descuento || 0;
                    paq.tipoDescInd = d.tipoDescuento?.nombre || "PORCENTAJE";
                  }
                }
              } else {
                pruebasReconstruidas.push({
                  ...d.prueba,
                  idReal: d.prueba.id,
                  tipo: "INDIVIDUAL", 
                  cantidad: d.cantidad,
                  precioUSD: d.precioCongeladoUSD,
                  descInd: d.descuento,
                  tipoDescInd: d.tipoDescuento?.nombre || "PORCENTAJE",
                  categoriaNombre: d.prueba?.subcategoria?.categoria?.nombre || "Desconocida",
                  subcategoriaNombre: d.prueba?.subcategoria?.nombre || "Desconocida"
                });
              }
            });

            paquetesMap.forEach(paq => pruebasReconstruidas.push(paq));
            setPruebasSeleccionadas(pruebasReconstruidas);

            // Cargar servicios extra de la orden si los hay
            if (orden.serviciosExtra && orden.serviciosExtra.length > 0) {
              setServiciosSeleccionados(orden.serviciosExtra.map((se: any) => ({
                ...se.servicio,
                cantidad: se.cantidad || 1
              })));
            }

            toast.info(`Editando Orden #${editId}`, {
              toastId: `edit-toast-${editId}`
            });

          } else {
            toast.error(orden.error ? `Error al obtener la orden: ${orden.error}` : "Error al obtener la orden");
          }
        } catch (error: any) {
          toast.error(error?.message ? `No se pudo cargar la orden para editar: ${error?.message}` : "No se pudo cargar la orden para editar");
        }
      };
      cargarOrdenParaEdicion();
    }
  }, [editId]);

  // 3. Lógica de Presupuesto
  useEffect(() => {
    const tempStr = sessionStorage.getItem("leyma_presupuesto_temp");
    if (tempStr && !editId) {
      try {
        const temp = JSON.parse(tempStr);
        if (temp.pruebas && Array.isArray(temp.pruebas)) {
          setPruebasSeleccionadas(temp.pruebas);
        }
        if (temp.serviciosExtras && Array.isArray(temp.serviciosExtras)) {
          setServiciosSeleccionados(temp.serviciosExtras);
        }
        toast.info("Exámenes del presupuesto cargados. Seleccione un paciente para continuar.");
        sessionStorage.removeItem("leyma_presupuesto_temp");
      } catch (e) {
        console.error("Error parsing temp presupuesto", e);
      }
    }
  }, [editId]);

  const buscarPaciente = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cedulaBusqueda.trim()) return;
    setBuscando(true);
    setResultadosBusqueda([]);
    
    try {
      // Buscar paciente y verificar órdenes en paralelo
      const [resPaciente, resOrdenes] = await Promise.all([
        fetch(`/api/pacientes?q=${cedulaBusqueda}`),
        fetch(`/api/pacientes/verificar-ordenes?cedula=${cedulaBusqueda.trim()}`)
      ]);

      if (!resPaciente.ok) {
        const errorData = await resPaciente.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al buscar paciente");
      }

      const [dataPaciente, dataOrdenes] = await Promise.all([
        resPaciente.json(),
        resOrdenes.ok ? resOrdenes.json() : Promise.resolve(null)
      ]);
      
      if (Array.isArray(dataPaciente) && dataPaciente.length > 0) {
        if (dataPaciente.length === 1) {
          setPacienteSeleccionado(dataPaciente[0]);
          setIsCreandoNuevo(false);
          toast.success("Paciente encontrado");
          // Usar resultado de verificación ya obtenido en paralelo
          if (dataOrdenes?.tieneOrdenes) {
            setOrdenesConflictivas(dataOrdenes.ordenes);
            setModalOrdenesAbiertas(true);
          }
        } else {
          setResultadosBusqueda(dataPaciente);
          toast.info("Múltiples coincidencias. Seleccione un paciente de la lista.");
        }
      } else {
        toast.info("Paciente no registrado. Complete los datos.");
        const isNumeric = /^\d+$/.test(cedulaBusqueda.trim());
        setFormData({ 
          ...formData, 
          cedula: isNumeric ? cedulaBusqueda.trim() : "", 
          nombreCompleto: !isNumeric ? cedulaBusqueda.toUpperCase() : "",
          esBebe: false 
        });
        setIsCreandoNuevo(true);
      }
    } catch (error: any) {
      toast.error(error?.message ? `Error de conexión al buscar paciente: ${error?.message}` : "Error de conexión al buscar paciente");
    } finally {
      setBuscando(false);
    }
  };

  const seleccionarDeLista = (paciente: any) => {
    setPacienteSeleccionado(paciente);
    setResultadosBusqueda([]);
    setIsCreandoNuevo(false);
    toast.success("Paciente seleccionado");
    
    // Verificar si el paciente seleccionado de la lista tiene órdenes
    const verificarOrdenesLista = async (pacienteId: string) => {
      try {
        const res = await fetch(`/api/pacientes/verificar-ordenes?pacienteId=${pacienteId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.tieneOrdenes) {
            setOrdenesConflictivas(data.ordenes);
            setModalOrdenesAbiertas(true);
          }
        }
      } catch (error) {
        console.error("Error al verificar ordenes previas", error);
      }
    };
    verificarOrdenesLista(paciente.id);
  };

  const iniciarRegistroSinCedula = () => {
    setFormData({ ...formData, esBebe: true, cedula: "" });
    setIsCreandoNuevo(true);
  };

  const registrarNuevoPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(formData.fechaNacimiento)) {
      toast.error("Formato de fecha inválido. Use DD/MM/AAAA");
      return;
    }
    const [dia, mes, ano] = formData.fechaNacimiento.split('/');
    
    // Validación lógica de fecha (meses entre 1 y 12, días entre 1 y 31)
    const mesNum = parseInt(mes, 10);
    const diaNum = parseInt(dia, 10);
    if (mesNum < 1 || mesNum > 12 || diaNum < 1 || diaNum > 31) {
      toast.error("Fecha inválida: verifique que el mes o el día existan.");
      return;
    }

    const fechaISO = `${ano}-${mes}-${dia}T12:00:00Z`;
    const dateCheck = new Date(fechaISO);
    if (isNaN(dateCheck.getTime())) {
      toast.error("La fecha ingresada no existe en el calendario.");
      return;
    }

    setGuardandoPaciente(true);
    try {
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, fechaNacimiento: fechaISO }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Paciente registrado exitosamente");
      setPacienteSeleccionado(data);
      setIsCreandoNuevo(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setGuardandoPaciente(false);
    }
  };

  const limpiarSeleccion = () => {
    setPacienteSeleccionado(null);
    setCedulaBusqueda("");
    setResultadosBusqueda([]);
    setIsCreandoNuevo(false);
    setFormData({
      esBebe: false, cedula: "", nombreCompleto: "", fechaNacimiento: "",
      sexo: "M", telefono: "", correo: "", direccion: "", observaciones: ""
    });
    if (editId) router.push("/home/registro"); 
  };

  const finalizarOrden = async (resumenData: any) => {
    if (!pacienteSeleccionado) {
      toast.error("Debe seleccionar o registrar un paciente antes de procesar el pago.");
      return;
    }
    if (resumenData.estado === "CERRADA" && resumenData.restanteUSD > 0.005) {
      toast.error(`La orden no puede ser CERRADA con saldo pendiente.`);
      return;
    }
    
    if (guardandoOrden) return;

    setGuardandoOrden(true);
    toast.info(editId ? "Actualizando orden..." : "Guardando orden...");

    const pruebasParaEnviar: any[] = [];

    pruebasSeleccionadas.forEach(item => {
      if (item.tipo === "PAQUETE") {
        item.pruebasHijas.forEach((ph: any, index: number) => {
          pruebasParaEnviar.push({
            pruebaId: ph.id,
            cantidad: item.cantidad,
            precioCongelado: index === 0 ? item.precioUSD : 0, 
            descuentoInd: index === 0 ? (item.descInd || 0) : 0,
            tipoDescuentoInd: item.tipoDescInd || "PORCENTAJE"
          });
        });
      } else {
        pruebasParaEnviar.push({
          pruebaId: item.idReal || item.id,
          cantidad: item.cantidad,
          precioCongelado: item.precioUSD,
          descuentoInd: item.descInd || 0,
          tipoDescuentoInd: item.tipoDescInd || "PORCENTAJE"
        });
      }
    });

    const ordenParaGuardar = {
      pacienteId: pacienteSeleccionado.id,
      estado: resumenData.estado,
      tasaBCV: tasaBCV,
      subtotalUSD: resumenData.subtotalUSD,
      totalUSD: resumenData.totalFinalUSD,
      totalBS: resumenData.totalFinalBS,
      descuentoGeneral: resumenData.descuentoGeneral,
      tipoDescuentoGral: resumenData.tipoDescGral,
      pruebas: pruebasParaEnviar,
      serviciosExtra: serviciosSeleccionados.map((s: any) => ({
        servicioId: s.id,
        cantidad: s.cantidad || 1,
        precioCongelado: s.precioUSD,
      })),
      pagos: resumenData.pagos.filter((p: any) => p.metodoId && p.monto > 0).map((p: any) => ({
        metodoId: p.metodoId,
        monto: p.monto,
        moneda: p.moneda || "USD",
        referencia: p.referencia || ""
      }))
    };

    try {
      const url = editId ? `/api/ordenes/${editId}` : "/api/ordenes";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ordenParaGuardar)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(editId ? "Orden actualizada correctamente" : "Orden guardada correctamente");

      if (editId) {
        router.push("/home/diaria");
      } else {
        limpiarSeleccion();
      }
    } catch (error: any) {
      toast.error(error.message ? `Error al procesar la orden: ${error.message}` : "Error al procesar la orden");
    } finally {
      setGuardandoOrden(false);
    }
  };

  return (
    <div className="h-full flex flex-col pb-10 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="font-title text-4xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
            <FileSignature className="text-[#0071E3]" size={36} strokeWidth={2.5} />
            {editId ? `Editando Orden #${editId}` : "Nueva Orden de Laboratorio"}
          </h1>
          <p className="text-[#86868B] mt-2 font-medium text-[15px]">
            {editId ? "Modifique los exámenes o datos de la orden seleccionada." : "Gestión integral de pacientes, pruebas y facturación."}
          </p>
        </div>
        {editId && (
          <button
            onClick={() => router.push("/home/diaria")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
          >
            <ArrowLeft size={18} /> Volver a Lista Diaria
          </button>
        )}
      </div>

      <section className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] font-bold shrink-0">1</div>
          <h2 className="text-xl font-bold text-[#1D1D1F]">Datos del Paciente</h2>
        </div>
        {!pacienteSeleccionado && !isCreandoNuevo && (
          <BuscadorPaciente
            cedulaBusqueda={cedulaBusqueda} setCedulaBusqueda={setCedulaBusqueda}
            buscando={buscando} buscarPaciente={buscarPaciente}
            iniciarRegistroSinCedula={iniciarRegistroSinCedula}
            resultadosBusqueda={resultadosBusqueda}
            seleccionarDeLista={seleccionarDeLista}
          />
        )}
        {pacienteSeleccionado && (
          <TarjetaPaciente
            paciente={pacienteSeleccionado}
            limpiarSeleccion={limpiarSeleccion}
            onActualizarPaciente={setPacienteSeleccionado} 
          />
        )}
        {!pacienteSeleccionado && isCreandoNuevo && (
          <FormularioPaciente
            formData={formData} setFormData={setFormData}
            registrarNuevoPaciente={registrarNuevoPaciente}
            guardandoPaciente={guardandoPaciente} limpiarSeleccion={limpiarSeleccion}
          />
        )}
      </section>

      <ServiciosExtras
        catalogo={serviciosCatalogo}
        seleccionados={serviciosSeleccionados}
        onCambio={setServiciosSeleccionados}
        tasaBCV={tasaBCV}
      />

      <SeleccionPruebas
        pruebasCatalogo={pruebasCatalogo} pruebasSeleccionadas={pruebasSeleccionadas}
        setPruebasSeleccionadas={setPruebasSeleccionadas} tasaBCV={tasaBCV}
      />

      {pruebasSeleccionadas.length > 0 && (
        <ResumenPago
          pruebasSeleccionadas={pruebasSeleccionadas} setPruebasSeleccionadas={setPruebasSeleccionadas}
          serviciosSeleccionados={serviciosSeleccionados}
          tasaBCV={tasaBCV} onFinalizar={finalizarOrden} guardandoOrden={guardandoOrden}
        />
      )}

      {/* Modal de Órdenes Previas o de Hoy */}
      {modalOrdenesAbiertas && pacienteSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-amber-50 border-b border-amber-200 p-6 flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-amber-200">
                  <AlertTriangle className="text-amber-600 w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-900">
                    Órdenes Existentes Detectadas
                  </h3>
                  <p className="text-amber-700 mt-1">
                    El paciente <strong>{pacienteSeleccionado.nombreCompleto}</strong> (C.I: {pacienteSeleccionado.cedula}) 
                    ya tiene las siguientes órdenes el día de hoy o órdenes abiertas anteriores. Por favor rectificar.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalOrdenesAbiertas(false)}
                className="text-amber-500 hover:text-amber-800 transition-colors p-1"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50/50">
              <div className="space-y-4">
                {ordenesConflictivas.map((orden) => {
                  const isExpanded = ordenExpandidaId === orden.id;
                  
                  const itemsAgrupados: any[] = [];
                  orden.detalles?.forEach((det: any) => {
                    const isPaquete = det.prueba?.subcategoria?.esPaquete;
                    if (isPaquete) {
                      const subcatId = det.prueba.subcategoria.id;
                      const existingPaquete = itemsAgrupados.find(i => i.isPaquete && i.subcatId === subcatId);
                      if (existingPaquete) {
                        existingPaquete.pruebasHijas.push(det.prueba);
                        existingPaquete.precioCongeladoUSD += det.precioCongeladoUSD;
                        if (det.descuento > 0 && existingPaquete.descuento === 0) {
                          existingPaquete.descuento = det.descuento;
                          existingPaquete.tipoDesc = det.tipoDescuento?.nombre || "MONTO";
                        }
                      } else {
                        itemsAgrupados.push({
                          id: `pkg-${subcatId}`,
                          isPaquete: true,
                          subcatId: subcatId,
                          nombre: det.prueba.subcategoria.nombre,
                          categoriaNombre: det.prueba.subcategoria.categoria.nombre,
                          cantidad: det.cantidad,
                          precioCongeladoUSD: det.precioCongeladoUSD,
                          descuento: det.descuento || 0,
                          tipoDesc: det.tipoDescuento?.nombre || "MONTO",
                          pruebasHijas: [det.prueba]
                        });
                      }
                    } else {
                      itemsAgrupados.push({
                        id: det.id,
                        isPaquete: false,
                        nombre: det.prueba.nombre,
                        codigo: det.prueba.codigo,
                        categoriaNombre: det.prueba?.subcategoria?.categoria?.nombre || "N/A",
                        subcategoriaNombre: det.prueba?.subcategoria?.nombre || "N/A",
                        cantidad: det.cantidad,
                        precioCongeladoUSD: det.precioCongeladoUSD,
                        descuento: det.descuento || 0,
                        tipoDesc: det.tipoDescuento?.nombre || "MONTO"
                      });
                    }
                  });

                  return (
                    <div key={orden.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                      <div 
                        className="p-5 cursor-pointer flex flex-col gap-4"
                        onClick={() => setOrdenExpandidaId(isExpanded ? null : orden.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-slate-900 tracking-tight">Orden #{orden.id}</span>
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                              orden.estado?.nombre === 'ABIERTA' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {orden.estado?.nombre}
                            </span>
                            <span className="text-sm font-medium text-slate-500 ml-2">
                              Creada: {new Date(orden.fechaCreacion).toLocaleDateString('es-VE')} a las {new Date(orden.fechaCreacion).toLocaleTimeString('es-VE', {hour: '2-digit', minute: '2-digit'})}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/home/diaria?search=${orden.id}`);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors shrink-0"
                              title="Ir a la lista diaria"
                            >
                              Ir a Orden <ExternalLink size={16} />
                            </button>
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold rounded-xl transition-colors">
                              {isExpanded ? "Ocultar Detalles" : "Ver Detalles"} {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detalles Desplegados */}
                      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                          <div className="bg-slate-50 border-t border-slate-200 p-5 space-y-6">
                            
                            {/* Sección Económica */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                  <DollarSign className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total USD</p>
                                  <p className="text-lg font-black text-slate-800">${orden.totalUSD?.toFixed(2) || '0.00'}</p>
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                  <Wallet className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Bs</p>
                                  <p className="text-lg font-black text-slate-800">Bs {orden.totalBS?.toFixed(2) || '0.00'}</p>
                                </div>
                              </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                                <CreditCard className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pagos Reg.</p>
                                <p className="text-lg font-black text-slate-800">{orden.pagos?.length || 0}</p>
                              </div>
                            </div>
                          </div>

                          {/* Tabla de Pruebas Detallada */}
                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-100 p-3 border-b border-slate-200 flex items-center gap-2">
                              <Activity className="w-5 h-5 text-slate-600" />
                              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Exámenes y Servicios Solicitados</h4>
                            </div>
                            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col gap-4">
                              {itemsAgrupados.map((item: any) => {
                                const valorDesc = item.descuento || 0;
                                const subtotalBaseUSD = item.precioCongeladoUSD * item.cantidad;
                                const montoDescuentoUSD = item.tipoDesc === "PORCENTAJE" 
                                  ? (subtotalBaseUSD * (valorDesc / 100)) 
                                  : valorDesc;
                                const subtotalItemUSD = subtotalBaseUSD - montoDescuentoUSD;
                                const precioBS = item.precioCongeladoUSD * (orden.tasaBCV || 0);
                                const subtotalItemBS = subtotalItemUSD * (orden.tasaBCV || 0);

                                return (
                                  <div key={item.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col shadow-sm gap-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
                                      <div className="flex items-start gap-4 flex-1 w-full">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border mt-1 ${item.isPaquete ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-[#0071E3] border-blue-100"}`}>
                                          {item.isPaquete ? <Package size={24} strokeWidth={2.5} /> : <FlaskConical size={24} strokeWidth={2.5} />}
                                        </div>
                                        <div className="flex flex-col w-full">
                                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.categoriaNombre}</span>
                                            {!item.isPaquete && (
                                              <>
                                                <span className="text-[10px] text-slate-300">&gt;</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.subcategoriaNombre}</span>
                                              </>
                                            )}
                                          </div>
                                          <h4 className="font-bold text-[#1D1D1F] text-base leading-tight flex items-center gap-2 flex-wrap">
                                            {item.nombre}
                                            {item.isPaquete && (
                                              <span className="text-[9px] font-black bg-purple-100 text-purple-600 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">Perfil</span>
                                            )}
                                          </h4>
                                          {!item.isPaquete && (
                                            <span className="text-[#0071E3] text-[10px] font-black uppercase tracking-widest mt-1.5">
                                              {item.codigo}
                                            </span>
                                          )}
                                          {valorDesc > 0 && (
                                            <div className="mt-2">
                                              <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100 uppercase tracking-widest">
                                                Descuento: {item.tipoDesc === "PORCENTAJE" ? `-${valorDesc}%` : `-$${valorDesc.toFixed(2)}`}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-6 justify-end w-full md:w-auto border-t md:border-0 border-slate-50 pt-4 md:pt-0 shrink-0">
                                        <div className="text-center">
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cant.</p>
                                          <p className="font-bold text-[#1D1D1F] text-base mt-1">{item.cantidad}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Precio</p>
                                          <p className="font-bold text-[#1D1D1F] text-base leading-none mt-1">${item.precioCongeladoUSD.toFixed(2)}</p>
                                          <p className="text-[10px] font-medium text-slate-500 mt-1">Bs {precioBS.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
                                        </div>
                                        <div className="text-right min-w-[80px]">
                                          <p className="text-[10px] font-bold text-[#0071E3] uppercase tracking-widest">Subtotal</p>
                                          <p className="font-black text-[#0071E3] text-xl leading-none mt-1">${subtotalItemUSD.toFixed(2)}</p>
                                          <p className="text-[11px] font-bold text-slate-500 mt-1">Bs {subtotalItemBS.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
                                        </div>
                                      </div>
                                    </div>
                                    {item.isPaquete && (
                                      <details className="bg-[#F5F5F7]/80 rounded-xl w-full group border border-slate-200/60 mt-2">
                                        <summary className="p-3 cursor-pointer text-xs font-bold text-slate-700 list-none flex items-center gap-2 select-none hover:text-[#0071E3] transition-colors">
                                          <span className="flex-1">Incluye {item.pruebasHijas?.length || 0} pruebas</span>
                                          <div className="w-5 h-5 rounded-full bg-slate-200/50 flex items-center justify-center group-open:rotate-180 transition-transform">
                                            <ChevronDown size={14} strokeWidth={3} />
                                          </div>
                                        </summary>
                                        <div className="px-4 pb-4 pt-1 border-t border-slate-200/50 mt-1">
                                          <ul className="list-disc list-inside text-xs text-slate-500 leading-snug font-medium grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                            {item.pruebasHijas?.map((ph: any, idx: number) => (
                                              <li key={idx} className="truncate" title={ph.nombre}>{ph.nombre}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                );
                              })}
                              
                              {orden.serviciosExtra?.map((se: any) => {
                                const subtotalItemUSD = se.precioCongeladoUSD * se.cantidad;
                                const precioBS = se.precioCongeladoUSD * (orden.tasaBCV || 0);
                                const subtotalItemBS = subtotalItemUSD * (orden.tasaBCV || 0);

                                return (
                                  <div key={se.id} className="bg-amber-50/50 border border-amber-200/60 p-5 rounded-2xl flex flex-col shadow-sm gap-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
                                      <div className="flex items-start gap-4 flex-1 w-full">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border mt-1 bg-amber-100 text-amber-600 border-amber-200">
                                          <Syringe size={24} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex flex-col w-full">
                                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Servicio de Extracción</span>
                                          </div>
                                          <h4 className="font-bold text-[#1D1D1F] text-base leading-tight flex items-center gap-2 flex-wrap">
                                            {se.servicio?.nombre}
                                          </h4>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-6 justify-end w-full md:w-auto border-t md:border-0 border-amber-100 pt-4 md:pt-0 shrink-0">
                                        <div className="text-center">
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cant.</p>
                                          <p className="font-bold text-[#1D1D1F] text-base mt-1">{se.cantidad}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Precio</p>
                                          <p className="font-bold text-[#1D1D1F] text-base leading-none mt-1">${se.precioCongeladoUSD.toFixed(2)}</p>
                                          <p className="text-[10px] font-medium text-slate-500 mt-1">Bs {precioBS.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
                                        </div>
                                        <div className="text-right min-w-[80px]">
                                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Subtotal</p>
                                          <p className="font-black text-amber-600 text-xl leading-none mt-1">${subtotalItemUSD.toFixed(2)}</p>
                                          <p className="text-[11px] font-bold text-slate-500 mt-1">Bs {subtotalItemBS.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Sección de Pagos si existen */}
                          {orden.pagos && orden.pagos.length > 0 && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                              <h4 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-wide">Historial de Pagos Registrados</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {orden.pagos.map((pago: any, i: number) => (
                                  <div key={pago.id || i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-700">{pago.metodo?.nombre || 'Pago'}</span>
                                      {pago.referencia && <span className="text-xs text-slate-500 font-medium">Ref: {pago.referencia}</span>}
                                    </div>
                                    <div className="text-right flex flex-col">
                                      <span className="font-black text-emerald-600">${pago.montoUSD?.toFixed(2)}</span>
                                      <span className="text-[10px] font-bold text-slate-500">Bs {pago.montoBS?.toLocaleString('es-VE', {minimumFractionDigits: 2})}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center pt-2 text-xs text-slate-400">
                            <span>Registrado por: <strong>{orden.creadoPor?.nombre || 'Desconocido'}</strong></span>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3">
              <button
                onClick={() => {
                  router.push(`/home/diaria`);
                }}
                className="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all shadow-sm"
              >
                Ir a Lista Diaria
              </button>
              <button
                onClick={() => setModalOrdenesAbiertas(false)}
                className="px-6 py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                Continuar con Nueva Orden
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Cargando módulo de registro...</div>}>
      <RegistroContent />
    </Suspense>
  );
}