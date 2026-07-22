"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import ModalConfirmacion from "@/app/components/ui/ModalConfirmacion";

export default function SuperAdminLogout() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShowLogoutModal(true)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 font-medium transition-colors"
      >
        <LogOut size={20} />
        <span>Cerrar Sesión</span>
      </button>

      <ModalConfirmacion 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => signOut({ callbackUrl: '/' })}
        titulo="Cerrar Sesión"
        mensaje="¿Estás seguro de que deseas salir del panel de Super Administrador?"
        textoConfirmar="Cerrar Sesión"
        textoCancelar="Cancelar"
        colorBoton="red"
      />
    </>
  );
}
