import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pacienteId = searchParams.get("pacienteId");
    const cedula = searchParams.get("cedula");

    if (!pacienteId && !cedula) {
      return NextResponse.json({ error: "Debe proporcionar pacienteId o cedula" }, { status: 400 });
    }

    let finalPacienteId: string = "";

    if (pacienteId) {
      finalPacienteId = pacienteId;
    } else if (cedula) {
      // Buscar el paciente por cédula directamente
      const paciente = await prisma.paciente.findFirst({
        where: { cedula: cedula.trim() },
        select: { id: true }
      });
      if (!paciente) {
        // No existe el paciente, no hay órdenes posibles
        return NextResponse.json({ tieneOrdenes: false, ordenes: [] });
      }
      finalPacienteId = String(paciente.id);
    }

    // Calcular rangos del día de hoy en Venezuela
    const today = new Date();
    const tzOffset = -4 * 60;
    const localToday = new Date(today.getTime() + (today.getTimezoneOffset() + tzOffset) * 60000);
    const dateString = localToday.toISOString().split("T")[0];
    const fechaInicio = new Date(`${dateString}T00:00:00.000-04:00`);
    const fechaFin = new Date(`${dateString}T23:59:59.999-04:00`);

    const includeData = {
      estado: true,
      tipoDescuento: true,
      detalles: {
        include: {
          tipoDescuento: true,
          prueba: {
            include: {
              subcategoria: {
                include: { categoria: true }
              }
            }
          }
        }
      },
      serviciosExtra: {
        include: { servicio: true }
      },
      pagos: {
        include: { metodo: true }
      },
      creadoPor: true
    };

    // Ejecutar ambas consultas en paralelo
    const [ordenesAbiertas, ordenesHoy] = await Promise.all([
      prisma.orden.findMany({
        where: {
          pacienteId: finalPacienteId,
          estado: { nombre: "ABIERTA" }
        },
        include: includeData
      }),
      prisma.orden.findMany({
        where: {
          pacienteId: finalPacienteId,
          fechaCreacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        },
        include: includeData
      })
    ]);

    // Combinar sin duplicados por ID
    const ordenesUnicas = new Map();
    ordenesAbiertas.forEach((o: any) => ordenesUnicas.set(o.id, o));
    ordenesHoy.forEach((o: any) => ordenesUnicas.set(o.id, o));

    // Ordenar por id descendente
    const ordenesConflictivas = Array.from(ordenesUnicas.values()).sort((a, b) => b.id - a.id);

    return NextResponse.json({
      tieneOrdenes: ordenesConflictivas.length > 0,
      ordenes: ordenesConflictivas,
    });
  } catch (error: any) {
    console.error("Error al verificar órdenes:", error);
    return NextResponse.json({ error: `Error interno: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
