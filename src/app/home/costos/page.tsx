"use client";

import { useState } from "react";
import { CircleDollarSign, FlaskConical, TestTubes, Calculator } from "lucide-react";
import TabCostosFijos from "./TabCostosFijos";
import TabInsumos from "./TabInsumos";
import TabEnsamblador from "./TabEnsamblador";

export default function CostosPage() {
  const [activeTab, setActiveTab] = useState("fijos");

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0071E3] rounded-xl flex items-center justify-center text-white shadow-sm">
            <Calculator size={24} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Estructura de Costos</h1>
            <p className="text-slate-500 font-medium text-sm">Gestión financiera y ensamble de exámenes</p>
          </div>
        </div>

        {/* Segmented Control / Toggle */}
        <div className="inline-flex bg-slate-200/60 p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setActiveTab("fijos")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "fijos"
                ? "bg-white text-[#0071E3] shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <CircleDollarSign size={16} />
            Gastos Fijos
          </button>
          <button
            onClick={() => setActiveTab("insumos")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "insumos"
                ? "bg-white text-[#0071E3] shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <FlaskConical size={16} />
            Insumos
          </button>
          <button
            onClick={() => setActiveTab("ensamblador")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "ensamblador"
                ? "bg-white text-[#0071E3] shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <TestTubes size={16} />
            Ensamblador
          </button>
        </div>
      </div>

      {/* Contenido de Tabs */}
      <div className="w-full">
        {activeTab === "fijos" && <TabCostosFijos />}
        {activeTab === "insumos" && <TabInsumos />}
        {activeTab === "ensamblador" && <TabEnsamblador />}
      </div>
    </div>
  );
}
