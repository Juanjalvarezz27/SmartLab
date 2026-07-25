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
    
    // Si solo enviamos el estado "activa" (Botón de inhabilitar)
    if (body.activa !== undefined && Object.keys(body).length === 1) {
      const actualizado = await prisma.prueba.update({
        where: { id_laboratorioId: { id, laboratorioId: labId } },
        data: { activa: body.activa }
      });
      return NextResponse.json(actualizado);
    }

    // Si enviamos los datos completos (Edición individual)
    const actualizado = await prisma.prueba.update({
      where: { id_laboratorioId: { id, laboratorioId: labId } },
      data: { 
        codigo: body.codigo?.toUpperCase(),
        nombre: body.nombre?.toUpperCase(),
        precioUSD: body.precioUSD !== undefined ? parseFloat(body.precioUSD) : undefined,
        unidades: body.unidades !== undefined ? body.unidades : undefined,
        valoresReferencia: body.valoresReferencia !== undefined ? body.valoresReferencia : undefined,
        opcionesPredefinidas: body.opcionesPredefinidas !== undefined ? body.opcionesPredefinidas : undefined,
        categoriaVisual: body.categoriaVisual !== undefined ? body.categoriaVisual : undefined,
        subcategoriaVisual: body.subcategoriaVisual !== undefined ? body.subcategoriaVisual : undefined,
        subcategoriaId: body.subcategoriaId !== undefined ? body.subcategoriaId : undefined,
        ordenVisual: body.ordenVisual !== undefined ? parseInt(body.ordenVisual) : undefined
      }
    });

    return NextResponse.json(actualizado);
  } catch (error: any) {
    return NextResponse.json({ error: `Error al actualizar la prueba individual: ${error?.message || 'Desconocido'}` }, { status: 500 });
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

    if (!claveMaestra) {
      return NextResponse.json({ error: "Clave maestra requerida." }, { status: 400 });
    }

    const lab = await prisma.laboratorio.findUnique({
      where: { id: labId },
      select: { claveMaestra: true }
    });

    if (!lab || claveMaestra !== lab.claveMaestra) {
      return NextResponse.json({ error: "Clave maestra incorrecta." }, { status: 401 });
    }

    const { id } = await params;

    const pruebaExistente = await prisma.prueba.findFirst({
      where: { id: id, laboratorioId: labId }
    });

    if (!pruebaExistente) {
      return NextResponse.json({ error: "No autorizado para eliminar esta prueba" }, { status: 403 });
    }

    await prisma.prueba.delete({
      where: { id_laboratorioId: { id: id, laboratorioId: labId } }
    });

    return NextResponse.json({ success: true, message: "Prueba eliminada correctamente" });
  } catch (error: any) {
    console.error("Error al eliminar prueba individual:", error);
    return NextResponse.json({ error: `Error interno al eliminar (posiblemente esté en uso en resultados): ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}