"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ModalConfirmacionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (valorInput?: string) => void; // AHORA ACEPTA EL TEXTO
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  colorBoton?: "red" | "blue"; 
  requiereInput?: boolean; 
  placeholderInput?: string;
}

export default function ModalConfirmacion({
  isOpen,
  onClose,
  onConfirm,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  colorBoton = "red",
  requiereInput = false,
  placeholderInput = "Ingrese valor...",
}: ModalConfirmacionProps) {
  const [mostrar, setMostrar] = useState(false);
  const [inputValue, setInputValue] = useState(""); // ESTADO PARA EL INPUT

  useEffect(() => {
    if (isOpen) {
      setMostrar(true);
      setInputValue(""); // Limpiamos el input cada vez que se abre
    } else {
      const timer = setTimeout(() => setMostrar(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mostrar) return null;

  const handleConfirm = () => {
    // ENVIAMOS EL TEXTO A LA PÁGINA PRINCIPAL
    onConfirm(requiereInput ? inputValue : undefined);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-200 ${
        isOpen ? "opacity-100 bg-black/20" : "opacity-0 bg-transparent"
      }`}
    >
      <div
        className={`bg-white border border-slate-200 w-full max-w-[400px] rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transform transition-all duration-200 ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        <div className="p-6 pb-0 flex justify-between items-start">
          <div className={`p-3 rounded-2xl ${colorBoton === "red" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}>
            <AlertTriangle size={24} strokeWidth={2.5} />
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6 pt-4">
          <h3 className="font-title text-xl font-bold text-[#1D1D1F] mb-2">{titulo}</h3>
          <p className="text-[#86868B] font-medium leading-relaxed mb-4">{mensaje}</p>

          {/* INPUT PARA LA CLAVE */}
          {requiereInput && (
            <input
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholderInput}
              className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-bold text-[#1D1D1F] focus:ring-2 focus:ring-red-500/20 focus:outline-none border border-transparent focus:border-red-500"
            />
          )}
        </div>

        <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 rounded-b-[32px] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-colors"
          >
            {textoCancelar}
          </button>
          <button
            onClick={handleConfirm}
            disabled={requiereInput && inputValue.trim() === ""}
            className={`flex-1 py-3 px-4 text-white font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              colorBoton === "red" 
                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" 
                : "bg-[#0071E3] hover:bg-[#0077ED] shadow-blue-500/20"
            }`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}