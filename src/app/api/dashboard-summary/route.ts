import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";

const gzip = promisify(gzipCallback);

export const revalidate = 15; // Cache por 15 segundos

export async function GET() {
  try {
    // 1. Órdenes Pendientes
    const pendientesPromise = prisma.orden.findMany({
      where: {
        estado: { nombre: { in: ["BORRADOR", "PENDIENTE"] } }
      },
      take: 50,
      orderBy: { fechaCreacion: "desc" },
      include: {
        paciente: { select: { nombreCompleto: true, cedula: true } },
        estado: true,
      }
    });

    // 2. Resultados Pendientes
    const resultadosPromise = prisma.orden.findMany({
      where: {
        resultadosCompletados: false,
        estado: { nombre: { not: "ANULADA" } }
      },
      take: 20, // Solo necesitamos 20 para el dashboard
      orderBy: { fechaCreacion: "desc" },
      include: {
        paciente: { select: { nombreCompleto: true, cedula: true } },
        estado: true,
        detalles: {
          include: {
            prueba: { select: { nombre: true, codigo: true, subcategoria: { select: { nombre: true, categoria: { select: { nombre: true } } } } } },
            resultado: { select: { id: true, firmado: true } }
          }
        }
      }
    });

    // 3. Cierre Anterior
    const cierreAnteriorPromise = (async () => {
      const ultimoCierre = await prisma.cierreCaja.findFirst({
        orderBy: { fechaCierre: 'desc' }
      });
      const primerOrdenPendiente = await prisma.orden.findFirst({
        where: { estado: { nombre: { not: 'ANULADA' } } },
        orderBy: { fechaCreacion: 'asc' }
      });

      if (!primerOrdenPendiente) return { faltaCierreAnterior: false };

      const hoy = new Date();
      // Ajustar a zona horaria de Caracas (UTC-4)
      hoy.setHours(hoy.getHours() - 4);
      const fechaHoyStr = hoy.toISOString().split('T')[0];
      
      let faltaCierre = false;
      let fechaFaltante = "";

      if (!ultimoCierre) {
        const fechaOrden = new Date(primerOrdenPendiente.fechaCreacion);
        fechaOrden.setHours(fechaOrden.getHours() - 4);
        const fechaOrdenStr = fechaOrden.toISOString().split('T')[0];
        
        if (fechaOrdenStr < fechaHoyStr) {
          faltaCierre = true;
          fechaFaltante = fechaOrdenStr;
        }
      } else {
        const fechaCierreDate = new Date(ultimoCierre.fechaCierre);
        fechaCierreDate.setHours(fechaCierreDate.getHours() - 4);
        const fechaCierreStr = fechaCierreDate.toISOString().split('T')[0];
        
        const mananaDelCierre = new Date(ultimoCierre.fechaCierre);
        mananaDelCierre.setDate(mananaDelCierre.getDate() + 1);
        mananaDelCierre.setHours(mananaDelCierre.getHours() - 4);
        const fechaSiguienteStr = mananaDelCierre.toISOString().split('T')[0];

        if (fechaSiguienteStr < fechaHoyStr) {
          const hayOrdenes = await prisma.orden.findFirst({
            where: {
              fechaCreacion: {
                gte: new Date(fechaSiguienteStr + "T04:00:00.000Z"),
                lt: new Date(fechaHoyStr + "T04:00:00.000Z")
              },
              estado: { nombre: { not: 'ANULADA' } }
            }
          });

          if (hayOrdenes) {
            faltaCierre = true;
            fechaFaltante = fechaSiguienteStr;
          }
        }
      }

      return { faltaCierreAnterior: faltaCierre, fechaFaltante };
    })();

    // Ejecutamos las 3 promesas en paralelo para mayor velocidad
    const [ordenesPendientes, ordenesPendientesResultados, cierreAnterior] = await Promise.all([
      pendientesPromise,
      resultadosPromise,
      cierreAnteriorPromise
    ]);

    const payload = {
      ordenesPendientes,
      ordenesPendientesResultados,
      cierreAnterior
    };

    const compressed = await gzip(Buffer.from(JSON.stringify(payload), 'utf-8'));

    return new NextResponse(compressed, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      }
    });

  } catch (error) {
    console.error("Error en dashboard-summary:", error);
    return NextResponse.json({ error: "Error al obtener resumen del dashboard" }, { status: 500 });
  }
}
