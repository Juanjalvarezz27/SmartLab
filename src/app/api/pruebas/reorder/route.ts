import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    
    if (!Array.isArray(body.pruebas)) {
      return NextResponse.json({ error: "Formato incorrecto. Se esperaba un array de pruebas." }, { status: 400 });
    }

    // Actualizar en lote usando transacciones
    const updates = body.pruebas.map((p: any) => 
      prisma.prueba.update({
        where: { id: p.id },
        data: { ordenVisual: p.ordenVisual }
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ message: "Orden actualizado correctamente" });
  } catch (error: any) {
    return NextResponse.json({ error: `Error al reordenar las pruebas: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
