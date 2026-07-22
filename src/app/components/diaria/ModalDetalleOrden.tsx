"use client";

import { X, FileText, User, Activity, Wallet, Calendar, MapPin, Mail, Stethoscope, Hash, FlaskConical, Package, Syringe, ChevronDown } from "lucide-react";

interface ModalDetalleOrdenProps {
  orden: any;
  onClose: () => void;
}

const calcularEdad = (fechaString: string) => {
  if (!fechaString) return "N/A";
  const hoy = new Date();
  const fechaNac = new Date(fechaString);
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const m = hoy.getMonth() - fechaNac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }
  return edad;
};

export default function ModalDetalleOrden({ orden, onClose }: ModalDetalleOrdenProps) {
  if (!orden) return null;

  const fechaOrden = new Date(orden.fechaCreacion).toLocaleString('es-VE', { 
    timeZone: 'America/Caracas',
    dateStyle: 'long', 
    timeStyle: 'short' 
  });

  const paciente = orden.paciente;

  // Lógica para el Descuento General
  const tipoDescGral = orden.tipoDescuento?.nombre || "MONTO";
  const valorDescGral = orden.descuentoGeneral || 0;
  const montoDescGralUSD = tipoDescGral === "PORCENTAJE" 
    ? (orden.subtotalUSD * (valorDescGral / 100)) 
    : valorDescGral;

  // --- LÓGICA DE AGRUPACIÓN PARA PAQUETES ---
  // Unimos las pruebas que pertenecen a un mismo paquete para no mostrar $0.00
  const itemsAgrupados: any[] = [];

  orden.detalles.forEach((det: any) => {
    const isPaquete = det.prueba?.subcategoria?.esPaquete;

    if (isPaquete) {
      const subcatId = det.prueba.subcategoria.id;
      const existingPaquete = itemsAgrupados.find(i => i.isPaquete && i.subcatId === subcatId);

      if (existingPaquete) {
        existingPaquete.pruebasHijas.push(det.prueba);
        existingPaquete.precioCongeladoUSD += det.precioCongeladoUSD;
        // Solo el primer ítem del paquete suele tener el descuento, lo asignamos si existe
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      
      {/* Fondo borroso oscuro */}
      <div 
        className="absolute inset-0 bg-[#1D1D1F]/60 transition-all"
        onClick={onClose}
      ></div>

      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* HEADER PRINCIPAL */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-[#0071E3] rounded-2xl flex items-center justify-center border border-blue-100">
              <FileText size={24} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">
                  Orden #{orden.id.toString().padStart(6, '0')}
                </h2>
                {orden.estado.nombre === "CERRADA" && <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black tracking-widest rounded-md border border-green-200 uppercase">Procesada</span>}
                {orden.estado.nombre === "BORRADOR" && <span className="px-3 py-1 bg-orange-100 text-orange-700 text-[10px] font-black tracking-widest rounded-md border border-orange-200 uppercase">Pendiente</span>}
                {orden.estado.nombre === "ANULADA" && <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black tracking-widest rounded-md border border-red-200 uppercase">Anulada</span>}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mt-1">
                <Calendar size={14} /> {fechaOrden} <span className="text-slate-300">|</span> Bioanalista: <span className="text-[#1D1D1F] font-semibold">{orden.creadoPor?.nombre || 'N/A'}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-full transition-all shadow-sm"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* BODY SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          
          {/* 1. FICHA DEL PACIENTE */}
          <section>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <User size={16} className="text-[#0071E3]" /> Datos del Paciente
            </h3>
            
            <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 p-6 bg-slate-50/50 border-b border-slate-100">
                <div className="col-span-2 md:col-span-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Completo</p>
                  <p className="font-bold text-[#1D1D1F] text-[15px]">{paciente.nombreCompleto}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cédula</p>
                  <p className="font-semibold text-[#1D1D1F] text-sm">{paciente.esBebe ? 'Bebé (S/N)' : paciente.cedula}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Edad</p>
                  <p className="font-semibold text-[#1D1D1F] text-sm">{calcularEdad(paciente.fechaNacimiento)} años</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sexo</p>
                  <p className="font-semibold text-[#1D1D1F] text-sm">{paciente.sexo === "M" ? "Masculino" : "Femenino"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teléfono</p>
                  <p className="font-semibold text-[#1D1D1F] text-sm">{paciente.telefono || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Mail size={12}/> Correo</p>
                  <p className="font-medium text-[#1D1D1F] text-sm">{paciente.correo || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><MapPin size={12}/> Dirección</p>
                  <p className="font-medium text-[#1D1D1F] text-sm">{paciente.direccion || 'N/A'}</p>
                </div>
              </div>

              {paciente.observaciones && (
                <div className="p-6 pt-0">
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-3">
                    <Stethoscope className="text-orange-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">Observaciones Médicas</p>
                      <p className="text-sm text-orange-900 font-medium">{paciente.observaciones}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <hr className="my-8 border-t-2 border-dashed border-slate-100" />

          {/* 2. EXÁMENES Y SERVICIOS SOLICITADOS (Diseño Ancho) */}
          <section>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Activity size={16} className="text-[#0071E3]" /> Exámenes y Servicios Solicitados
            </h3>
            
            {/* Flex-col para que ocupen todo el ancho y no se vean apretados */}
            <div className="flex flex-col gap-4">
              {itemsAgrupados.map((item: any) => {
                const valorDesc = item.descuento || 0;
                const subtotalBaseUSD = item.precioCongeladoUSD * item.cantidad;
                
                const montoDescuentoUSD = item.tipoDesc === "PORCENTAJE" 
                  ? (subtotalBaseUSD * (valorDesc / 100)) 
                  : valorDesc;
                
                const subtotalItemUSD = subtotalBaseUSD - montoDescuentoUSD;

                const precioBS = item.precioCongeladoUSD * orden.tasaBCV;
                const subtotalItemBS = subtotalItemUSD * orden.tasaBCV;

                return (
                  <div key={item.id} className="bg-white border border-slate-200 p-5 lg:p-6 rounded-[24px] flex flex-col shadow-sm hover:shadow-md transition-shadow gap-4">
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
                      <div className="flex items-start gap-4 flex-1 w-full">
                        <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center shrink-0 border mt-1 ${item.isPaquete ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-[#0071E3] border-blue-100"}`}>
                          {item.isPaquete ? <Package size={24} strokeWidth={2.5} /> : <FlaskConical size={24} strokeWidth={2.5} />}
                        </div>
                        
                        <div className="flex flex-col w-full">
                          {/* ETIQUETAS DE JERARQUÍA */}
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.categoriaNombre}</span>
                            {!item.isPaquete && (
                              <>
                                <span className="text-[10px] text-slate-300">&gt;</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.subcategoriaNombre}</span>
                              </>
                            )}
                          </div>

                          <h4 className="font-bold text-[#1D1D1F] text-base lg:text-lg leading-tight flex items-center gap-2 flex-wrap">
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

                          {/* Etiqueta de Descuento (Visible en Paquetes e Individuales) */}
                          {valorDesc > 0 && (
                            <div className="mt-2">
                              <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100 uppercase tracking-widest">
                                Descuento: {item.tipoDesc === "PORCENTAJE" ? `-${valorDesc}%` : `-$${valorDesc.toFixed(2)}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 lg:gap-10 justify-end w-full md:w-auto border-t md:border-0 border-slate-50 pt-4 md:pt-0 shrink-0">
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
                    {/* DROP DOWN AL FONDO */}
                    {item.isPaquete && (
                      <details className="bg-[#F5F5F7]/80 rounded-xl w-full group border border-slate-200/60">
                        <summary className="p-3 cursor-pointer text-xs font-bold text-slate-700 list-none flex items-center gap-2 select-none hover:text-[#0071E3] transition-colors">
                          <span className="flex-1">Incluye {item.pruebasHijas.length} pruebas</span>
                          <div className="w-5 h-5 rounded-full bg-slate-200/50 flex items-center justify-center group-open:rotate-180 transition-transform">
                            <ChevronDown size={14} strokeWidth={3} />
                          </div>
                        </summary>
                        <div className="px-4 pb-4 pt-1 border-t border-slate-200/50 mt-1">
                           <ul className="list-disc list-inside text-xs text-slate-500 leading-snug font-medium grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                             {item.pruebasHijas.map((ph: any, idx: number) => (
                               <li key={idx} className="truncate" title={ph.nombre}>{ph.nombre}</li>
                             ))}
                           </ul>
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}

              {/* SERVICIOS EXTRA */}
              {orden.serviciosExtra?.map((se: any) => {
                const subtotalItemUSD = se.precioCongeladoUSD * se.cantidad;
                const precioBS = se.precioCongeladoUSD * orden.tasaBCV;
                const subtotalItemBS = subtotalItemUSD * orden.tasaBCV;

                return (
                  <div key={`srv-${se.id}`} className="bg-amber-50/40 border border-amber-200/60 p-5 lg:p-6 rounded-[24px] flex flex-col shadow-sm hover:shadow-md transition-shadow gap-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
                      <div className="flex items-start gap-4 flex-1 w-full">
                        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center shrink-0 border mt-1 bg-amber-100 text-amber-600 border-amber-200">
                          <Syringe size={24} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col w-full justify-center min-h-[48px] lg:min-h-[56px]">
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Servicio de Extracción</span>
                          </div>
                          <h4 className="font-bold text-[#1D1D1F] text-base lg:text-lg leading-tight flex items-center gap-2 flex-wrap">
                            {se.servicio.nombre}
                          </h4>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 lg:gap-10 justify-end w-full md:w-auto border-t md:border-0 border-amber-100 pt-4 md:pt-0 shrink-0">
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
          </section>

          <hr className="my-8 border-t-2 border-dashed border-slate-100" />

          {/* 3. FINANZAS (Resumen y Pagos) */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* IZQUIERDA: Resumen de Cobro */}
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Hash size={16} className="text-[#0071E3]" /> Resumen de Cobro
              </h3>
              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#0071E3]"></div>

                <div className="space-y-3 mb-5 border-b border-dashed border-slate-200 pb-5 mt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-500 uppercase tracking-widest text-[11px]">Subtotal de Exámenes</span>
                    <span className="font-bold text-slate-700">${orden.subtotalUSD.toFixed(2)}</span>
                  </div>
                  {valorDescGral > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-red-500 uppercase tracking-widest text-[11px]">
                        Desc. General {tipoDescGral === "PORCENTAJE" && `(${valorDescGral}%)`}
                      </span>
                      <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">-${montoDescGralUSD.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Pagado</p>
                    <p className="font-bold text-slate-500 text-sm">Bs {orden.totalBS.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                     <span className="text-[10px] font-black text-[#0071E3] uppercase tracking-[0.3em] mb-1">Total USD</span>
                     <div className="text-4xl font-black text-[#1D1D1F] tracking-tighter leading-none">${orden.totalUSD.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* DERECHA: Registro de Pagos */}
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Wallet size={16} className="text-green-600" /> Registro de Pagos
              </h3>
              <div className="bg-[#F5F5F7] border border-slate-200/80 rounded-[24px] p-6 h-[185px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full shadow-inner">
                {orden.pagos && orden.pagos.length > 0 ? (
                  <div className="space-y-3">
                    {orden.pagos.map((pago: any) => (
                      <div key={pago.id} className="bg-white border border-slate-200/80 p-3.5 rounded-2xl flex justify-between items-center shadow-sm hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 text-green-600 flex items-center justify-center shrink-0">
                            <Wallet size={18} strokeWidth={2.5} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-[#1D1D1F] uppercase tracking-wide leading-none">{pago.metodo.nombre.replace('_', ' ')}</span>
                            {pago.referencia && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Ref: {pago.referencia}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-[#1D1D1F] text-[15px]">${pago.montoUSD.toFixed(2)}</p>
                          <p className="text-[10px] font-bold text-slate-500 mt-0.5">Bs {pago.montoBS.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                    <Wallet size={32} className="text-slate-400 mb-3" strokeWidth={1.5} />
                    <p className="text-[15px] font-bold text-slate-500">Orden pendiente de cobro</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">Aún no se han registrado pagos.</p>
                  </div>
                )}
              </div>
            </div>

          </section>

        </div>
      </div>
    </div>
  );
}