import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";
const gzip = promisify(gzipCallback);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const q = searchParams.get("q") || "";
    const fecha = searchParams.get("fecha") || "";

    const skip = (page - 1) * limit;

    const whereClause: any = {};
    const AND = [];

    // Búsqueda por nombre, cédula, o ID de orden
    if (q) {
      const qNum = parseInt(q, 10);
      const orConditions: any[] = [
        { nombreCompleto: { contains: q, mode: "insensitive" } },
        { cedula: { contains: q, mode: "insensitive" } },
      ];

      if (!isNaN(qNum)) {
        orConditions.push({
          ordenes: {
            some: { id: qNum }
          }
        });
      }
      
      AND.push({ OR: orConditions });
    }

    // Filtrado por fecha
    if (fecha) {
      const fechaInicio = new Date(`${fecha}T00:00:00.000-04:00`);
      const fechaFin = new Date(`${fecha}T23:59:59.999-04:00`);
      
      AND.push({
        ordenes: {
          some: {
            fechaCreacion: {
              gte: fechaInicio,
              lte: fechaFin
            }
          }
        }
      });
    }

    if (AND.length > 0) {
      whereClause.AND = AND;
    }

    // Ejecutar queries en paralelo: Total de registros y la página actual
    const [totalPacientes, pacientes] = await Promise.all([
      prisma.paciente.count({ where: whereClause }),
      prisma.paciente.findMany({
        where: whereClause,
        orderBy: { nombreCompleto: 'asc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { ordenes: true }
          },
          // Extraemos solo la última orden para mostrar la fecha de última visita
          ordenes: {
            orderBy: { fechaCreacion: 'desc' },
            take: 1,
            select: { id: true, fechaCreacion: true }
          }
        }
      })
    ]);

    // Adaptar el formato para que el frontend pueda leer .ordenes como lo hacía antes
    // Pero en este caso, .ordenes solo tendrá 0 o 1 elemento (la última). 
    // Para el conteo, usaremos paciente._count.ordenes
    const pacientesAdaptados = pacientes.map(p => ({
      ...p,
      totalVisitas: p._count.ordenes
    }));

    const payload = {
      data: pacientesAdaptados,
      meta: {
        total: totalPacientes,
        page,
        limit,
        totalPages: Math.ceil(totalPacientes / limit)
      }
    };

    const compressedData = await gzip(Buffer.from(JSON.stringify(payload), 'utf-8'));
    return new NextResponse(compressedData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      }
    });
  } catch (error: any) {
    console.error("Error al obtener el directorio de pacientes:", error);
    return NextResponse.json({ error: `Error interno del servidor: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}