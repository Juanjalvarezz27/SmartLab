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
    const { nombre, unidadMedida, costoUnitarioUSD, cantidadComprada, costoTotalUSD, activo } = body;
    
    // Verificación de Tenant (Que el insumo le pertenezca a su lab)
    const insumoExistente = await prisma.insumo.findFirst({
      where: { id, laboratorioId: labId }
    });

    if (!insumoExistente) {
      return NextResponse.json({ error: "No autorizado para modificar este insumo" }, { status: 403 });
    }

    const actualizados = await prisma.insumo.updateMany({
      where: { id, laboratorioId: labId },
      data: {
        nombre,
        unidadMedida,
        costoUnitarioUSD: costoUnitarioUSD !== undefined ? Number(costoUnitarioUSD) : undefined,
        cantidadComprada: cantidadComprada !== undefined ? (cantidadComprada ? Number(cantidadComprada) : null) : undefined,
        costoTotalUSD: costoTotalUSD !== undefined ? (costoTotalUSD ? Number(costoTotalUSD) : null) : undefined,
        activo,
      },
    });

    if (actualizados.count === 0) {
      return NextResponse.json({ error: "Insumo no encontrado o acceso denegado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, count: actualizados.count });
  } catch (error: any) {
    console.error("Error al actualizar insumo:", error);
    return NextResponse.json({ error: `Error al actualizar insumo: ${error?.message || 'Desconocido'}` }, { status: 500 });
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

    const insumoExistente = await prisma.insumo.findFirst({
      where: { id, laboratorioId: labId }
    });

    if (!insumoExistente) {
      return NextResponse.json({ error: "No autorizado para borrar este insumo" }, { status: 403 });
    }

    const eliminados = await prisma.insumo.deleteMany({ where: { id, laboratorioId: labId } });
    if (eliminados.count === 0) {
      return NextResponse.json({ error: "No autorizado o insumo no encontrado" }, { status: 403 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: `Error al eliminar insumo: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
