import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const gzip = promisify(gzipCallback);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const pacienteId = resolvedParams.id;

    if (!pacienteId) {
      return NextResponse.json({ error: "ID de paciente requerido" }, { status: 400 });
    }

    const pacienteHistorial = await prisma.paciente.findFirst({
      where: { id: pacienteId, laboratorioId: labId },
      include: {
        ordenes: {
          where: { laboratorioId: labId },
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
      return NextResponse.json({ error: "Paciente no encontrado o no autorizado" }, { status: 404 });
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
