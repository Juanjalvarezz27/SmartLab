import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Editar paquete (nombre y/o ítems)
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
    const { nombre, items } = body;

    // Verificamos propiedad del paquete
    const paqueteExistente = await prisma.paqueteInsumo.findFirst({
      where: { id, laboratorioId: labId }
    });
    if (!paqueteExistente) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    // Transacción atómica para evitar inconsistencias
    const actualizado = await prisma.$transaction(async (tx) => {
      // Actualizar nombre si viene
      if (nombre) {
        await tx.paqueteInsumo.update({
          where: { id },
          data: { nombre: nombre.trim().toUpperCase() },
        });
      }

      // Reemplazar ítems si vienen
      if (items && Array.isArray(items)) {
        await tx.paqueteInsumoItem.deleteMany({ where: { paqueteId: id, laboratorioId: labId } });

        if (items.length > 0) {
          await tx.paqueteInsumoItem.createMany({
            data: items.map((item: any) => ({
              paqueteId: id,
              insumoId: Number(item.insumoId),
              cantidadUsada: Number(item.cantidadUsada),
              laboratorioId: labId
            })),
          });
        }
      }

      // Retornar paquete actualizado dentro de la transacción
      return tx.paqueteInsumo.findUnique({
        where: { id },
        include: { items: { include: { insumo: true } } },
      });
    });

    return NextResponse.json(actualizado);
  } catch (error: any) {
    console.error("Error al actualizar paquete:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: `Ya existe un paquete con ese nombre: ${error?.message || 'Desconocido'}` }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al actualizar el paquete" }, { status: 500 });
  }
}

// Eliminar paquete
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    await prisma.paqueteInsumo.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al eliminar paquete:", error);
    return NextResponse.json({ error: `Error al eliminar el paquete: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
