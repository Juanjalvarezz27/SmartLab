import AuthProvider from "../components/AuthProvider";
import Link from "next/link";
import { Building2, Settings, LayoutDashboard, LogOut } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

import SuperAdminLogout from "./components/SuperAdminLogout";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.rol !== "SUPERADMIN") {
    redirect("/");
  }

  return (
    <AuthProvider>
      <div className="flex h-screen w-full bg-[#F5F5F7] font-sans overflow-hidden">
        
        {/* Sidebar exclusivo para SuperAdmin */}
        <aside className="w-64 h-full bg-white border-r border-slate-200 flex flex-col justify-between py-6 px-4 shadow-sm z-20">
          <div>
            <div className="px-2 mb-8 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                S
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">SmartLab</span>
              <span className="text-[10px] font-black uppercase text-blue-600 ml-1 bg-blue-50 px-2 py-0.5 rounded-full">ADMIN</span>
            </div>
            
            <nav className="flex flex-col gap-1">
              <Link href="/superadmin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-700 font-medium transition-colors">
                <Building2 size={20} />
                <span>Laboratorios</span>
              </Link>
              
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 font-medium opacity-50 cursor-not-allowed">
                <LayoutDashboard size={20} />
                <span>Métricas</span>
              </div>
              
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 font-medium opacity-50 cursor-not-allowed">
                <Settings size={20} />
                <span>Configuración SaaS</span>
              </div>
            </nav>
          </div>
          
          <div className="border-t border-slate-100 pt-4">
            <SuperAdminLogout />
          </div>
        </aside>
        
        {/* Contenedor principal de las vistas */}
        <main className="flex-1 h-full overflow-y-auto bg-[#F5F5F7]">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
