import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    
    if (!Array.isArray(body.pruebas)) {
      return NextResponse.json({ error: "Formato incorrecto. Se esperaba un array de pruebas." }, { status: 400 });
    }

    // Actualizar en lote usando transacciones con protección de tenant
    const updates = body.pruebas.map((p: any) => 
      prisma.prueba.update({
        where: { id_laboratorioId: { id: p.id, laboratorioId: labId } },
        data: { ordenVisual: p.ordenVisual }
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ message: "Orden actualizado correctamente" });
  } catch (error: any) {
    return NextResponse.json({ error: `Error al reordenar las pruebas: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
