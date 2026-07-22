import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";
const gzip = promisify(gzipCallback);

export const revalidate = 15;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dias = parseInt(searchParams.get("dias") || "7", 10);
    const busqueda = searchParams.get("busqueda") || "";
    const fechaFiltro = searchParams.get("fecha") || "";

    const whereClause: any = {
      estado: { nombre: { not: "ANULADA" } }
    };

    if (fechaFiltro) {
      const fechaInicio = new Date(`${fechaFiltro}T00:00:00.000-04:00`);
      const fechaFin = new Date(`${fechaFiltro}T23:59:59.999-04:00`);
      whereClause.fechaCreacion = { gte: fechaInicio, lte: fechaFin };
    } else if (busqueda) {
      const bNum = parseInt(busqueda, 10);
      whereClause.OR = [
        { paciente: { nombreCompleto: { contains: busqueda, mode: "insensitive" } } },
        { paciente: { cedula: { contains: busqueda, mode: "insensitive" } } }
      ];
      if (!isNaN(bNum)) {
        whereClause.OR.push({ id: bNum });
      }
    } else {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - dias);
      whereClause.fechaCreacion = { gte: fechaLimite };
    }

    // SELECT ESTRICTO: solo los datos mínimos para poblar las tarjetas
    const ordenes = await prisma.orden.findMany({
      where: whereClause,
      take: busqueda ? 50 : undefined,
      select: {
        id: true,
        fechaCreacion: true,
        resultadosCompletados: true,
        totalUSD: true,
        totalBS: true,
        paciente: {
          select: {
            id: true,
            nombreCompleto: true,
            cedula: true,
            telefono: true,
          }
        },
        estado: { select: { nombre: true } },
        // Solo para calcular tabStatus y los chips del resumen — datos mínimos
        detalles: {
          select: {
            id: true,
            cantidad: true,
            resultado: {
              select: {
                firmado: true,
                // Solo para calcular si hay valores ingresados
                valores: { select: { valorIngresado: true } },
                valoresReferencia: true
              }
            },
            prueba: {
              select: {
                id: true,
                nombre: true,
                valoresReferencia: true,
                subcategoria: {
                  select: {
                    id: true,
                    nombre: true,
                    esPaquete: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    // Calcular tabStatus en el servidor para cada orden
    const ordenesConStatus = ordenes.map((orden) => {
      const tieneResultadosFaltantes = orden.detalles.some((d) => {
        if (!d.resultado) return true;
        if (!d.resultado.valores || d.resultado.valores.length < d.cantidad) return true;
        if (d.resultado.valores.some((v) => !v.valorIngresado || v.valorIngresado.trim() === '')) return true;
        if (!d.prueba.valoresReferencia && (!d.resultado.valoresReferencia || d.resultado.valoresReferencia.trim() === '')) return true;
        return false;
      });

      let tabStatus: 'PENDIENTES' | 'POR_VALIDAR' | 'COMPLETADOS';
      if (tieneResultadosFaltantes) {
        tabStatus = 'PENDIENTES';
      } else if (!orden.resultadosCompletados) {
        tabStatus = 'POR_VALIDAR';
      } else {
        tabStatus = 'COMPLETADOS';
      }

      // Resumen de exámenes solo para los chips visuales de la tarjeta
      const examenesResumen: { id: string; nombre: string; esPaquete: boolean }[] = [];
      orden.detalles.forEach((det) => {
        const isPaquete = det.prueba?.subcategoria?.esPaquete;
        if (isPaquete) {
          const subcatId = det.prueba.subcategoria!.id;
          if (!examenesResumen.find(i => i.esPaquete && i.id === subcatId)) {
            examenesResumen.push({ id: subcatId, nombre: det.prueba.subcategoria!.nombre, esPaquete: true });
          }
        } else {
          examenesResumen.push({ id: det.prueba.id, nombre: det.prueba.nombre, esPaquete: false });
        }
      });

      // Devolver solo lo que la tarjeta necesita — sin los detalles pesados
      return {
        id: orden.id,
        fechaCreacion: orden.fechaCreacion,
        resultadosCompletados: orden.resultadosCompletados,
        totalUSD: orden.totalUSD,
        totalBS: orden.totalBS,
        paciente: orden.paciente,
        estado: orden.estado,
        tabStatus,
        examenesResumen
      };
    });

    const payload = Buffer.from(JSON.stringify(ordenesConStatus));
    const compressed = await gzip(payload);

    return new NextResponse(compressed, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
      }
    });
  } catch (error: any) {
    console.error("Error al obtener lista de resultados:", error);
    return NextResponse.json({ error: `Error interno al cargar la lista: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}