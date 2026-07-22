import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const revalidate = 15;

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ordenesPendientes = await prisma.orden.findMany({
      where: {
        laboratorioId: labId,
        estado: { nombre: "BORRADOR" }
      },
      select: {
        id: true,
        fechaCreacion: true,
        totalUSD: true,
        paciente: { select: { nombreCompleto: true } }
      },
      orderBy: {
        fechaCreacion: 'desc'
      },
      take: 20
    });

    return NextResponse.json(ordenesPendientes);
  } catch (error: any) {
    console.error("Error al obtener ordenes pendientes:", error);
    return NextResponse.json({ error: `Error al cargar las órdenes pendientes: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
