import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";
const gzip = promisify(gzipCallback);
import { getCaracasTodayBounds, getCaracasBoundsForDate, formatToCaracasDateString, getCaracasDateString } from "../../../lib/dateUtils";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export const revalidate = 15;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tasaParam = searchParams.get("tasa");
    const tasaBCV = tasaParam ? parseFloat(tasaParam) : 1;
    const periodo = searchParams.get("periodo") || "HOY";
    const inicioStr = searchParams.get("inicio");
    const finStr = searchParams.get("fin");

    const cierreId = searchParams.get("cierreId");

    let fechaInicio: Date;
    let fechaFin: Date;
    let tituloCaja = "Cierre Diario";
    let fechaTarget = "";
    let esAtrasado = false;
    let oldestPendingOrder: any = null;
    let tasaDelDiaFija: number | null = null;
    let observacionesCierre: string | null = null;
    let cierreEspecificoObj: any = null;

    if (cierreId) {
      const cierreEspecifico = await prisma.cierreCaja.findUnique({ where: { id: cierreId } });
      if (!cierreEspecifico) throw new Error("Cierre no encontrado");
      cierreEspecificoObj = cierreEspecifico;
      fechaInicio = cierreEspecifico.fechaApertura;
      fechaFin = cierreEspecifico.fechaCierre;
      tituloCaja = `Cierre del ${fechaFin.toLocaleDateString("es-VE", { timeZone: "America/Caracas" })}`;
      fechaTarget = fechaFin.toISOString();
      tasaDelDiaFija = Number(cierreEspecifico.tasaBCV) || null;
      observacionesCierre = cierreEspecifico.observaciones;
    } else if (periodo === "CUSTOM" && inicioStr && finStr) {
      fechaInicio = new Date(`${inicioStr}T00:00:00`);
      fechaFin = new Date(`${finStr}T23:59:59`);
      tituloCaja = `Cierre (${inicioStr} al ${finStr})`;
      fechaTarget = inicioStr;
    } else {
      const ultimoCierre = await prisma.cierreCaja.findFirst({
        orderBy: { fechaCierre: 'desc' }
      });
      
      oldestPendingOrder = await prisma.orden.findFirst({
        where: {
          estado: { nombre: { not: "ANULADA" } },
          ...(ultimoCierre ? { fechaCreacion: { gt: ultimoCierre.fechaCierre } } : {})
        },
        orderBy: { fechaCreacion: 'asc' }
      });

      if (oldestPendingOrder) {
        let targetDate = new Date(oldestPendingOrder.fechaCreacion);
        if (ultimoCierre) {
           const uCDateStr = formatToCaracasDateString(ultimoCierre.fechaCierre);
           const targetDateStr = formatToCaracasDateString(targetDate);
           if (targetDateStr <= uCDateStr) {
               targetDate = new Date(ultimoCierre.fechaCierre);
               targetDate.setDate(targetDate.getDate() + 1);
           }
        }
        
        fechaTarget = formatToCaracasDateString(targetDate);
        const bounds = getCaracasBoundsForDate(fechaTarget);
        
        fechaInicio = ultimoCierre ? ultimoCierre.fechaCierre : bounds.inicio;
        fechaFin = bounds.fin;
        
        const todayString = getCaracasDateString();
        if (fechaTarget !== todayString && fechaTarget < todayString) {
          esAtrasado = true;
          tituloCaja = `Cierre Atrasado`;
        } else {
          tituloCaja = "Cierre de Hoy";
        }
      } else {
        const todayString = getCaracasDateString();
        fechaTarget = todayString;
        const bounds = getCaracasTodayBounds();
        const ultimoCierre = await prisma.cierreCaja.findFirst({ orderBy: { fechaCierre: 'desc' } });
        fechaInicio = ultimoCierre ? ultimoCierre.fechaCierre : bounds.inicio;
        fechaFin = bounds.fin;
        tituloCaja = "Cierre de Hoy";
      }
    }

    const cierreDeHoy = await prisma.cierreCaja.findFirst({
      where: { fechaCierre: { gt: fechaInicio, lte: fechaFin } }
    });
    const yaCerroHoy = !!cierreDeHoy;
    if (cierreDeHoy && !observacionesCierre) {
      observacionesCierre = cierreDeHoy.observaciones;
    }

    const historialCierres = await prisma.cierreCaja.findMany({
      orderBy: { fechaCierre: 'desc' },
      take: 30,
      select: {
        id: true,
        fechaApertura: true,
        fechaCierre: true,
        totalCalculadoUSD: true,
        totalCalculadoBS: true,
        descuadreUSD: true,
        tasaBCV: true,
        observaciones: true,
        realizadoPor: { select: { nombre: true } }
      }
    });

    let orderTimeFilter: any = { lte: fechaFin };
    if (cierreId) {
        orderTimeFilter.gt = fechaInicio;
    } else if (periodo === "CUSTOM" && inicioStr && finStr) {
        orderTimeFilter.gte = fechaInicio;
    } else {
        const ultimoCierre = await prisma.cierreCaja.findFirst({ orderBy: { fechaCierre: 'desc' } });
        if (ultimoCierre) orderTimeFilter.gt = fechaInicio;
        else orderTimeFilter.gte = fechaInicio;
    }

    const ordenes = await prisma.orden.findMany({
      where: {
        fechaCreacion: orderTimeFilter,
        estado: { nombre: { not: "ANULADA" } }
      },
      select: {
        id: true,
        totalUSD: true,
        tasaBCV: true,
        paciente: { select: { nombreCompleto: true, cedula: true } },
        creadoPor: { select: { nombre: true } },
        pagos: { select: { montoUSD: true, metodo: { select: { nombre: true } } } }
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    let tasaDelDia = tasaBCV;
    if (tasaDelDiaFija !== null) {
      tasaDelDia = tasaDelDiaFija;
    } else if (oldestPendingOrder && oldestPendingOrder.tasaBCV) {
      tasaDelDia = oldestPendingOrder.tasaBCV;
    } else if (ordenes.length > 0 && ordenes[0].tasaBCV) {
      tasaDelDia = ordenes[ordenes.length - 1].tasaBCV;
    }

    const metodosMap: Record<string, { ingresosUSD: number, ingresosBS: number }> = {};
    let totalCuentasPorCobrarUSD = 0;
    let totalCuentasPorCobrarBS = 0;

    ordenes.forEach(o => {
      const montoOrdenUSD = Number(o.totalUSD) || 0;
      const montoOrdenBS = montoOrdenUSD * tasaDelDia;

      let pagosDeLaOrdenUSD = 0;
      let pagosDeLaOrdenBS = 0;

      if (o.pagos && o.pagos.length > 0) {
        o.pagos.forEach(p => {
          const m = p.metodo.nombre;
          if (!metodosMap[m]) metodosMap[m] = { ingresosUSD: 0, ingresosBS: 0 };
          
          const valorIngresoUSD = Number(p.montoUSD) || 0;
          const valorIngresoBS = valorIngresoUSD * tasaDelDia;

          metodosMap[m].ingresosUSD += valorIngresoUSD;
          metodosMap[m].ingresosBS += valorIngresoBS;

          pagosDeLaOrdenUSD += valorIngresoUSD;
          pagosDeLaOrdenBS += valorIngresoBS;
        });
      }

      // Por cobrar es lo que falta por pagar de la orden, forzando 2 decimales
      const faltanteUSD = Number(Math.max(0, montoOrdenUSD - pagosDeLaOrdenUSD).toFixed(2));
      const faltanteBS = Number((faltanteUSD * tasaDelDia).toFixed(2));
      
      totalCuentasPorCobrarUSD = Number((totalCuentasPorCobrarUSD + faltanteUSD).toFixed(2));
      totalCuentasPorCobrarBS = Number((totalCuentasPorCobrarBS + faltanteBS).toFixed(2));
    });

    let totalCajaUSD = 0;
    let totalCajaBS = 0;
    const desglosesCaja = Object.entries(metodosMap).map(([nombre, valores]) => {
      totalCajaUSD += valores.ingresosUSD;
      totalCajaBS += valores.ingresosBS;
      return { 
        nombre, 
        ingresosUSD: valores.ingresosUSD, 
        ingresosBS: valores.ingresosBS,
        netoUSD: valores.ingresosUSD 
      };
    });

    const payload = {
      tituloCaja,
      fechaTarget,
      esAtrasado,
      yaCerroHoy,
      tasaDelDia,
      observaciones: observacionesCierre,
      historialCierres,
      resumen: {
        totalEnCajaUSD: totalCajaUSD,
        totalEnCajaBS: totalCajaBS,
        cuentasPorCobrarUSD: totalCuentasPorCobrarUSD,
        cuentasPorCobrarBS: totalCuentasPorCobrarBS,
        pacientesAtendidos: ordenes.length,
        // Valores históricos si es un cierre ya guardado
        totalCalculadoUSD: cierreEspecificoObj?.totalCalculadoUSD ?? null,
        totalCalculadoBS: cierreEspecificoObj?.totalCalculadoBS ?? null,
        totalDeclaradoUSD: cierreEspecificoObj?.totalDeclaradoUSD ?? null,
        totalDeclaradoBS: cierreEspecificoObj?.totalDeclaradoBS ?? null,
        descuadreUSD: cierreEspecificoObj?.descuadreUSD ?? null,
        descuadreBS: cierreEspecificoObj?.descuadreBS ?? null
      },
      desglosesCaja,
      flujoPacientes: ordenes.map(o => {
        const totalU = Number(o.totalUSD) || 0;
        return {
          ordenId: o.id,
          cedula: o.paciente.cedula,
          paciente: o.paciente.nombreCompleto,
          totalUSD: totalU,
          totalBS: totalU * tasaDelDia,
          estadoPago: (o.pagos && o.pagos.length > 0) ? "PAGADO" : "PENDIENTE",
          registradoPor: o.creadoPor.nombre,
          metodoUsado: (o.pagos && o.pagos.length > 0) ? o.pagos[0].metodo.nombre : "NINGUNO"
        };
      })
    };

    const compressed = await gzip(Buffer.from(JSON.stringify(payload), 'utf-8'));
    return new NextResponse(compressed, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: `Error interno: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuarioSesion = await prisma.usuario.findUnique({ where: { correo: session.user.email } });
    if (!usuarioSesion) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const { totalCalculadoUSD, totalCalculadoBS, totalDeclaradoUSD, totalDeclaradoBS, observaciones, tasaBCV, desglose } = body;
    
    const ultimoCierre = await prisma.cierreCaja.findFirst({ orderBy: { fechaCierre: 'desc' } });
    const oldestPendingOrder = await prisma.orden.findFirst({
      where: {
        estado: { nombre: { not: "ANULADA" } },
        ...(ultimoCierre ? { fechaCreacion: { gt: ultimoCierre.fechaCierre } } : {})
      },
      orderBy: { fechaCreacion: 'asc' }
    });

    let fechaInicioBounds: Date;
    let fechaFinBounds: Date;

    if (oldestPendingOrder) {
      let targetDate = new Date(oldestPendingOrder.fechaCreacion);
      if (ultimoCierre) {
           const uCDateStr = formatToCaracasDateString(ultimoCierre.fechaCierre);
           const targetDateStr = formatToCaracasDateString(targetDate);
           if (targetDateStr <= uCDateStr) {
               targetDate = new Date(ultimoCierre.fechaCierre);
               targetDate.setDate(targetDate.getDate() + 1);
           }
      }
      const dateString = formatToCaracasDateString(targetDate);
      const bounds = getCaracasBoundsForDate(dateString);
      fechaInicioBounds = bounds.inicio;
      fechaFinBounds = bounds.fin;
    } else {
      const bounds = getCaracasTodayBounds();
      fechaInicioBounds = bounds.inicio;
      fechaFinBounds = bounds.fin;
    }

    const cierreExistente = await prisma.cierreCaja.findFirst({
      where: { fechaCierre: { gte: fechaInicioBounds, lte: fechaFinBounds } }
    });

    if (cierreExistente) {
      return NextResponse.json({ error: "El turno para esta fecha ya fue cerrado." }, { status: 400 });
    }

    const fechaApertura = ultimoCierre ? ultimoCierre.fechaCierre : fechaInicioBounds;
    const ahora = new Date();
    const fechaCierre = fechaFinBounds < ahora ? fechaFinBounds : ahora;

    const descuadreUSD = Number((parseFloat(totalDeclaradoUSD) - parseFloat(totalCalculadoUSD)).toFixed(2));
    const descuadreBS = Number((parseFloat(totalDeclaradoBS) - parseFloat(totalCalculadoBS)).toFixed(2));

    const nuevoCierre = await prisma.cierreCaja.create({
      data: {
        usuarioId: usuarioSesion.id,
        fechaApertura,
        fechaCierre,
        totalCalculadoUSD: Number(parseFloat(totalCalculadoUSD).toFixed(2)),
        totalCalculadoBS: Number(parseFloat(totalCalculadoBS).toFixed(2)),
        totalDeclaradoUSD: Number(parseFloat(totalDeclaradoUSD).toFixed(2)),
        totalDeclaradoBS: Number(parseFloat(totalDeclaradoBS).toFixed(2)),
        descuadreUSD,
        descuadreBS,
        tasaBCV: parseFloat(tasaBCV),
        observaciones,
        desgloseMetodos: JSON.stringify(desglose)
      }
    });

    return NextResponse.json({ success: true, cierre: nuevoCierre });
  } catch (error: any) {
    return NextResponse.json({ error: `Error al cerrar caja: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clave = searchParams.get("clave");

    if (!id || !clave) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    if (clave !== process.env.CLAVE_MAESTRA) {
      return NextResponse.json({ error: "Clave maestra incorrecta" }, { status: 401 });
    }

    await prisma.cierreCaja.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: `Error al anular cierre: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}