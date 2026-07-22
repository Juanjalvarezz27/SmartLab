import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";
const gzip = promisify(gzipCallback);

export const revalidate = 15;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fechaParam = searchParams.get("fecha");

    if (!fechaParam) {
      return NextResponse.json({ error: "Debe proporcionar una fecha" }, { status: 400 });
    }

    const fechaInicio = new Date(`${fechaParam}T00:00:00.000-04:00`);
    const fechaFin = new Date(`${fechaParam}T23:59:59.999-04:00`);

    // Solo los campos que la tabla y los KPIs necesitan para renderizarse
    const ordenes = await prisma.orden.findMany({
      where: {
        fechaCreacion: { gte: fechaInicio, lte: fechaFin }
      },
      select: {
        id: true,
        fechaCreacion: true,
        totalUSD: true,
        totalBS: true,
        tasaBCV: true,
        paciente: {
          select: {
            nombreCompleto: true,
            cedula: true,
            telefono: true // Necesario para el tooltip de WhatsApp y el modal
          }
        },
        estado: { select: { nombre: true } },
        // Conteo liviano para la columna "Pruebas"
        _count: { select: { detalles: true } },
        // Pagos previos para calcular la deuda restante al abrir ModalProcesarPago
        pagos: {
          select: {
            montoUSD: true
          }
        }
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    const payload = JSON.stringify(ordenes);
    const compressed = await gzip(Buffer.from(payload));

    return new Response(compressed, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
        'Cache-Control': 'no-store',
      }
    });
  } catch (error: any) {
    console.error("Error al obtener lista diaria:", error);
    return NextResponse.json({ error: `Error al cargar las órdenes: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}