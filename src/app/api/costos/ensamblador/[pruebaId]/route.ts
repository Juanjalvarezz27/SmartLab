import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ pruebaId: string }> }) {
  try {
    const { pruebaId } = await params;
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo") || "prueba";

    const [costosFijos, config] = await Promise.all([
      prisma.costoFijo.findMany({ where: { activo: true } }),
      prisma.configuracionLaboratorio.findFirst()
    ]);

    const totalCostosFijos = costosFijos.reduce((sum, c) => sum + c.montoMensualUSD, 0);
    const volumenMensual = config?.volumenPruebasMensualEstimado || 1000;
    const costoFijoPorPrueba = volumenMensual > 0 ? totalCostosFijos / volumenMensual : 0;

    if (tipo === "paquete") {
      const paquete = await prisma.subcategoriaPrueba.findUnique({
        where: { id: pruebaId },
        include: {
          insumosAsociados: {
            include: {
              insumo: true,
            }
          }
        }
      });

      if (!paquete) return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });

      return NextResponse.json({
        prueba: {
          id: paquete.id,
          nombre: paquete.nombre,
          codigo: "PAQ", // Puedes generar un código dinámico si lo prefieres
          precioUSD: paquete.precioUSD,
          tipo: "paquete"
        },
        receta: paquete.insumosAsociados,
        costoFijoPorPrueba
      });
    } else {
      const prueba = await prisma.prueba.findUnique({
        where: { id: pruebaId },
        include: {
          insumosAsociados: {
            include: {
              insumo: true,
            }
          }
        }
      });

      if (!prueba) return NextResponse.json({ error: "Prueba no encontrada" }, { status: 404 });

      return NextResponse.json({
        prueba: {
          id: prueba.id,
          nombre: prueba.nombre,
          codigo: prueba.codigo,
          precioUSD: prueba.precioUSD,
          tipo: "prueba"
        },
        receta: prueba.insumosAsociados,
        costoFijoPorPrueba
      });
    }
  } catch (error: any) {
    console.error("Error en ensamblador:", error);
    return NextResponse.json({ error: `Error interno: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ pruebaId: string }> }) {
  try {
    const { pruebaId } = await params;
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo") || "prueba";
    
    if (body.receta && Array.isArray(body.receta)) {
      if (tipo === "paquete") {
        await prisma.subcategoriaInsumo.deleteMany({
          where: { subcategoriaId: pruebaId }
        });

        if (body.receta.length > 0) {
          const dataInsert = body.receta.map((item: any) => ({
            subcategoriaId: pruebaId,
            insumoId: item.insumoId,
            cantidadUsada: Number(item.cantidadUsada)
          }));
          await prisma.subcategoriaInsumo.createMany({
            data: dataInsert
          });
        }
      } else {
        await prisma.pruebaInsumo.deleteMany({
          where: { pruebaId }
        });

        if (body.receta.length > 0) {
          const dataInsert = body.receta.map((item: any) => ({
            pruebaId,
            insumoId: item.insumoId,
            cantidadUsada: Number(item.cantidadUsada)
          }));
          await prisma.pruebaInsumo.createMany({
            data: dataInsert
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al actualizar receta:", error);
    return NextResponse.json({ error: `Error interno: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
