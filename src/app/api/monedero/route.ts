import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";
const gzip = promisify(gzipCallback);
import { getCaracasTodayBounds, subtractDaysCaracas, getCaracasThisMonthBounds, getCaracasBoundsForDate, formatToCaracasDateString } from "../../../lib/dateUtils";

export const revalidate = 15;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const periodo = searchParams.get("periodo") || "7DIAS";
    const inicioStr = searchParams.get("inicio");
    const finStr = searchParams.get("fin");
    
    const tasaParam = searchParams.get("tasa");
    const tasaBCV = tasaParam ? parseFloat(tasaParam) : 1; 

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

    // 1. KPIs CON AGGREGATE NATIVO DE PRISMA
    const [ingresosAgg, gastosAgg, metodosPago] = await Promise.all([
      prisma.orden.aggregate({
        _sum: { totalUSD: true, totalBS: true },
        where: { fechaCreacion: { gte: fechaInicio, lte: fechaFin }, estado: { nombre: "CERRADA" } }
      }),
      prisma.gasto.aggregate({
        _sum: { montoUSD: true, montoBS: true },
        where: { fechaGasto: { gte: fechaInicio, lte: fechaFin } }
      }),
      prisma.metodoPago.findMany()
    ]);

    const totalIngresosUSD = ingresosAgg._sum.totalUSD || 0;
    const totalIngresosBS = ingresosAgg._sum.totalBS || (totalIngresosUSD * tasaBCV);
    
    const totalGastosUSD = gastosAgg._sum.montoUSD || 0;
    const totalGastosBS = gastosAgg._sum.montoBS || (totalGastosUSD * tasaBCV);

    const balanceNetoUSD = totalIngresosUSD - totalGastosUSD;
    const balanceNetoBS = totalIngresosBS - totalGastosBS;

    // 2. TENDENCIA DIARIA (Uso micro-extracción para asegurar compatibilidad de Timezones sin raw complejo)
    const diferenciaDias = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24));
    
    let graficoTendencia: any[] = [];
    const conteoTendencia: Record<string, { ingresos: number; gastos: number }> = {};
    const diasDelPeriodo: string[] = [];

    if (diferenciaDias <= 60) {
      // Extraemos SOLO fechas y montos (ultra ligero en memoria, soporta 100k+ registros sin problema)
      const [fechasIngresos, fechasGastos] = await Promise.all([
        prisma.orden.findMany({
          where: { fechaCreacion: { gte: fechaInicio, lte: fechaFin }, estado: { nombre: "CERRADA" } },
          select: { fechaCreacion: true, totalUSD: true }
        }),
        prisma.gasto.findMany({
          where: { fechaGasto: { gte: fechaInicio, lte: fechaFin } },
          select: { fechaGasto: true, montoUSD: true }
        })
      ]);

      let temporalDate = new Date(fechaInicio);
      while (temporalDate <= fechaFin) {
        const key = formatToCaracasDateString(temporalDate);
        if (!diasDelPeriodo.includes(key)) diasDelPeriodo.push(key);
        if (!conteoTendencia[key]) conteoTendencia[key] = { ingresos: 0, gastos: 0 };
        temporalDate.setUTCHours(temporalDate.getUTCHours() + 24);
      }

      fechasIngresos.forEach(i => {
        const key = formatToCaracasDateString(i.fechaCreacion);
        if (conteoTendencia[key]) conteoTendencia[key].ingresos += (Number(i.totalUSD) || 0);
      });

      fechasGastos.forEach(g => {
        const key = formatToCaracasDateString(g.fechaGasto);
        if (conteoTendencia[key]) conteoTendencia[key].gastos += (Number(g.montoUSD) || 0);
      });

      graficoTendencia = diasDelPeriodo.map((fecha) => {
        const [year, month, day] = fecha.split("-");
        return {
          label: `${day}/${month}`,
          Ingresos: parseFloat(conteoTendencia[fecha]?.ingresos.toFixed(2) || "0"),
          Gastos: parseFloat(conteoTendencia[fecha]?.gastos.toFixed(2) || "0")
        };
      });
    } else {
      // Agrupación mensual para periodos mayores a 60 días
      const [fechasIngresos, fechasGastos] = await Promise.all([
        prisma.orden.findMany({
          where: { fechaCreacion: { gte: fechaInicio, lte: fechaFin }, estado: { nombre: "CERRADA" } },
          select: { fechaCreacion: true, totalUSD: true }
        }),
        prisma.gasto.findMany({
          where: { fechaGasto: { gte: fechaInicio, lte: fechaFin } },
          select: { fechaGasto: true, montoUSD: true }
        })
      ]);

      fechasIngresos.forEach(i => {
        const d = new Date(i.fechaCreacion);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!diasDelPeriodo.includes(key)) diasDelPeriodo.push(key);
        if (!conteoTendencia[key]) conteoTendencia[key] = { ingresos: 0, gastos: 0 };
        conteoTendencia[key].ingresos += (Number(i.totalUSD) || 0);
      });

      fechasGastos.forEach(g => {
        const d = new Date(g.fechaGasto);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!diasDelPeriodo.includes(key)) diasDelPeriodo.push(key);
        if (!conteoTendencia[key]) conteoTendencia[key] = { ingresos: 0, gastos: 0 };
        conteoTendencia[key].gastos += (Number(g.montoUSD) || 0);
      });

      diasDelPeriodo.sort();

      graficoTendencia = diasDelPeriodo.map((mesKey) => {
        const [year, month] = mesKey.split("-");
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        return {
          label: `${monthNames[parseInt(month) - 1]} ${year.substring(2)}`,
          Ingresos: parseFloat(conteoTendencia[mesKey]?.ingresos.toFixed(2) || "0"),
          Gastos: parseFloat(conteoTendencia[mesKey]?.gastos.toFixed(2) || "0")
        };
      });
    }

    // 3. MÉTODOS DE PAGO (Group By Nativo)
    const metodosMap = new Map(metodosPago.map(m => [m.id, m.nombre]));

    const [gastosGrouped, pagosGrouped] = await Promise.all([
      prisma.gasto.groupBy({
        by: ['metodoId'],
        _sum: { montoUSD: true },
        where: { fechaGasto: { gte: fechaInicio, lte: fechaFin } }
      }),
      prisma.pago.groupBy({
        by: ['metodoId'],
        _sum: { montoUSD: true },
        where: { orden: { fechaCreacion: { gte: fechaInicio, lte: fechaFin }, estado: { nombre: "CERRADA" } } }
      })
    ]);

    const gastosPorMetodo: Record<string, number> = {};
    gastosGrouped.forEach(g => {
      const nombre = metodosMap.get(g.metodoId) || "Desconocido";
      gastosPorMetodo[nombre] = (gastosPorMetodo[nombre] || 0) + (g._sum.montoUSD || 0);
    });
    const graficoGastos = Object.entries(gastosPorMetodo).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    const ingresosPorMetodo: Record<string, number> = {};
    pagosGrouped.forEach(p => {
      const nombre = metodosMap.get(p.metodoId) || "EFECTIVO_USD";
      ingresosPorMetodo[nombre] = (ingresosPorMetodo[nombre] || 0) + (p._sum.montoUSD || 0);
    });
    const graficoIngresos = Object.entries(ingresosPorMetodo).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);


    // 4. HISTORIAL GASTOS (Micro-extracción)
    const gastosRaw = await prisma.gasto.findMany({
      where: { fechaGasto: { gte: fechaInicio, lte: fechaFin } },
      select: { id: true, concepto: true, montoUSD: true, montoBS: true, fechaGasto: true, metodo: { select: { nombre: true } }, registradoPor: { select: { nombre: true } } },
      orderBy: { fechaGasto: 'desc' }
    });

    const historial = gastosRaw.map(g => ({
      id: `gas-${g.id}`,
      tipo: 'GASTO',
      concepto: g.concepto,
      montoUSD: Number(g.montoUSD) || 0,
      montoBS: Number(g.montoBS) || 0,
      fecha: g.fechaGasto,
      metodo: g.metodo.nombre,
      responsable: g.registradoPor.nombre
    }));

    // 5. HISTORIAL DESCUENTOS (Solo descargamos las órdenes que de verdad tienen descuentos)
    const ingresosConDescuento = await prisma.orden.findMany({
      where: {
        fechaCreacion: { gte: fechaInicio, lte: fechaFin },
        estado: { nombre: "CERRADA" },
        OR: [
          { descuentoGeneral: { gt: 0 } },
          { detalles: { some: { descuento: { gt: 0 } } } }
        ]
      },
      select: {
        id: true, fechaCreacion: true, descuentoGeneral: true, subtotalUSD: true,
        paciente: { select: { nombreCompleto: true } },
        tipoDescuento: { select: { nombre: true } },
        detalles: {
          where: { descuento: { gt: 0 } },
          select: {
            id: true, descuento: true, precioCongeladoUSD: true, cantidad: true,
            prueba: { select: { nombre: true } },
            tipoDescuento: { select: { nombre: true } }
          }
        }
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    const historialDescuentosRaw: any[] = [];
    ingresosConDescuento.forEach(orden => {
      if (orden.descuentoGeneral > 0) {
        let montoDescuentoUSD = Number(orden.descuentoGeneral) || 0;
        const motivo = orden.tipoDescuento?.nombre || 'Descuento General';
        if (motivo.toUpperCase().includes('PORCENTAJE') || motivo.toUpperCase() === '%') {
          const subtotal = Number(orden.subtotalUSD) || 0;
          montoDescuentoUSD = (subtotal * montoDescuentoUSD) / 100;
        }

        historialDescuentosRaw.push({
          id: `desc-gen-${orden.id}`,
          ordenId: orden.id,
          fecha: orden.fechaCreacion,
          paciente: orden.paciente.nombreCompleto,
          tipo: 'GENERAL',
          motivo: motivo,
          valorOriginal: orden.descuentoGeneral,
          montoUSD: montoDescuentoUSD,
          montoBS: montoDescuentoUSD * tasaBCV,
        });
      }
      
      if (orden.detalles) {
        orden.detalles.forEach(detalle => {
          if (detalle.descuento > 0) {
            let montoDescuentoUSD = Number(detalle.descuento) || 0;
            const motivo = detalle.tipoDescuento?.nombre || `Descuento en Prueba`;
            if (motivo.toUpperCase().includes('PORCENTAJE') || motivo.toUpperCase() === '%') {
              const precioTotal = (Number(detalle.precioCongeladoUSD) || 0) * (Number(detalle.cantidad) || 1);
              montoDescuentoUSD = (precioTotal * montoDescuentoUSD) / 100;
            }

            historialDescuentosRaw.push({
              id: `desc-det-${detalle.id}`,
              ordenId: orden.id,
              fecha: orden.fechaCreacion,
              paciente: orden.paciente.nombreCompleto,
              tipo: 'PRUEBA',
              motivo: motivo,
              detalleNombre: detalle.prueba?.nombre || 'Prueba',
              valorOriginal: detalle.descuento,
              montoUSD: montoDescuentoUSD,
              montoBS: montoDescuentoUSD * tasaBCV,
            });
          }
        });
      }
    });

    const historialDescuentos = historialDescuentosRaw.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    const payloadBuffer = Buffer.from(JSON.stringify({
      tasaBCV,
      kpis: { totalIngresosUSD, totalIngresosBS, totalGastosUSD, totalGastosBS, balanceNetoUSD, balanceNetoBS },
      graficoTendencia,
      graficoGastos,
      graficoIngresos, 
      historial,
      historialDescuentos,
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