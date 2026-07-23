import Sidebar from "../components/ui/Sidebar";
import AuthProvider from "../components/AuthProvider"; 
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const labId = (session?.user as any)?.laboratorioId;
  
  let labInfo = null;
  if (labId) {
    labInfo = await prisma.laboratorio.findUnique({
      where: { id: labId },
      select: { nombre: true, logoBase64: true, activo: true }
    });
  }

  if (labInfo && !labInfo.activo) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 selection:bg-rose-500/30">
         <div className="text-center p-10 bg-white rounded-[32px] shadow-2xl max-w-md border-t-8 border-rose-500 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Acceso Suspendido</h1>
            <p className="text-slate-500 font-medium">El acceso a este sistema ha sido inhabilitado temporalmente por falta de pago o por decisión administrativa. Por favor, contacta a soporte.</p>
         </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <div className="flex h-screen w-full bg-[#F5F5F7] font-sans overflow-hidden">
        <Sidebar laboratorio={labInfo} />
        <main className="flex-1 h-full overflow-y-auto">
          <div className="w-full h-full p-8">
            {children}
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}