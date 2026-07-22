"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

export default function LoginPage() {
  const router = useRouter();
  const [verClave, setVerClave] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Usamos FormData para evitar lag al escribir (cero re-renders)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCargando(true);

    const formData = new FormData(e.currentTarget);
    const correo = formData.get("correo") as string;
    const clave = formData.get("clave") as string;

    const respuesta = await signIn("credentials", {
      correo,
      clave,
      redirect: false,
    });

    setCargando(false);

    if (respuesta?.error) {
      toast.error(respuesta.error);
    } else {
      toast.success("¡Bienvenido al sistema!");
      router.push("/home");
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center font-sans p-6 sm:p-10 relative overflow-hidden selection:bg-[#0071E3]/20 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100/50 via-[#F2F4F7] to-orange-50/40">
      
      {/* TARJETA MAESTRA RECTANGULAR Optimizada */}
      <div className="relative w-full max-w-[1100px] flex flex-col lg:flex-row bg-white/60 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden z-10 border border-white">
        
        {/* COLUMNA IZQUIERDA: LEYMA C.A. */}
        <div className="hidden lg:flex w-[45%] flex-col justify-between p-14 bg-white border-r border-slate-100 relative z-20">
          
          <div className="flex flex-col items-start mt-4">
            {/* LOGO AMPLIADO AQUÍ (w-40 h-40 en lugar de w-28 h-28) */}
            <div className="relative w-40 h-40 mb-8 drop-shadow-sm filter">
              <Image
                src="/Logo2.png" 
                alt="Logo Leyma"
                fill
                className="object-contain"
                priority
              />
            </div>
            
            <div className="flex items-baseline gap-2 mb-4">
              <h1 className="font-title text-7xl font-black text-[#1D1D1F] tracking-tighter leading-none">
                LEYMA
              </h1>
              <span className="text-2xl font-black text-[#1D1D1F] tracking-tight">
                C.A.
              </span>
            </div>
            
            <h2 className="text-xl font-medium text-[#86868B] leading-relaxed tracking-tight max-w-[300px]">
              Laboratorio Clínico Bacteriológico.
            </h2>
          </div>

          <div className="mb-4">
            <div className="w-12 h-1 bg-[#1D1D1F]/10 rounded-full mb-4"></div>
            <p className="text-xs font-semibold text-[#86868B] uppercase tracking-[0.2em]">
              Sistema de Gestión
            </p>
          </div>
        </div>

        {/* COLUMNA DERECHA: Panel de Acceso */}
        <div className="w-full lg:w-[55%] flex flex-col justify-center p-10 sm:p-16 relative">
          
          <div className="w-full max-w-[400px] mx-auto">
            {/* Encabezado */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-[#0071E3]/10 rounded-[14px] flex items-center justify-center shrink-0 shadow-sm border border-[#0071E3]/10">
                  <Lock className="text-[#0071E3] w-6 h-6" strokeWidth={2.5} />
                </div>
                <h3 className="font-title text-3xl font-bold text-[#1D1D1F] tracking-tight">
                  Acceso al Sistema
                </h3>
              </div>
              <p className="text-[#86868B] font-medium ml-[64px] text-sm">
                Introduce tus credenciales autorizadas.
              </p>
            </div>

            {/* Formulario (Sin states en los inputs para maximo rendimiento) */}
            <form onSubmit={handleSubmit} className="space-y-7">
              <div className="space-y-5">
                {/* Campo Usuario */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="correo" className="text-[11px] font-bold text-[#1D1D1F]/50 uppercase ml-4 tracking-[0.15em]">Usuario</label>
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    className="w-full px-5 py-4 bg-white border border-slate-200/60 rounded-2xl text-[#1D1D1F] text-base font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-[#0071E3]/15 focus:border-[#0071E3]/50 transition-all duration-200 placeholder:text-slate-400"
                    placeholder="admin@admin"
                    required
                    disabled={cargando}
                  />
                </div>

                {/* Campo Contraseña */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="clave" className="text-[11px] font-bold text-[#1D1D1F]/50 uppercase ml-4 tracking-[0.15em]">Contraseña</label>
                  <div className="relative">
                    <input
                      id="clave"
                      name="clave"
                      type={verClave ? "text" : "password"}
                      className="w-full px-5 py-4 bg-white border border-slate-200/60 rounded-2xl text-[#1D1D1F] text-base font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-[#0071E3]/15 focus:border-[#0071E3]/50 transition-all duration-200 placeholder:text-slate-400"
                      placeholder="••••••••"
                      required
                      disabled={cargando}
                    />
                    <button
                      type="button"
                      onClick={() => setVerClave(!verClave)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#86868B] hover:text-[#0071E3] transition-colors"
                      tabIndex={-1} // Evita que el tab se detenga aquí al navegar por el form
                    >
                      {verClave ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Botón Principal con Loader */}
              <button
                type="submit"
                disabled={cargando}
                className="group w-full h-[58px] bg-[#0071E3] text-white text-[17px] font-semibold rounded-2xl shadow-[0_10px_20px_rgba(0,113,227,0.2)] hover:bg-[#0077ED] transition-all duration-200 flex items-center justify-center gap-2 mt-4 disabled:opacity-80 active:scale-[0.98]"
              >
                {cargando ? (
                  // Mini Loader animado
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <>
                    <span>Entrar al Laboratorio</span>
                    <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Integrado */}
            <div className="mt-12 pt-8 border-t border-slate-200/50 flex justify-between items-center">
              <span className="text-[10px] font-black text-[#1D1D1F]/40 uppercase tracking-[0.3em]">LEYMA</span>
              <span className="text-[10px] font-bold text-[#1D1D1F]/30 uppercase tracking-[0.3em]">Trujillo, VZLA</span>
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}