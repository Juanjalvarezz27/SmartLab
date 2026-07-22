import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";
const gzip = promisify(gzipCallback);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const pacienteId = resolvedParams.id;

    if (!pacienteId) {
      return NextResponse.json({ error: "ID de paciente requerido" }, { status: 400 });
    }

    const pacienteHistorial = await prisma.paciente.findUnique({
      where: { id: pacienteId },
      include: {
        ordenes: {
          orderBy: {
            fechaCreacion: 'desc' 
          },
          select: {
            id: true,
            fechaCreacion: true,
            resultadosCompletados: true,
            estado: true,
            creadoPor: { select: { nombre: true } },
            detalles: {
              include: {
                prueba: { 
                  select: { 
                    nombre: true, 
                    subcategoria: { 
                      select: { nombre: true, esPaquete: true } 
                    } 
                  } 
                }
              }
            }
          }
        }
      }
    });

    if (!pacienteHistorial) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    const compressedData = await gzip(Buffer.from(JSON.stringify(pacienteHistorial), 'utf-8'));
    return new NextResponse(compressedData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      }
    });
  } catch (error: any) {
    console.error(`Error al obtener historial del paciente:`, error);
    return NextResponse.json({ error: `Error interno al buscar historial: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
