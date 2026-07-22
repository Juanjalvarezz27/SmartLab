import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { nombre, precioUSD, activo } = body;

    const dataToUpdate: any = {};
    if (nombre !== undefined) dataToUpdate.nombre = nombre;
    if (precioUSD !== undefined) dataToUpdate.precioUSD = parseFloat(precioUSD);
    if (activo !== undefined) dataToUpdate.activo = activo;

    const servicioExistente = await prisma.servicioExtra.findFirst({
      where: { id: parseInt(id), laboratorioId: labId }
    });

    if (!servicioExistente) {
      return NextResponse.json({ error: "No autorizado para modificar este servicio" }, { status: 403 });
    }

    const servicio = await prisma.servicioExtra.update({
      where: { id_laboratorioId: { id: parseInt(id), laboratorioId: labId } },
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
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

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

    const servicioExistente = await prisma.servicioExtra.findFirst({
      where: { id: parseInt(id), laboratorioId: labId }
    });

    if (!servicioExistente) {
      return NextResponse.json({ error: "No autorizado para eliminar este servicio" }, { status: 403 });
    }

    await prisma.servicioExtra.delete({
      where: { id_laboratorioId: { id: parseInt(id), laboratorioId: labId } }
    });

    return NextResponse.json({ success: true, message: "Servicio eliminado correctamente" });
  } catch (error: any) {
    console.error("Error al eliminar servicio extra:", error);
    return NextResponse.json({ error: `Error interno al eliminar (posiblemente esté en uso): ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
