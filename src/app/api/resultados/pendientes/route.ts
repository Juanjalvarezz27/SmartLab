import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";
const gzip = promisify(gzipCallback);

export const revalidate = 15;

export async function GET() {
  try {
    const ordenes = await prisma.orden.findMany({
      where: {
        resultadosCompletados: false,
        estado: { nombre: { not: "ANULADA" } }
      },
      take: 50,
      select: {
        id: true,
        fechaCreacion: true,
        paciente: {
          select: { nombreCompleto: true, cedula: true }
        },
        estado: { select: { nombre: true } },
        detalles: {
          select: {
            id: true,
            prueba: {
              select: {
                nombre: true,
                codigo: true,
                subcategoria: {
                  select: {
                    nombre: true,
                    esPaquete: true,
                    categoria: { select: { nombre: true } }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { fechaCreacion: 'asc' }
    });

    const compressed = await gzip(Buffer.from(JSON.stringify(ordenes), 'utf-8'));
    return new NextResponse(compressed, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      }
    });
  } catch (error: any) {
    console.error("Error al obtener pendientes:", error);
    return NextResponse.json({ error: `Error interno al cargar pendientes: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
