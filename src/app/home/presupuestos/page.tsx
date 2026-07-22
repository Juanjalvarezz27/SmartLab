"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ClipboardList, Calculator, User, Percent, ClipboardCheck } from "lucide-react";
import { toast } from "react-toastify";

import useTasaBCV from "../../hooks/useTasaBcv";
import SeleccionPruebas from "../../components/registro/SeleccionPruebas";
import ServiciosExtras from "../../components/registro/ServiciosExtras";
const ModalPreviewPresupuesto = dynamic(() => import("../../components/presupuestos/ModalPreviewPresupuesto"), { ssr: false });
import { useRouter } from "next/navigation";

export default function PresupuestosPage() {
  const router = useRouter();
  const { tasa } = useTasaBCV();
  const tasaBCV = tasa ?? 36.5;

  const [pruebasCatalogo, setPruebasCatalogo] = useState<any[]>([]);
  const [pruebasSeleccionadas, setPruebasSeleccionadas] = useState<any[]>([]);
  
  // Servicios Extra
  const [serviciosExtrasCatalogo, setServiciosExtrasCatalogo] = useState<any[]>([]);
  const [serviciosExtrasSeleccionados, setServiciosExtrasSeleccionados] = useState<any[]>([]);
  
  // Datos del Paciente (Opcional)
  const [paciente, setPaciente] = useState({ nombre: "", cedula: "", telefono: "" });
  
  // Descuentos
  const [porcentajeDescuento, setPorcentajeDescuento] = useState<number>(0);
  
  // Modal PDF
  const [showPdf, setShowPdf] = useState(false);

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

        const resServicios = await fetch("/api/servicios-extra");
        if (resServicios.ok) {
          const dataServicios = await resServicios.json();
          setServiciosExtrasCatalogo(dataServicios);
        }
      } catch (e: any) {
        toast.error(e?.message ? `Error al cargar el catálogo de pruebas: ${e?.message}` : "Error al cargar el catálogo de pruebas");
      }
    };
    fetchCatalogo();
  }, []);

  const subtotalPruebasUSD = pruebasSeleccionadas.reduce((acc, p) => acc + (p.precioUSD * p.cantidad), 0);
  const subtotalServiciosUSD = serviciosExtrasSeleccionados.reduce((acc, s) => acc + (s.precioUSD * (s.cantidad || 1)), 0);
  const subtotalUSD = subtotalPruebasUSD + subtotalServiciosUSD;

  const descuentoUSD = subtotalUSD * (porcentajeDescuento / 100);
  const totalUSD = subtotalUSD - descuentoUSD;
  const totalBS = totalUSD * tasaBCV;

  const generarPresupuesto = () => {
    if (pruebasSeleccionadas.length === 0) {
      toast.warning("Debe seleccionar al menos un examen para generar el presupuesto.");
      return;
    }
    setShowPdf(true);
  };

  const pasarARegistro = () => {
    if (pruebasSeleccionadas.length === 0) {
      toast.warning("Debe seleccionar al menos un examen.");
      return;
    }
    const data = {
      pruebas: pruebasSeleccionadas,
      serviciosExtras: serviciosExtrasSeleccionados
    };
    sessionStorage.setItem("leyma_presupuesto_temp", JSON.stringify(data));
    router.push("/home/registro");
  };

  const limpiar = () => {
    setPruebasSeleccionadas([]);
    setServiciosExtrasSeleccionados([]);
    setPaciente({ nombre: "", cedula: "", telefono: "" });
    setPorcentajeDescuento(0);
  };

  return (
    <div className="h-full flex flex-col pb-10 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
      <div className="mb-8">
        <h1 className="font-title text-4xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
          <ClipboardList className="text-[#0071E3]" size={36} strokeWidth={2.5} />
          Calculadora de Presupuestos
        </h1>
        <p className="text-[#86868B] mt-2 font-medium text-[15px]">
          Genere cotizaciones rápidas para pacientes. Seleccione exámenes, aplique descuentos y genere un PDF oficial.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Paciente y Pruebas */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Datos Opcionales */}
          <section className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 lg:p-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] font-bold shrink-0">1</div>
              <h2 className="text-xl font-bold text-[#1D1D1F]">Datos del Paciente (Opcional)</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={paciente.nombre}
                    onChange={(e) => setPaciente({ ...paciente, nombre: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cédula</label>
                <input
                  type="text"
                  value={paciente.cedula}
                  onChange={(e) => setPaciente({ ...paciente, cedula: e.target.value })}
                  className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]"
                  placeholder="V-12345678"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono</label>
                <input
                  type="text"
                  value={paciente.telefono}
                  onChange={(e) => setPaciente({ ...paciente, telefono: e.target.value })}
                  className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]"
                  placeholder="04121234567"
                />
              </div>
            </div>
          </section>

          {/* Servicios Extra */}
          <ServiciosExtras
            catalogo={serviciosExtrasCatalogo}
            seleccionados={serviciosExtrasSeleccionados}
            onCambio={setServiciosExtrasSeleccionados}
            tasaBCV={tasaBCV}
          />

          {/* Selección de Pruebas */}
          <SeleccionPruebas
            pruebasCatalogo={pruebasCatalogo} 
            pruebasSeleccionadas={pruebasSeleccionadas}
            setPruebasSeleccionadas={setPruebasSeleccionadas} 
            tasaBCV={tasaBCV}
          />
        </div>

        {/* Columna Derecha: Totales y Acciones */}
        <div className="xl:col-span-1">
          <section className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sticky top-6">
            <h2 className="text-xl font-bold text-[#1D1D1F] mb-6 flex items-center gap-2">
              <Calculator size={20} className="text-[#0071E3]" /> Resumen
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Subtotal</span>
                <span className="text-lg font-black text-[#1D1D1F]">${subtotalUSD.toFixed(2)}</span>
              </div>

              <div className="pb-4 border-b border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider">
                    <Percent size={14} /> Descuento (%)
                  </label>
                  <span className="text-sm font-bold text-red-500">-${descuentoUSD.toFixed(2)}</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={porcentajeDescuento === 0 ? "" : porcentajeDescuento}
                    onChange={(e) => {
                      const val = e.target.value === "" ? 0 : Number(e.target.value);
                      if (val >= 0 && val <= 100) setPorcentajeDescuento(val);
                    }}
                    className="w-full pl-4 pr-10 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TOTAL A PAGAR</span>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-[#0071E3] leading-none">${totalUSD.toFixed(2)}</span>
                  <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    Bs {totalBS.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={generarPresupuesto}
              disabled={pruebasSeleccionadas.length === 0}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#1D1D1F] text-white font-bold rounded-xl hover:bg-black transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
            >
              <ClipboardList size={18} /> Generar Presupuesto
            </button>
            
            <button
              onClick={pasarARegistro}
              disabled={pruebasSeleccionadas.length === 0}
              className="w-full mt-3 flex items-center justify-center gap-2 py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
            >
              <ClipboardCheck size={18} /> Facturar Directamente
            </button>
            
            <button
              onClick={limpiar}
              className="w-full mt-3 py-3 text-sm font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              Limpiar Todo
            </button>
          </section>
        </div>
      </div>

      {showPdf && (
        <ModalPreviewPresupuesto
          paciente={paciente}
          pruebas={pruebasSeleccionadas}
          serviciosExtras={serviciosExtrasSeleccionados}
          tasaBCV={tasaBCV}
          descuento={descuentoUSD}
          subtotal={subtotalUSD}
          total={totalUSD}
          onClose={() => setShowPdf(false)}
        />
      )}
    </div>
  );
}
