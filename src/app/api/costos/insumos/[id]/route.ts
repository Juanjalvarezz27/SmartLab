import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await req.json();
    const { nombre, unidadMedida, costoUnitarioUSD, cantidadComprada, costoTotalUSD, activo } = body;
    
    const actualizado = await prisma.insumo.update({
      where: { id },
      data: {
        nombre,
        unidadMedida,
        costoUnitarioUSD: costoUnitarioUSD !== undefined ? Number(costoUnitarioUSD) : undefined,
        cantidadComprada: cantidadComprada !== undefined ? (cantidadComprada ? Number(cantidadComprada) : null) : undefined,
        costoTotalUSD: costoTotalUSD !== undefined ? (costoTotalUSD ? Number(costoTotalUSD) : null) : undefined,
        activo,
      },
    });

    return NextResponse.json(actualizado);
  } catch (error: any) {
    console.error("Error al actualizar insumo:", error);
    return NextResponse.json({ error: `Error al actualizar insumo: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    await prisma.insumo.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: `Error al eliminar insumo: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
