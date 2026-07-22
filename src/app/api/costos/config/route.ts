import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let config = await prisma.configuracionLaboratorio.findFirst();
    if (!config) {
      config = await prisma.configuracionLaboratorio.create({
        data: { volumenPruebasMensualEstimado: 1000 },
      });
    }
    
    // Obtener también el total de costos fijos para calcular la cuota directamente
    const sumatoria = await prisma.costoFijo.aggregate({
      _sum: { montoMensualUSD: true },
      where: { activo: true },
    });

    const costoFijoTotal = sumatoria._sum.montoMensualUSD || 0;
    const cuotaFijaPorPrueba = config.volumenPruebasMensualEstimado > 0 
      ? costoFijoTotal / config.volumenPruebasMensualEstimado 
      : 0;

    return NextResponse.json({
      config,
      costoFijoTotal,
      cuotaFijaPorPrueba
    });
  } catch (error: any) {
    console.error("Error en config costos:", error);
    return NextResponse.json({ error: `Error del servidor: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { volumenPruebasMensualEstimado } = body;

    let config = await prisma.configuracionLaboratorio.findFirst();
    if (config) {
      config = await prisma.configuracionLaboratorio.update({
        where: { id: config.id },
        data: { volumenPruebasMensualEstimado: Number(volumenPruebasMensualEstimado) },
      });
    } else {
      config = await prisma.configuracionLaboratorio.create({
        data: { volumenPruebasMensualEstimado: Number(volumenPruebasMensualEstimado) },
      });
    }
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: `Error al actualizar config: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
