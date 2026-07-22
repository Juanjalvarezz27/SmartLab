import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await req.json();
    const { nombre, montoMensualUSD, activo } = body;
    
    const actualizado = await prisma.costoFijo.update({
      where: { id },
      data: {
        nombre,
        montoMensualUSD: montoMensualUSD !== undefined ? Number(montoMensualUSD) : undefined,
        activo,
      },
    });

    return NextResponse.json(actualizado);
  } catch (error: any) {
    console.error("Error al actualizar costo fijo:", error);
    return NextResponse.json({ error: `Error al actualizar costo fijo: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    await prisma.costoFijo.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: `Error al eliminar costo fijo: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
