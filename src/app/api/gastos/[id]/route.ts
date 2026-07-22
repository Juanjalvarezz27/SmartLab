import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
    
    if (!id) {
      return NextResponse.json({ error: "ID de gasto inválido." }, { status: 400 });
    }

    await prisma.gasto.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Gasto eliminado correctamente" });
  } catch (error: any) {
    console.error("Error al eliminar gasto:", error);
    return NextResponse.json({ error: `Error interno al eliminar el gasto: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
