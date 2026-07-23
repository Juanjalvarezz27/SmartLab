"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Settings } from "lucide-react";

export default function SuperAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      <Link 
        href="/superadmin" 
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
          pathname === "/superadmin" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
        }`}
      >
        <Building2 size={20} />
        <span>Laboratorios</span>
      </Link>
      
      <Link 
        href="/superadmin/metricas" 
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
          pathname.includes("/superadmin/metricas") ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
        }`}
      >
        <LayoutDashboard size={20} />
        <span>Métricas Generales</span>
      </Link>
      
    </nav>
  );
}
