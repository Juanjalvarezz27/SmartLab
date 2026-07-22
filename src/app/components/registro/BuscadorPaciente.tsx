"use client";

import { Search, Info, Baby } from "lucide-react";

interface BuscadorPacienteProps {
  cedulaBusqueda: string;
  setCedulaBusqueda: (val: string) => void;
  buscando: boolean;
  buscarPaciente: (e?: React.FormEvent) => void;
  iniciarRegistroSinCedula: () => void;
  resultadosBusqueda?: any[];
  seleccionarDeLista?: (paciente: any) => void;
}

export default function BuscadorPaciente({
  cedulaBusqueda,
  setCedulaBusqueda,
  buscando,
  buscarPaciente,
  iniciarRegistroSinCedula,
  resultadosBusqueda,
  seleccionarDeLista
}: BuscadorPacienteProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* Columna Izquierda: Buscador Principal */}
      <div className="flex flex-col justify-center">
        <form onSubmit={buscarPaciente} className="flex flex-col justify-center">
          <label className="text-[11px] font-bold text-[#1D1D1F]/50 uppercase tracking-[0.15em] ml-2 mb-3 block">
            Búsqueda por Cédula o Nombre
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                autoFocus
                value={cedulaBusqueda}
                onChange={(e) => setCedulaBusqueda(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#F5F5F7] border border-slate-200/60 rounded-2xl text-[#1D1D1F] font-semibold focus:outline-none focus:ring-4 focus:ring-[#0071E3]/15 focus:border-[#0071E3]/50 transition-all placeholder:text-slate-400 placeholder:font-medium"
                placeholder="Ej. 24123456 o Maria Perez"
                disabled={buscando}
              />
            </div>
            <button 
              type="submit" 
              disabled={buscando || !cedulaBusqueda}
              className="bg-[#0071E3] text-white px-8 rounded-2xl font-semibold shadow-[0_4px_12px_rgba(0,113,227,0.2)] hover:bg-[#0077ED] transition-all disabled:opacity-50"
            >
              {buscando ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </form>

        {/* Resultados de búsqueda múltiple */}
        {resultadosBusqueda && resultadosBusqueda.length > 0 && (
          <div className="mt-4 bg-white border border-slate-200 rounded-2xl p-2 shadow-lg max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2 pt-2">
              Seleccione un paciente ({resultadosBusqueda.length} coincidencias)
            </h4>
            <div className="flex flex-col gap-1">
              {resultadosBusqueda.map(pac => {
                const edad = pac.fechaNacimiento 
                  ? new Date().getFullYear() - new Date(pac.fechaNacimiento).getFullYear() 
                  : "?";
                  
                // Extraer YYYY-MM-DD y convertir a DD/MM/YYYY
                const fechaFormateada = pac.fechaNacimiento
                  ? new Date(pac.fechaNacimiento).toISOString().split('T')[0].split('-').reverse().join('/')
                  : "Sin Fecha";

                return (
                  <button
                    key={pac.id}
                    type="button"
                    onClick={() => seleccionarDeLista && seleccionarDeLista(pac)}
                    className="flex flex-col text-left px-4 py-3 rounded-xl hover:bg-[#0071E3]/5 border border-transparent hover:border-[#0071E3]/20 transition-all group"
                  >
                    <span className="font-bold text-[#1D1D1F] group-hover:text-[#0071E3]">{pac.nombreCompleto}</span>
                    <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {pac.cedula 
                        ? `C.I: ${pac.cedula} • ${edad} años` 
                        : `Sin Cédula • F. Nac: ${fechaFormateada}`} {pac.telefono ? `• Tel: ${pac.telefono}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Columna Derecha: Opción Sin Cédula */}
      <div className="lg:border-l lg:border-slate-100 lg:pl-10 flex flex-col justify-center">
        <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-xl shrink-0 mt-0.5">
            <Info size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-bold text-[#1D1D1F] text-sm mb-1">¿Paciente sin identificación?</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed mb-4">
              Utilice esta opción para registrar bebés, niños pequeños o pacientes extranjeros que no posean un número de cédula.
            </p>
            <button 
              type="button" 
              onClick={iniciarRegistroSinCedula}
              className="flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 bg-white px-4 py-2.5 rounded-xl border border-orange-200 shadow-sm transition-all hover:shadow hover:border-orange-300"
            >
              <Baby size={18} strokeWidth={2.5} />
              Registrar Sin Cédula
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}