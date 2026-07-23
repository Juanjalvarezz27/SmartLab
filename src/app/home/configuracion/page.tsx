"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Building2, Edit2, Mail, MapPin, Phone, Hash } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import GestionPersonal from "./components/GestionPersonal";
import ModalEditarConfig from "./components/ModalEditarConfig";

export default function ConfiguracionLaboratorioPage() {
  const { update } = useSession(); 
  const [cargando, setCargando] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [datosLab, setDatosLab] = useState<any>(null);

  const fetchConfig = async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/laboratorios/configuracion");
      if (res.ok) {
        const data = await res.json();
        setDatosLab(data);
      } else {
        toast.error("Error al cargar la configuración");
      }
    } catch (error) {
      toast.error("Error de conexión al cargar datos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveSuccess = () => {
    fetchConfig();
    update(); // Forzar actualización de sesión por si cambió el logo
  };

  if (cargando) {
    return (
      <div className="mt-8 flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0071E3]"></div>
      </div>
    );
  }

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="font-title text-3xl font-black text-[#1D1D1F] tracking-tight">
            Configuración General
          </h2>
          <p className="text-[#86868B] font-medium mt-2 max-w-2xl text-base">
            Información base de tu laboratorio. Estos datos aparecerán en los membretes de tus resultados y facturas.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0071E3] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-[0_4px_12px_rgba(0,113,227,0.25)] hover:bg-[#0077ED] transition-all hover:scale-[1.02] active:scale-95 text-sm"
        >
          <Edit2 size={16} strokeWidth={2.5} />
          Editar Información
        </button>
      </div>

      {/* TARJETA DE INFORMACIÓN DE SOLO LECTURA */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden mb-12">
        <div className="p-8 md:p-10 flex flex-col md:flex-row gap-10">
          
          {/* Logo Section */}
          <div className="shrink-0 flex flex-col items-center gap-4">
            <div className="w-48 h-48 rounded-[2rem] border border-slate-100 bg-slate-50/50 flex items-center justify-center relative shadow-inner overflow-hidden">
              {datosLab?.logoBase64 ? (
                <Image src={datosLab.logoBase64} alt="Logo Laboratorio" fill className="object-contain p-4" />
              ) : (
                <Building2 className="text-slate-200 w-20 h-20" strokeWidth={1} />
              )}
            </div>
          </div>

          {/* Data Section */}
          <div className="flex-1 space-y-8">
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{datosLab?.nombre || "Nombre no configurado"}</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                <Hash size={14} /> {datosLab?.rif || "RIF no configurado"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Teléfono de Contacto</p>
                  <p className="font-semibold text-slate-700">{datosLab?.telefono || "No configurado"}</p>
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Correo Electrónico</p>
                  <p className="font-semibold text-slate-700">{datosLab?.correo || "No configurado"}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Dirección Física</p>
                <p className="font-semibold text-slate-700 leading-relaxed">{datosLab?.direccion || "No configurado"}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* SECCIÓN DE GESTIÓN DE PERSONAL */}
      <GestionPersonal />

      <ModalEditarConfig 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={handleSaveSuccess}
        datosActuales={datosLab}
      />
    </div>
  );
}
