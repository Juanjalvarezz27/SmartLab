import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCaracasTodayBounds, formatToCaracasDateString, getCaracasBoundsForDate } from "@/lib/dateUtils";

export const revalidate = 15;

export async function GET() {
  try {
    const boundsHoy = getCaracasTodayBounds();

    // 1. Buscar la última orden antes de hoy
    const ultimaOrden = await prisma.orden.findFirst({
      where: { fechaCreacion: { lt: boundsHoy.inicio } },
      orderBy: { fechaCreacion: 'desc' },
      select: { fechaCreacion: true }
    });

    if (!ultimaOrden) {
      return NextResponse.json({ faltaCierreAnterior: false });
    }

    // 2. Obtener el día (en Caracas) de esa última orden
    const fechaUltimaOrdenStr = formatToCaracasDateString(ultimaOrden.fechaCreacion);
    const boundsUltimoDia = getCaracasBoundsForDate(fechaUltimaOrdenStr);

    // 3. Verificar si se realizó un CierreCaja en ese día
    const cierreEseDia = await prisma.cierreCaja.findFirst({
      where: { fechaCierre: { gte: boundsUltimoDia.inicio, lte: boundsUltimoDia.fin } }
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
