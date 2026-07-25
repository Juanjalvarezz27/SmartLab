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

    const bioanalistas = await prisma.usuario.findMany({
      where: { 
        laboratorioId: labId,
        rol: { in: ["BIOANALISTA", "LABORATORIO"] },
        activo: true,
        pinFirma: { not: null }
      },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" }
    });
    
    return NextResponse.json(bioanalistas);
  } catch (error: any) {
    return NextResponse.json({ error: `Error al obtener lista de bioanalistas: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
