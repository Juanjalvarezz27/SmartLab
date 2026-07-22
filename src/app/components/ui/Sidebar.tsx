"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  Home, 
  FileSignature, 
  CalendarDays, 
  Microscope, 
  TestTubes, 
  Users, 
  Award, 
  BarChart3, 
  Wallet, 
  Calculator, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  UserCog, // <-- NUEVO ÍCONO
  ClipboardList, // <-- ÍCONO DE PRESUPUESTO
  Settings,
  ChevronDown,
  CircleDollarSign
} from "lucide-react";
import ModalConfirmacion from "./ModalConfirmacion";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const rolUsuario = (session?.user as any)?.rol || "USUARIO";

  const rutasPrincipales = [
    { nombre: "Inicio", ruta: "/home", icono: Home }, 
    { nombre: "Registro", ruta: "/home/registro", icono: FileSignature },
    { nombre: "Lista Diaria", ruta: "/home/diaria", icono: CalendarDays },
    { nombre: "Resultados", ruta: "/home/resultados", icono: Microscope },
    { nombre: "Pacientes", ruta: "/home/pacientes", icono: Users },
    { nombre: "Presupuestos", ruta: "/home/presupuestos", icono: ClipboardList },
    { nombre: "Constancias", ruta: "/home/constancias", icono: Award },
  ];

  const rutasConfiguracion = [
    { nombre: "Pruebas", ruta: "/home/pruebas", icono: TestTubes },
    { nombre: "Estadísticas", ruta: "/home/estadisticas", icono: BarChart3 },
    { nombre: "Monedero", ruta: "/home/monedero", icono: Wallet },
    { nombre: "Cierre de Caja", ruta: "/home/cierre", icono: Calculator },
    { nombre: "Mi Perfil", ruta: "/home/perfil", icono: UserCog },
    { nombre: "Estructura Costos", ruta: "/home/costos", icono: CircleDollarSign },
  ];

  const rutasPermitidasUsuario = [
    "/home", "/home/registro", "/home/diaria", "/home/resultados", "/home/pacientes", "/home/constancias", "/home/presupuestos", "/home/cierre"
  ];

  const menuPrincipal = rolUsuario === "ADMIN" 
    ? rutasPrincipales 
    : rutasPrincipales.filter(item => rutasPermitidasUsuario.includes(item.ruta));

  const menuConfiguracion = rolUsuario === "ADMIN"
    ? rutasConfiguracion
    : rutasConfiguracion.filter(item => rutasPermitidasUsuario.includes(item.ruta));

  // Abrir configuración automáticamente si estamos en una de sus rutas
  // Solo dependemos de pathname para no forzar cierres al hacer clic
  useEffect(() => {
    if (rutasConfiguracion.some(item => pathname.startsWith(item.ruta))) {
      setIsConfigOpen(true);
    } else {
      setIsConfigOpen(false);
    }
  }, [pathname]);

  return (
    <>
      <aside 
        className={`relative h-screen bg-white/80 border-r border-[#D2D2D7]/50 flex flex-col shrink-0 transition-[width] duration-300 ease-in-out z-50 ${
          isCollapsed ? "w-[88px]" : "w-[280px]"
        }`}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-10 w-8 h-8 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center hover:bg-slate-50 hover:scale-105 transition-all z-50 text-slate-500"
          aria-label="Alternar menú lateral"
        >
          {isCollapsed ? <ChevronRight size={18} strokeWidth={2.5} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
        </button>

        <div className={`h-24 flex items-center border-b border-[#D2D2D7]/30 transition-all duration-300 overflow-hidden ${
          isCollapsed ? "justify-center px-0" : "px-8"
        }`}>
          <div className="flex items-center gap-3 w-full">
            <div className={`relative shrink-0 drop-shadow-sm transition-all duration-300 ${
              isCollapsed ? "w-10 h-10 mx-auto" : "w-12 h-12"
            }`}>
              <Image src="/Logo2.png" alt="Leyma" fill className="object-contain" />
            </div>
            
            <div className={`flex flex-col whitespace-nowrap transition-all duration-300 overflow-hidden ${
              isCollapsed ? "w-0 opacity-0" : "w-[120px] opacity-100"
            }`}>
              <span className="font-title text-xl font-black text-[#1D1D1F] tracking-tight leading-none">
                LEYMA <span className="text-sm font-black text-[#1D1D1F]">C.A.</span>
              </span>
              <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-[0.2em] mt-1">
                Laboratorio
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-1 px-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300/80 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full">
        
          {/* RUTAS PRINCIPALES */}
          {menuPrincipal.map((item) => {
            const isActive = item.ruta === "/home" 
              ? pathname === "/home" 
              : pathname.startsWith(item.ruta);
            
            const Icon = item.icono;

            return (
              <Link
                key={item.ruta}
                href={item.ruta}
                title={isCollapsed ? item.nombre : ""}
                className={`flex items-center rounded-2xl transition-all duration-300 group overflow-hidden whitespace-nowrap ${
                  isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"
                } ${
                  isActive 
                    ? "bg-[#0071E3]/10 text-[#0071E3]" 
                    : "text-slate-700 hover:bg-slate-100/80 font-semibold"
                }`}
              >
                <div className="flex items-center justify-center shrink-0 w-6">
                  <Icon 
                    size={20} 
                    strokeWidth={isActive ? 2.5 : 2.5} 
                    className={`transition-colors ${isActive ? "text-[#0071E3]" : "text-slate-500 group-hover:text-[#1D1D1F]"}`} 
                  />
                </div>
                
                <span className={`text-[15px] transition-all duration-300 overflow-hidden ${
                  isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100 ml-3"
                } ${isActive ? "font-bold" : "group-hover:text-[#1D1D1F]"}`}>
                  {item.nombre}
                </span>
              </Link>
            );
          })}

          {/* MENÚ DESPLEGABLE DE CONFIGURACIÓN */}
          {menuConfiguracion.length > 0 && (
            <div className="pt-2 mt-2 border-t border-slate-200/50">
              <button
                onClick={() => {
                  if (isCollapsed) setIsCollapsed(false);
                  setIsConfigOpen(!isConfigOpen);
                }}
                title={isCollapsed ? "Configuración" : ""}
                className={`w-full flex items-center rounded-2xl transition-all duration-300 group overflow-hidden whitespace-nowrap ${
                  isCollapsed ? "justify-center px-0 py-3" : "justify-between px-4 py-3"
                } text-slate-700 hover:bg-slate-100/80 hover:text-[#1D1D1F] font-semibold`}
              >
                <div className="flex items-center">
                  <div className="flex items-center justify-center shrink-0 w-6">
                    <Settings 
                      size={20} 
                      strokeWidth={2.5} 
                      className={`transition-colors ${isConfigOpen ? "text-[#1D1D1F]" : "text-slate-600 group-hover:text-[#1D1D1F]"}`} 
                    />
                  </div>
                  <span className={`text-[15px] transition-all duration-300 overflow-hidden ${
                    isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100 ml-3"
                  }`}>
                    Configuración
                  </span>
                </div>
                {!isCollapsed && (
                  <ChevronDown size={16} strokeWidth={2.5} className={`transition-transform duration-300 text-slate-500 ${isConfigOpen ? "rotate-180" : ""}`} />
                )}
              </button>

              <div className={`overflow-hidden transition-all duration-300 ${
                isConfigOpen && !isCollapsed ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
              }`}>
                <div className="flex flex-col space-y-1">
                  {menuConfiguracion.map((item) => {
                    const isActive = pathname.startsWith(item.ruta);
                    const Icon = item.icono;
                    return (
                      <Link
                        key={item.ruta}
                        href={item.ruta}
                        className={`flex items-center rounded-2xl transition-all duration-300 group overflow-hidden whitespace-nowrap pl-12 pr-4 py-3 ${
                          isActive 
                            ? "bg-[#0071E3]/10 text-[#0071E3]" 
                            : "text-slate-600 hover:bg-slate-100/80"
                        }`}
                      >
                        <div className="flex items-center justify-center shrink-0 w-6 mr-3">
                          <Icon 
                            size={20} 
                            strokeWidth={isActive ? 2.5 : 2.5} 
                            className={`transition-colors ${isActive ? "text-[#0071E3]" : "text-slate-500 group-hover:text-[#1D1D1F]"}`} 
                          />
                        </div>
                        <span className={`text-[15px] ${isActive ? "font-bold" : "font-semibold group-hover:text-[#1D1D1F]"}`}>
                          {item.nombre}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#D2D2D7]/30">
          <button
            onClick={() => setShowLogoutModal(true)}
            title={isCollapsed ? "Cerrar Sesión" : ""}
            className={`w-full flex items-center rounded-2xl bg-red-50/50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors font-semibold group overflow-hidden whitespace-nowrap ${
              isCollapsed ? "justify-center px-0 py-3" : "px-4 py-2.5"
            }`}
          >
            <div className="flex items-center justify-center shrink-0 w-6">
              <LogOut size={20} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
            </div>
            
            <span className={`transition-all duration-300 overflow-hidden ${
              isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100 ml-3"
            }`}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>

      <ModalConfirmacion 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => signOut({ callbackUrl: '/' })}
        titulo="Cerrar Sesión"
        mensaje="¿Estás seguro de que deseas salir del sistema? Tendrás que volver a ingresar tus credenciales para acceder."
        textoConfirmar="Cerrar Sesión"
        textoCancelar="Cancelar"
        colorBoton="red"
      />
    </>
  );
}