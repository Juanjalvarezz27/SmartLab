import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 15;

export async function GET() {
  try {
    const ordenesPendientes = await prisma.orden.findMany({
      where: {
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
