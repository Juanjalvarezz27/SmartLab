import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import DescargarPDFButton from "./DescargarPDFButton";

export default async function ValidarPage({ params }: { params: any }) {
  const resolvedParams = await params;
  const ordenId = parseInt(resolvedParams.id, 10);

  if (isNaN(ordenId)) return notFound();

  const orden = await prisma.orden.findUnique({
    where: { id: ordenId },
    include: {
      paciente: true,
      creadoPor: true,
      detalles: {
        include: {
          resultado: {
            include: {
              procesadoPor: {
                select: { id: true, nombre: true }
              }
            }
          }
        }
      }
    },
  });

  if (!orden) return notFound();

  const formatFecha = (date: Date) => {
    return date.toLocaleDateString("es-VE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const esVerificado = orden.resultadosCompletados;

  const allSigners = new Map();
  if (orden.detalles) {
    orden.detalles.forEach((det: any) => {
      if (det.resultado?.firmado && det.resultado?.procesadoPor) {
        allSigners.set(det.resultado.procesadoPor.id, det.resultado.procesadoPor.nombre);
      }
    });
  }
  const signersArray = Array.from(allSigners.values());
  const displaySigners = signersArray.length > 0 ? signersArray.join(" / ") : (orden.creadoPor?.nombre || "Bioanalista Titular");
  const labelBioanalista = signersArray.length > 1 ? "Bioanalistas Responsables" : "Bioanalista Responsable";

  return (
    <div className="min-h-screen bg-fondo flex flex-col items-center justify-center px-4 py-8 sm:py-12 font-sans text-texto-principal">

      {/* CONTENEDOR PRINCIPAL — CARD PREMIUM */}
      <div className="w-full max-w-xl">

        {/* HEADER BRAND */}
        <div className="flex flex-col items-center mb-8 sm:mb-10">
          <div className="relative w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] mb-4">
            <div className="absolute inset-0 bg-primario/10 rounded-2xl sm:rounded-3xl" />
            <div className="relative w-full h-full flex items-center justify-center">
              <Image 
                src="/Logo2.png" 
                alt="Logo LEYMA" 
                width={60} 
                height={60} 
                className="object-contain drop-shadow-sm"
                priority
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-title tracking-tight leading-none">
            LEYMA C.A.
          </h1>
          <p className="text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase text-texto-secundario mt-1.5">
            Laboratorio Clínico Bacteriológico
          </p>
        </div>

        {/* CARD PRINCIPAL */}
        <div className="bg-superficie rounded-3xl shadow-apple border border-borde overflow-hidden">
          
          {/* BADGE DE ESTADO — BANNER SUPERIOR */}
          {esVerificado ? (
            <div className="bg-primario px-6 py-4 sm:py-5 flex items-center justify-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <p className="text-white font-black text-sm sm:text-[15px] uppercase tracking-wider">
                  Documento Auténtico
                </p>
                <p className="text-primario-light text-[11px] sm:text-xs font-medium mt-0.5 opacity-90">
                  Resultados emitidos y verificados por LEYMA C.A.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-acento px-6 py-4 sm:py-5 flex items-center justify-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <p className="text-white font-black text-sm sm:text-[15px] uppercase tracking-wider">
                  En Proceso
                </p>
                <p className="text-orange-100 text-[11px] sm:text-xs font-medium mt-0.5">
                  Resultados aún no validados
                </p>
              </div>
            </div>
          )}

          {/* CUERPO DE LA CARD */}
          <div className="p-6 sm:p-8">

            {/* NÚMERO DE ORDEN */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="bg-fondo border border-borde rounded-2xl px-6 py-3 sm:px-8 sm:py-4 text-center">
                <p className="text-[10px] sm:text-[11px] font-bold text-texto-secundario uppercase tracking-widest mb-1">
                  Orden N°
                </p>
                <p className="text-xl sm:text-2xl font-black tracking-tight text-primario font-title">
                  #{orden.id.toString().padStart(6, "0")}
                </p>
              </div>
            </div>

            {!esVerificado ? (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 sm:p-6 text-center">
                <p className="text-sm sm:text-[15px] font-medium text-orange-800 leading-relaxed">
                  La orden existe en nuestra base de datos, pero los resultados técnicos aún no han sido procesados y certificados por el bioanalista.
                </p>
                <p className="text-xs text-acento font-bold mt-3">
                  Por favor, intente más tarde.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-8">
                  <div className="bg-fondo rounded-2xl p-4 sm:col-span-2 border border-borde/50">
                    <p className="text-[10px] font-bold text-texto-secundario uppercase tracking-widest mb-1.5">
                      Paciente
                    </p>
                    <p className="text-base sm:text-lg font-black uppercase text-texto-principal leading-tight">
                      {orden.paciente.nombreCompleto}
                    </p>
                  </div>
                  <div className="bg-fondo rounded-2xl p-4 border border-borde/50">
                    <p className="text-[10px] font-bold text-texto-secundario uppercase tracking-widest mb-1.5">
                      Cédula de Identidad
                    </p>
                    <p className="text-[15px] font-bold text-texto-principal">
                      {orden.paciente.cedula || "S/N"}
                    </p>
                  </div>
                  <div className="bg-fondo rounded-2xl p-4 border border-borde/50">
                    <p className="text-[10px] font-bold text-texto-secundario uppercase tracking-widest mb-1.5">
                      Fecha de Emisión
                    </p>
                    <p className="text-[15px] font-bold text-texto-principal">
                      {formatFecha(orden.fechaCreacion)}
                    </p>
                  </div>
                  <div className="bg-fondo rounded-2xl p-4 sm:col-span-2 border border-borde/50">
                    <p className="text-[10px] font-bold text-texto-secundario uppercase tracking-widest mb-1.5">
                      {labelBioanalista}
                    </p>
                    <p className="text-[15px] font-black uppercase text-texto-principal">
                      {displaySigners}
                    </p>
                  </div>
                </div>

                <div className="border-t border-borde pt-6 sm:pt-8">
                  <div className="flex flex-col items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primario-light rounded-2xl flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primario">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-texto-secundario uppercase tracking-widest text-center">
                      Descarga tus resultados
                    </p>
                  </div>
                  <DescargarPDFButton ordenId={orden.id} nombrePaciente={orden.paciente.nombreCompleto} />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 sm:mt-8 text-center px-4">
          <p className="text-[10px] sm:text-[11px] font-semibold text-texto-secundario leading-relaxed">
            Este reporte es un documento electrónico oficial generado por el Sistema LEYMA C.A.
          </p>
          <p className="text-[9px] sm:text-[10px] text-texto-secundario/80 font-medium mt-1">
            Válido únicamente con sello húmedo original.
          </p>
        </div>

      </div>
    </div>
  );
}