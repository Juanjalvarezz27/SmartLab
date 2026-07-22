import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";
const gzip = promisify(gzipCallback);

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ordenId = parseInt(id, 10);
    if (isNaN(ordenId)) {
      return NextResponse.json({ error: "ID de orden inválido" }, { status: 400 });
    }

    // SELECT COMPLETO: todos los datos que el modal de transcripción necesita
    const orden = await prisma.orden.findUnique({
      where: { id: ordenId },
      select: {
        id: true,
        fechaCreacion: true,
        resultadosCompletados: true,
        totalUSD: true,
        totalBS: true,
        paciente: {
          select: {
            nombreCompleto: true,
            cedula: true,
            sexo: true,
            esBebe: true,
            fechaNacimiento: true,
            telefono: true,
            correo: true,
            observaciones: true
          }
        },
        estado: { select: { nombre: true } },
        creadoPor: { select: { nombre: true } },
        detalles: {
          select: {
            id: true,
            cantidad: true,
            resultado: {
              select: {
                id: true,
                firmado: true,
                observaciones: true,
                fechaProcesado: true,
                valoresReferencia: true,
                valores: { select: { id: true, pruebaId: true, valorIngresado: true } },
                procesadoPor: {
                  select: { id: true, nombre: true, firmaUrl: true, mpps: true, col: true }
                }
              }
            },
            prueba: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
                unidades: true,
                valoresReferencia: true,
                opcionesPredefinidas: true,
                ordenVisual: true,
                categoriaVisual: true,
                subcategoriaVisual: true,
                subcategoria: {
                  select: {
                    id: true,
                    nombre: true,
                    esPaquete: true,
                    categoria: { select: { nombre: true } }
                  }
                }
              }
            }
          }
        },
        notasSubcategoria: { select: { subcategoria: true, nota: true } }
      }
    });

    if (!orden) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const payload = Buffer.from(JSON.stringify(orden));
    const compressed = await gzip(payload);

    return new NextResponse(compressed, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
      }
    });
  } catch (error: any) {
    console.error("Error al obtener detalle de orden:", error);
    return NextResponse.json({ error: `Error interno al cargar el detalle: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
