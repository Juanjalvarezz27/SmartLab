import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await req.json();
    const { nombre, montoMensualUSD, activo } = body;
    
    // Verificación de Tenant (Que el costo fijo le pertenezca a su lab)
    const costoExistente = await prisma.costoFijo.findFirst({
      where: { id, laboratorioId: labId }
    });

    if (!costoExistente) {
      return NextResponse.json({ error: "No autorizado para modificar este costo" }, { status: 403 });
    }

    const actualizados = await prisma.costoFijo.updateMany({
      where: { id, laboratorioId: labId },
      data: {
        nombre,
        montoMensualUSD: montoMensualUSD !== undefined ? Number(montoMensualUSD) : undefined,
        activo,
      },
    });

    if (actualizados.count === 0) {
      return NextResponse.json({ error: "Costo no encontrado o acceso denegado" }, { status: 404 });
    }

    // Como no podemos retornar el objeto actualizado con updateMany fácilmente, 
    // y la UI solo necesita saber que fue exitoso:
    return NextResponse.json({ success: true, count: actualizados.count });
  } catch (error: any) {
    console.error("Error al actualizar costo fijo:", error);
    return NextResponse.json({ error: `Error al actualizar costo fijo: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);

    const costoExistente = await prisma.costoFijo.findFirst({
      where: { id, laboratorioId: labId }
    });

    if (!costoExistente) {
      return NextResponse.json({ error: "No autorizado para borrar este costo" }, { status: 403 });
    }

    const eliminados = await prisma.costoFijo.deleteMany({ where: { id, laboratorioId: labId } });
    if (eliminados.count === 0) {
      return NextResponse.json({ error: "No autorizado o costo no encontrado" }, { status: 403 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: `Error al eliminar costo fijo: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
