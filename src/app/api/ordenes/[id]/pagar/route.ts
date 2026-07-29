import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const parseId = (id: any) => isNaN(Number(id)) ? id : Number(id);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!session || !session.user || !labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const ordenId = parseInt(resolvedParams.id, 10);
    if (isNaN(ordenId)) throw new Error("ID de orden inválido");

    const body = await req.json();

    if (!body.pagos || body.pagos.length === 0) {
      return NextResponse.json({ error: "Debe enviar al menos un método de pago." }, { status: 400 });
    }

    const ordenActual = await prisma.orden.findUnique({
      where: { id_laboratorioId: { id: ordenId, laboratorioId: labId } },
      select: {
        id: true,
        totalUSD: true,
        tasaBCV: true,
        laboratorioId: true,
        pagos: { select: { montoUSD: true } }
      }
    });

    if (!ordenActual || ordenActual.laboratorioId !== labId) {
      return NextResponse.json({ error: "Orden no encontrada o no autorizada" }, { status: 404 });
    }

    const estadoCerrada = await prisma.estadoOrden.findUnique({ where: { nombre: "CERRADA" } });
    if (!estadoCerrada) return NextResponse.json({ error: "Estado CERRADA no configurado" }, { status: 500 });

    const pagosData = body.pagos.map((p: any) => {
      const tasa = ordenActual.tasaBCV || 1;
      const montoEnUSD = p.moneda === "USD" ? p.monto : (p.monto / tasa);
      const montoEnBS = p.moneda === "BS" ? p.monto : (p.monto * tasa);

      return {
        metodoId: parseId(p.metodoId), // <-- CORREGIDO
        montoUSD: parseFloat(montoEnUSD.toFixed(2)),
        montoBS: parseFloat(montoEnBS.toFixed(2)),
        referencia: p.referencia || null,
        laboratorioId: labId
      };
    });

    const pagosPreviosUSD = ordenActual.pagos.reduce((acc: number, p: any) => acc + Number(p.montoUSD), 0);
    const sumaNuevosPagosUSD = pagosData.reduce((acc: number, p: any) => acc + p.montoUSD, 0);
    const totalDeudaUSD = Number(ordenActual.totalUSD);

    if (pagosPreviosUSD + sumaNuevosPagosUSD > totalDeudaUSD + 0.05) {
      return NextResponse.json({ 
        error: `El pago (${sumaNuevosPagosUSD} USD) excede la deuda restante de la orden (${Math.max(0, totalDeudaUSD - pagosPreviosUSD).toFixed(2)} USD).` 
      }, { status: 400 });
    }

    const ordenActualizada = await prisma.orden.update({
      where: { id_laboratorioId: { id: ordenId, laboratorioId: labId } },
      data: {
        estadoId: estadoCerrada.id,
        pagos: {
          create: pagosData
        }
      }
    });

    return NextResponse.json({ success: true, orden: ordenActualizada });
  } catch (error: any) {
    console.error("Error al procesar pago:", error);
    return NextResponse.json({ error: `Error interno al procesar el pago: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}