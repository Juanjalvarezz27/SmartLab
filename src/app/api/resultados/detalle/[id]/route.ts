import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const gzip = promisify(gzipCallback);

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

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
        laboratorioId: true,
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
            direccion: true,
            observaciones: true
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
