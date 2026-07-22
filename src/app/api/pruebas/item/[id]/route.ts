import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; 
    const body = await req.json();
    
    // Si solo enviamos el estado "activa" (Botón de inhabilitar)
    if (body.activa !== undefined && Object.keys(body).length === 1) {
      const actualizado = await prisma.prueba.update({
        where: { id },
        data: { activa: body.activa }
      });
      return NextResponse.json(actualizado);
    }

    // Si enviamos los datos completos (Edición individual)
    const actualizado = await prisma.prueba.update({
      where: { id },
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