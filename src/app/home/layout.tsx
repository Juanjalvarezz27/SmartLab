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
      select: { nombre: true, logoBase64: true }
    });
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