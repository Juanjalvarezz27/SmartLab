import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCaracasTodayBounds, formatToCaracasDateString, getCaracasBoundsForDate } from "@/lib/dateUtils";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const revalidate = 15;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const boundsHoy = getCaracasTodayBounds();

    // 1. Buscar la última orden antes de hoy de ESTE laboratorio
    const ultimaOrden = await prisma.orden.findFirst({
      where: { 
        laboratorioId: labId,
        fechaCreacion: { lt: boundsHoy.inicio } 
      },
      orderBy: { fechaCreacion: 'desc' },
      select: { fechaCreacion: true }
    });

    if (!ultimaOrden) {
      return NextResponse.json({ faltaCierreAnterior: false });
    }

    // 2. Obtener el día (en Caracas) de esa última orden
    const fechaUltimaOrdenStr = formatToCaracasDateString(ultimaOrden.fechaCreacion);
    const boundsUltimoDia = getCaracasBoundsForDate(fechaUltimaOrdenStr);

    // 3. Verificar si se realizó un CierreCaja en ese día por ESTE laboratorio
    const cierreEseDia = await prisma.cierreCaja.findFirst({
      where: { 
        laboratorioId: labId,
        fechaCierre: { gte: boundsUltimoDia.inicio, lte: boundsUltimoDia.fin } 
      }
    });

    const faltaCierreAnterior = !cierreEseDia;

    return NextResponse.json({
      faltaCierreAnterior,
      fechaFaltante: faltaCierreAnterior ? fechaUltimaOrdenStr : null
    });

  } catch (error: any) {
    return NextResponse.json({ error: `Error interno: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
