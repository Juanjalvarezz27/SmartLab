import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../app/api/auth/[...nextauth]/route";

// Utilidad vital: Si el ID es numérico lo convierte, si es texto (CUID/UUID) lo deja intacto.
const parseId = (id: any) => isNaN(Number(id)) ? id : Number(id);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autorizado. Inicie sesión." }, { status: 401 });
    }

    const usuarioSesion = await prisma.usuario.findUnique({ where: { correo: session.user.email } });
    if (!usuarioSesion) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const usuarioId = usuarioSesion.id;
    const body = await req.json();

    if (!body.pacienteId) {
      return NextResponse.json({ error: "El ID del paciente es obligatorio" }, { status: 400 });
    }
    if (!body.pruebas || body.pruebas.length === 0) {
      return NextResponse.json({ error: "La orden debe tener al menos una prueba" }, { status: 400 });
    }

    const estado = await prisma.estadoOrden.findUnique({ where: { nombre: body.estado } });
    if (!estado) return NextResponse.json({ error: `El estado ${body.estado} no está en la BD` }, { status: 400 });

    const tiposDescuento = await prisma.tipoDescuento.findMany();
    const getIdDescuento = (nombreStr: string) => tiposDescuento.find(t => t.nombre === nombreStr)?.id || null;

    const detallesData = body.pruebas.map((p: any) => ({
      pruebaId: parseId(p.pruebaId),
      cantidad: p.cantidad,
      precioCongeladoUSD: p.precioCongelado,
      descuento: p.descuentoInd || 0,
      tipoDescuentoId: p.descuentoInd > 0 ? getIdDescuento(p.tipoDescuentoInd) : null,
    }));

    const tasa = body.tasaBCV;
    const pagosData = body.pagos && body.pagos.length > 0 ? body.pagos.map((p: any) => {
      const montoEnUSD = p.moneda === "USD" ? p.monto : (p.monto / tasa);
      const montoEnBS = p.moneda === "BS" ? p.monto : (p.monto * tasa);

      return {
        metodoId: parseId(p.metodoId),
        montoUSD: parseFloat(montoEnUSD.toFixed(2)),
        montoBS: parseFloat(montoEnBS.toFixed(2)),
        referencia: p.referencia || null,
        fechaPago: new Date()
      };
    }) : [];

    const sumaPagosUSD = pagosData.reduce((acc: number, p: any) => acc + p.montoUSD, 0);
    if (sumaPagosUSD > Number(body.totalUSD) + 0.05) {
      return NextResponse.json({ error: `La suma de los pagos en USD (${sumaPagosUSD}) no puede exceder el total de la orden (${body.totalUSD})` }, { status: 400 });
    }

    // Auto-cierre de órdenes y protección contra cierre falso
    let estadoFinalId = estado.id;
    const esPagoCompleto = sumaPagosUSD >= (Number(body.totalUSD) - 0.02);
    const estadoCerrada = await prisma.estadoOrden.findUnique({ where: { nombre: "CERRADA" } });

    if (esPagoCompleto && estadoCerrada) {
      estadoFinalId = estadoCerrada.id; 
    } else if (estado.nombre === "CERRADA" && !esPagoCompleto) {
      return NextResponse.json({ error: "No se puede cerrar una orden con saldo pendiente." }, { status: 400 });
    }

    const nuevaOrden = await prisma.orden.create({
      data: {
        pacienteId: parseId(body.pacienteId),
        usuarioId: usuarioId,
        estadoId: estadoFinalId,
        subtotalUSD: Number(Number(body.subtotalUSD).toFixed(2)),
        descuentoGeneral: body.descuentoGeneral || 0,
        tipoDescuentoId: body.descuentoGeneral > 0 ? getIdDescuento(body.tipoDescuentoGral) : null,
        totalUSD: Number(Number(body.totalUSD).toFixed(2)),
        totalBS: Number(Number(body.totalBS).toFixed(2)),
        tasaBCV: body.tasaBCV,
        fechaCreacion: new Date(),
        detalles: {
          create: detallesData
        },
        serviciosExtra: body.serviciosExtra && body.serviciosExtra.length > 0 ? {
          create: body.serviciosExtra.map((s: any) => ({
            servicioId: parseId(s.servicioId),
            cantidad: s.cantidad || 1,
            precioCongeladoUSD: s.precioCongelado,
          }))
        } : undefined,
        pagos: pagosData.length > 0 ? {
          create: pagosData
        } : undefined
      }
    });

    return NextResponse.json(nuevaOrden, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear la orden:", error);
    return NextResponse.json({ error: `Error interno al guardar la orden: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}