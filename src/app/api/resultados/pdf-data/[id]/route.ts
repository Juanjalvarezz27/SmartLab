import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const gzip = promisify(gzipCallback);

export async function GET(request: Request, { params }: { params: any }) {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const ordenId = parseInt(resolvedParams.id, 10);

    if (isNaN(ordenId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const orden = await prisma.orden.findUnique({
      where: { id: ordenId },
      select: {
        id: true,
        laboratorioId: true,
        fechaCreacion: true,
        resultadosCompletados: true,
        paciente: {
          select: {
            nombreCompleto: true, cedula: true, fechaNacimiento: true,
            esBebe: true, sexo: true, telefono: true, correo: true,
            direccion: true, observaciones: true
          }
        },
        estado: { select: { nombre: true } },
        creadoPor: { select: { nombre: true } },
        laboratorio: {
          select: { nombre: true, correo: true, telefono: true, logoBase64: true, direccion: true, rif: true }
        },
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

    if (!orden || orden.laboratorioId !== labId) {
      return NextResponse.json({ error: "Orden no encontrada o no autorizada" }, { status: 404 });
    }

    if (!orden.resultadosCompletados) {
      return NextResponse.json({ error: "Los resultados aún no están listos" }, { status: 403 });
    }

    const compressed = await gzip(Buffer.from(JSON.stringify(orden), 'utf-8'));
    return new NextResponse(compressed, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      }
    });
  } catch (error: any) {
    console.error("Error al obtener datos del PDF:", error);
    return NextResponse.json({ error: `Error interno del servidor: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
