import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { nombre, precioUSD, activo } = body;

    const dataToUpdate: any = {};
    if (nombre !== undefined) dataToUpdate.nombre = nombre;
    if (precioUSD !== undefined) dataToUpdate.precioUSD = parseFloat(precioUSD);
    if (activo !== undefined) dataToUpdate.activo = activo;

    const servicio = await prisma.servicioExtra.update({
      where: { id: parseInt(id) },
      data: dataToUpdate
    });

    return NextResponse.json(servicio);
  } catch (error: any) {
    console.error("Error al actualizar servicio extra:", error);
    return NextResponse.json({ error: `Error interno al actualizar: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { claveMaestra } = body;

    const CLAVE_REAL = process.env.CLAVE_MAESTRA || "leyma2026";

    if (!claveMaestra) {
      return NextResponse.json({ error: "Clave maestra requerida." }, { status: 400 });
    }

    if (claveMaestra !== CLAVE_REAL) {
      return NextResponse.json({ error: "Clave maestra incorrecta." }, { status: 401 });
    }

    const { id } = await params;

    await prisma.servicioExtra.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true, message: "Servicio eliminado correctamente" });
  } catch (error: any) {
    console.error("Error al eliminar servicio extra:", error);
    return NextResponse.json({ error: `Error interno al eliminar (posiblemente esté en uso): ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
