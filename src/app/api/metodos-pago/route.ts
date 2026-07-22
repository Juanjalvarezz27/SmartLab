import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const metodos = await prisma.metodoPago.findMany({
      where: { laboratorioId: labId },
      orderBy: { nombre: 'asc' }
    });
    
    const response = NextResponse.json(metodos);
    response.headers.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: `Error al cargar métodos de pago: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
