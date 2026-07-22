import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";
const gzip = promisify(gzipCallback);

// ESTO ES VITAL: Obliga a Next.js a calcular esto en tiempo real siempre, sin caché.
export const revalidate = 15; 

import { getCaracasTodayBounds, subtractDaysCaracas, getCaracasThisMonthBounds, getCaracasBoundsForDate, formatToCaracasDateString } from "../../../lib/dateUtils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const periodo = searchParams.get("periodo") || "7DIAS";
    const inicioStr = searchParams.get("inicio");
    const finStr = searchParams.get("fin");
    
    // Recibimos la tasa real del hook desde el frontend
    const tasaParam = searchParams.get("tasa");
    const tasaBCV = tasaParam ? parseFloat(tasaParam) : 1; // 1 de respaldo para evitar errores matemáticos

    let fechaInicio = new Date();
    let fechaFin = new Date();

    if (periodo === "HOY") {
      const bounds = getCaracasTodayBounds();
      fechaInicio = bounds.inicio;
      fechaFin = bounds.fin;
    } else if (periodo === "7DIAS") {
      const bounds = getCaracasBoundsForDate(subtractDaysCaracas(7));
      fechaInicio = bounds.inicio;
      fechaFin = getCaracasTodayBounds().fin;
    } else if (periodo === "30DIAS") {
      const bounds = getCaracasBoundsForDate(subtractDaysCaracas(30));
      fechaInicio = bounds.inicio;
      fechaFin = getCaracasTodayBounds().fin;
    } else if (periodo === "MES_ACTUAL") {
      const bounds = getCaracasThisMonthBounds();
      fechaInicio = bounds.inicio;
      fechaFin = bounds.fin;
    } else if (periodo === "CUSTOM" && inicioStr && finStr) {
      const boundInicio = getCaracasBoundsForDate(inicioStr);
      const boundFin = getCaracasBoundsForDate(finStr);
      fechaInicio = boundInicio.inicio;
      fechaFin = boundFin.fin;
    }

    // 1. OBTENER INGRESOS (Solo órdenes pagadas/CERRADAS)
    const ingresos = await prisma.orden.findMany({
      where: {
        fechaCreacion: { gte: fechaInicio, lte: fechaFin },
        estado: { nombre: "CERRADA" } // Usamos el estado exacto de tu DB
      },
      select: { id: true, totalUSD: true, totalBS: true, fechaCreacion: true, paciente: { select: { nombreCompleto: true } } },
      orderBy: { fechaCreacion: 'desc' }
    });

    // 2. OBTENER GASTOS
    const gastos = await prisma.gasto.findMany({
      where: { fechaGasto: { gte: fechaInicio, lte: fechaFin } },
      include: { registradoPor: { select: { nombre: true } }, metodo: true },
      orderBy: { fechaGasto: 'desc' }
    });

    // 3. MÉTODOS DE PAGO
    const metodosPago = await prisma.metodoPago.findMany();

    // TOTALES USD Y BS (Asegurando que sean números)
    let totalIngresosUSD = 0; let totalIngresosBS = 0;
    ingresos.forEach(i => {
      const usd = Number(i.totalUSD) || 0;
      totalIngresosUSD += usd;
      totalIngresosBS += Number(i.totalBS) || (usd * tasaBCV);
    });

    let totalGastosUSD = 0; let totalGastosBS = 0;
    gastos.forEach(g => {
      const usd = Number(g.montoUSD) || 0;
      totalGastosUSD += usd;
      totalGastosBS += Number(g.montoBS) || (usd * tasaBCV);
    });

    const balanceNetoUSD = totalIngresosUSD - totalGastosUSD;
    const balanceNetoBS = totalIngresosBS - totalGastosBS;

    // TENDENCIA DIARIA
    const conteoTendencia: Record<string, { ingresos: number; gastos: number }> = {};
    const diasDelPeriodo: string[] = [];
    let temporalDate = new Date(fechaInicio);
    
    const diferenciaDias = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24));
    
    if (diferenciaDias <= 60) {
      while (temporalDate <= fechaFin) {
        const key = formatToCaracasDateString(temporalDate);
        if (!diasDelPeriodo.includes(key)) diasDelPeriodo.push(key);
        if (!conteoTendencia[key]) conteoTendencia[key] = { ingresos: 0, gastos: 0 };
        // Le sumamos 12 horas UTC (que sigue siendo el mismo dia en Caracas)
        temporalDate.setUTCHours(temporalDate.getUTCHours() + 24);
      }
    }

    ingresos.forEach(i => {
      const key = formatToCaracasDateString(i.fechaCreacion);
      if (conteoTendencia[key]) conteoTendencia[key].ingresos += (Number(i.totalUSD) || 0);
    });

    gastos.forEach(g => {
      const key = formatToCaracasDateString(g.fechaGasto);
      if (conteoTendencia[key]) conteoTendencia[key].gastos += (Number(g.montoUSD) || 0);
    });

    const graficoTendencia = diasDelPeriodo.map((fecha) => {
      const [year, month, day] = fecha.split("-");
      return {
        label: `${day}/${month}`,
        Ingresos: parseFloat(conteoTendencia[fecha]?.ingresos.toFixed(2) || "0"),
        Gastos: parseFloat(conteoTendencia[fecha]?.gastos.toFixed(2) || "0")
      };
    });

    // DISTRIBUCIÓN POR MÉTODO
    const gastosPorMetodo: Record<string, number> = {};
    gastos.forEach(g => {
      const nombre = g.metodo.nombre;
      gastosPorMetodo[nombre] = (gastosPorMetodo[nombre] || 0) + (Number(g.montoUSD) || 0);
    });

    const graficoGastos = Object.entries(gastosPorMetodo)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);

    // TOP 5 MAYORES EGRESOS
    const topGastos = [...gastos]
      .sort((a, b) => Number(b.montoUSD) - Number(a.montoUSD))
      .slice(0, 5)
      .map(g => ({
        id: g.id,
        concepto: g.concepto,
        montoUSD: Number(g.montoUSD) || 0,
        metodo: g.metodo.nombre
      }));

    // HISTORIAL COMBINADO
    const historialRaw = [
      ...ingresos.map(i => {
        const usd = Number(i.totalUSD) || 0;
        return {
          id: `ing-${i.id}`,
          tipo: 'INGRESO',
          concepto: `Orden #${i.id.toString().padStart(5, '0')} - ${i.paciente.nombreCompleto}`,
          montoUSD: usd,
          montoBS: Number(i.totalBS) || (usd * tasaBCV),
          fecha: i.fechaCreacion,
          metodo: 'Venta Caja'
        };
      }),
      ...gastos.map(g => ({
        id: `gas-${g.id}`,
        tipo: 'GASTO',
        concepto: g.concepto,
        montoUSD: Number(g.montoUSD) || 0,
        montoBS: Number(g.montoBS) || 0,
        fecha: g.fechaGasto,
        metodo: g.metodo.nombre,
        responsable: g.registradoPor.nombre
      }))
    ];

    const historial = historialRaw.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    const payloadBuffer = Buffer.from(JSON.stringify({
      kpis: { totalIngresosUSD, totalIngresosBS, totalGastosUSD, totalGastosBS, balanceNetoUSD, balanceNetoBS },
      graficoTendencia,
      graficoGastos,
      topGastos,
      historial,
      metodosPago 
    }));

    const compressedData = await gzip(payloadBuffer);

    return new NextResponse(compressedData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      }
    });

  } catch (error: any) {
    console.error("Error al generar monedero:", error);
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
    const { concepto, metodoId, montoUSD, montoBS, referencia } = body;

    // Validación básica
    if (!concepto || !metodoId || montoUSD === undefined || montoBS === undefined) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // Guardamos el gasto en la BD usando el usuario de la sesión
    const nuevoGasto = await prisma.gasto.create({
      data: {
        usuarioId: usuarioSesion.id,
        concepto,
        metodoId: parseInt(metodoId),
        montoUSD: parseFloat(montoUSD),
        montoBS: parseFloat(montoBS),
        referencia: referencia || null,
        fechaGasto: new Date()
      }
    });

    return NextResponse.json({ success: true, gasto: nuevoGasto });
  } catch (error: any) {
    console.error("Error al registrar gasto:", error);
    return NextResponse.json({ error: `Error interno al guardar: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}