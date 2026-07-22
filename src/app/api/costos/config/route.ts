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

    const labConfig = await prisma.laboratorio.findUnique({
      where: { id: labId },
      select: { volumenPruebasMensualEstimado: true }
    });
    
    // Obtener también el total de costos fijos para calcular la cuota directamente
    const sumatoria = await prisma.costoFijo.aggregate({
      _sum: { montoMensualUSD: true },
      where: { activo: true, laboratorioId: labId },
    });

    const costoFijoTotal = sumatoria._sum.montoMensualUSD || 0;
    const volumen = labConfig?.volumenPruebasMensualEstimado || 1000;
    const cuotaFijaPorPrueba = volumen > 0 ? costoFijoTotal / volumen : 0;

    return NextResponse.json({
      config: { volumenPruebasMensualEstimado: volumen },
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
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { volumenPruebasMensualEstimado } = body;

    const labActualizado = await prisma.laboratorio.update({
      where: { id: labId },
      data: { volumenPruebasMensualEstimado: Number(volumenPruebasMensualEstimado) },
      select: { volumenPruebasMensualEstimado: true }
    });
    
    return NextResponse.json({ config: labActualizado });
  } catch (error: any) {
    return NextResponse.json({ error: `Error al actualizar config: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
