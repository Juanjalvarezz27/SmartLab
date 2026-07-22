"use client";
import { useState, useEffect } from "react";
import { X, Copy, ExternalLink, CheckCircle2, MessageCircle } from "lucide-react";
import { toast } from "react-toastify";

interface ModalAsistenteWhatsAppProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteNombre: string;
  telefono: string;
  tipoMensaje: 'resultados' | 'presupuesto' | 'cobro' | 'contacto';
  datosAdicionales?: {
    link?: string;
    montoUSD?: number;
    montoBS?: number;
    ordenId?: number;
  };
}

export default function ModalAsistenteWhatsApp({ isOpen, onClose, pacienteNombre, telefono, tipoMensaje, datosAdicionales }: ModalAsistenteWhatsAppProps) {
  const [paso, setPaso] = useState(1);
  const [saludoActual, setSaludoActual] = useState("");
  const [mensajeActual, setMensajeActual] = useState("");
  const [saludoCopiado, setSaludoCopiado] = useState(false);
  const [esperando, setEsperando] = useState(false);
  const [tiempoEspera, setTiempoEspera] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPaso(1);
      setSaludoCopiado(false);
      setEsperando(false);
      setTiempoEspera(0);
      generarTextos();
    }
  }, [isOpen, tipoMensaje]);

  const obtenerIndiceCiclico = (key: string, max: number) => {
    const prev = parseInt(localStorage.getItem(key) || "-1", 10);
    const next = (prev + 1) % max;
    localStorage.setItem(key, next.toString());
    return next;
  };

  const generarTextos = () => {
    // 1. Generar Saludo
    const hora = new Date().getHours();
    let saludoBase = "Hola";
    if (hora < 12) saludoBase = "Buenos días";
    else if (hora < 18) saludoBase = "Buenas tardes";
    else saludoBase = "Buenas noches";

    const saludos = [
      `${saludoBase} ${pacienteNombre}, esperamos que se encuentre muy bien.`,
      `${saludoBase} ${pacienteNombre}.`,
      `Hola ${pacienteNombre}, ${saludoBase.toLowerCase()}.`,
      `${saludoBase}, ${pacienteNombre}.`
    ];
    
    const idxSaludo = obtenerIndiceCiclico("leyma_ws_idx_saludo", saludos.length);
    setSaludoActual(saludos[idxSaludo]);

    // 2. Generar Mensaje Principal
    let mensajes: string[] = [];
    if (tipoMensaje === 'resultados' && datosAdicionales?.link) {
      mensajes = [
        `Sus resultados ya están disponibles.\nPuede consultarlos aquí:\n${datosAdicionales.link}\n\nCualquier duda estamos para servirle.\nLaboratorio LEYMA C.A.`,
        `Le informamos que sus resultados ya están listos.\nPuede visualizar el informe aquí:\n${datosAdicionales.link}\n\nFeliz día.`,
        `Compartimos el enlace para consultar sus resultados:\n${datosAdicionales.link}\n\nGracias por confiar en nosotros.`,
        `Ya puede consultar el resultado de sus exámenes.\nAcceda mediante el siguiente enlace:\n${datosAdicionales.link}\n\nEstamos a su disposición para cualquier consulta.`,
        `Adjuntamos el enlace para consultar sus resultados clínicos.\n${datosAdicionales.link}\n\nMuchas gracias por preferir Laboratorio LEYMA.`
      ];
    } else if (tipoMensaje === 'presupuesto' && datosAdicionales?.link) {
      mensajes = [
        `Adjuntamos su presupuesto solicitado.\nPuede verlo aquí:\n${datosAdicionales.link}\n\nCualquier consulta estamos a su orden.`,
        `Aquí tiene el presupuesto de sus exámenes.\nEnlace:\n${datosAdicionales.link}\n\nGracias por considerarnos.`,
        `Le compartimos el presupuesto detallado en el siguiente enlace:\n${datosAdicionales.link}\n\n¡Feliz día!`
      ];
    } else if (tipoMensaje === 'cobro' && datosAdicionales?.montoUSD !== undefined && datosAdicionales?.montoBS !== undefined) {
      const bsStr = datosAdicionales.montoBS.toLocaleString('es-VE', {minimumFractionDigits: 2});
      const usdStr = datosAdicionales.montoUSD.toFixed(2);
      mensajes = [
        `Le informamos que sus resultados ya están listos y validados.\nPor favor, acérquese a nuestras instalaciones para realizar el pago pendiente y recibir su informe oficial.\n*Total de la orden:* $${usdStr} / Bs ${bsStr}\n¡Le esperamos!`,
        `Sus exámenes ya fueron procesados con éxito.\nPara la entrega de sus resultados, le invitamos a pasar por el laboratorio y cancelar el saldo pendiente de $${usdStr} (Bs ${bsStr}).\n¡Gracias por su confianza!`,
        `Nos comunicamos para avisarle que sus resultados están listos.\nPuede retirar su informe oficial en el laboratorio realizando el pago de su saldo: $${usdStr} (Bs ${bsStr}).\n¡Estamos a su orden!`
      ];
    } else if (tipoMensaje === 'contacto') {
      const idStr = datosAdicionales?.ordenId ? datosAdicionales.ordenId.toString().padStart(5, '0') : "";
      mensajes = [
        idStr ? `Nos comunicamos referente a su orden N° ${idStr}.` : `Nos comunicamos desde el Laboratorio LEYMA.`,
        idStr ? `Le escribimos con relación a su orden N° ${idStr}.` : `Le escribimos del Laboratorio LEYMA C.A.`,
      ];
    }

    if (mensajes.length > 0) {
      const idxMensaje = obtenerIndiceCiclico(`leyma_ws_idx_msg_${tipoMensaje}`, mensajes.length);
      setMensajeActual(mensajes[idxMensaje]);
    } else {
      setMensajeActual("Mensaje no configurado.");
    }
  };

  const abrirWhatsAppApp = () => {
    let cleaned = telefono.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = "58" + cleaned.substring(1);
    else if (!cleaned.startsWith("58")) cleaned = "58" + cleaned;

    // Usamos el protocolo api.whatsapp.com que el navegador redirige nativamente a la App de Escritorio 
    // sin crear conflictos y ofreciendo fallback si la app no está abierta
    window.open(`https://api.whatsapp.com/send/?phone=${cleaned}`, "_blank");
    toast.success("Abriendo la App de WhatsApp...");
    setPaso(2);
  };

  const copiarAlPortapapeles = (texto: string, esSaludo: boolean = false) => {
    navigator.clipboard.writeText(texto)
      .then(() => {
        toast.success("Copiado al portapapeles");
        if (esSaludo) setSaludoCopiado(true);
      })
      .catch(() => toast.error("Error al copiar. Selecciona el texto manualmente."));
  };

  const confirmarEnvioSaludo = () => {
    if (!saludoCopiado) {
      toast.warning("Primero debes copiar el saludo.");
      return;
    }
    
    setEsperando(true);
    setTiempoEspera(3);
    
    let timer = 3;
    const interval = setInterval(() => {
      timer--;
      setTiempoEspera(timer);
      if (timer <= 0) {
        clearInterval(interval);
        setEsperando(false);
        setPaso(3);
      }
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* HEADER */}
        <div className="bg-emerald-500 p-5 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <MessageCircle size={24} />
            <h2 className="text-xl font-bold">Asistente de WhatsApp Seguro</h2>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-5 overflow-y-auto max-h-[85vh]">
          <p className="text-slate-600 mb-4 text-sm font-medium">
            Paciente: <strong className="text-slate-800 text-base">{pacienteNombre}</strong> ({telefono})
          </p>

          <div className="space-y-4">
            
            {/* PASO 1 */}
            <div className={`p-3 border rounded-2xl transition-colors ${paso === 1 ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white opacity-50'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> 
                  Abrir Conversación
                </h3>
                {paso > 1 && <CheckCircle2 className="text-emerald-500" size={20} />}
              </div>
              <p className="text-xs text-slate-500 mb-2">Se abrirá el chat vacío en tu aplicación de WhatsApp. No se enviará ningún mensaje automático.</p>
              <button 
                onClick={abrirWhatsAppApp}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-2 rounded-xl font-bold hover:bg-[#1ebd5a] transition-all shadow-md shadow-emerald-500/20"
              >
                <ExternalLink size={18} /> Abrir WhatsApp (App)
              </button>
            </div>

            {/* PASO 2 */}
            <div className={`p-3 border rounded-2xl transition-colors ${paso === 2 ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white opacity-50'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> 
                  Copiar Saludo y Enviar
                </h3>
                {paso > 2 && <CheckCircle2 className="text-emerald-500" size={20} />}
              </div>
              <p className="text-xs text-slate-500 mb-2">Copia este saludo (generado aleatoriamente), pégalo en WhatsApp y envíalo al paciente.</p>
              
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 mb-2 text-slate-700 text-sm italic relative pr-10">
                {saludoActual}
                <button 
                  onClick={() => copiarAlPortapapeles(saludoActual, true)}
                  className="absolute right-1.5 top-1.5 p-1.5 text-slate-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <Copy size={16} />
                </button>
              </div>

              {esperando ? (
                <div className="w-full py-2 rounded-xl font-bold bg-slate-100 text-slate-500 text-center flex justify-center items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Esperando naturalidad ({tiempoEspera}s)...
                </div>
              ) : (
                <button 
                  onClick={confirmarEnvioSaludo}
                  disabled={paso < 2 || !saludoCopiado}
                  className={`w-full py-2 rounded-xl font-bold transition-all ${paso === 2 && saludoCopiado ? 'bg-slate-800 text-white hover:bg-slate-700 shadow-md' : 'bg-slate-100 text-slate-400'}`}
                >
                  ✓ Ya envié el saludo
                </button>
              )}
            </div>

            {/* PASO 3 */}
            <div className={`p-3 border rounded-2xl transition-colors ${paso === 3 ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white opacity-50'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span> 
                  Copiar Mensaje Principal
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-2">Copia el mensaje principal, pégalo en WhatsApp y envíalo. ¡Listo!</p>
              
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 mb-2 text-slate-700 text-sm italic whitespace-pre-wrap relative pr-10">
                {mensajeActual}
                <button 
                  onClick={() => copiarAlPortapapeles(mensajeActual)}
                  className="absolute right-1.5 top-1.5 p-1.5 text-slate-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <Copy size={16} />
                </button>
              </div>

              <button 
                onClick={() => {
                  toast.success("¡Proceso completado con éxito!");
                  onClose();
                }}
                disabled={paso < 3}
                className={`w-full py-2 rounded-xl font-bold transition-all ${paso === 3 ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20' : 'bg-slate-100 text-slate-400'}`}
              >
                Ya envié el mensaje (Finalizar)
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
