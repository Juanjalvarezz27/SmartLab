import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
    
    if (!id) {
      return NextResponse.json({ error: "ID de gasto inválido." }, { status: 400 });
    }

    const gastoExistente = await prisma.gasto.findFirst({
      where: { id, laboratorioId: labId }
    });

    if (!gastoExistente) {
      return NextResponse.json({ error: "No autorizado para borrar este gasto" }, { status: 403 });
    }

    const deletedResult = await prisma.gasto.deleteMany({
      where: { id, laboratorioId: labId }
    });

    if (deletedResult.count === 0) {
      return NextResponse.json({ error: "Gasto no encontrado o acceso denegado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Gasto eliminado correctamente" });
  } catch (error: any) {
    console.error("Error al eliminar gasto:", error);
    return NextResponse.json({ error: `Error interno al eliminar el gasto: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
