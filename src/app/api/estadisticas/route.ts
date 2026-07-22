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

    const ahora = new Date();
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

    const whereBase = {
      fechaCreacion: { gte: fechaInicio, lte: fechaFin },
      estado: { nombre: { not: "ANULADA" } }
    };

    // 1. KPIs con Aggregate Nativo (Cero carga en memoria)
    const [totalOrdenes, ordenesCompletadas, totalPruebasAgg] = await Promise.all([
      prisma.orden.count({ where: whereBase }),
      prisma.orden.count({ where: { ...whereBase, resultadosCompletados: true } }),
      prisma.detalleOrden.aggregate({
        _sum: { cantidad: true },
        where: { orden: whereBase }
      })
    ]);

    const totalPruebasProcesadas = totalPruebasAgg._sum.cantidad || 0;
    const tasaProcesamiento = totalOrdenes > 0 ? Math.round((ordenesCompletadas / totalOrdenes) * 100) : 0;

    // Pacientes únicos con Raw SQL (Muy rápido)
    const pacientesRaw: any[] = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT o."pacienteId")::integer as count 
      FROM "Orden" o
      JOIN "EstadoOrden" e ON o."estadoId" = e.id
      WHERE o."fechaCreacion" >= ${fechaInicio} AND o."fechaCreacion" <= ${fechaFin} AND e.nombre != 'ANULADA'
    `;
    const pacientesUnicos = pacientesRaw.length > 0 ? pacientesRaw[0].count : 0;

    // 2. Extracción Micro de Demografía, Estados y Fechas (Ultra ligero)
    const microOrdenes = await prisma.orden.findMany({
      where: whereBase,
      select: {
        fechaCreacion: true,
        estado: { select: { nombre: true } },
        paciente: { select: { sexo: true, fechaNacimiento: true, esBebe: true } },
        detalles: { select: { cantidad: true } } // Solo cantidad para la grafica
      },
      orderBy: { fechaCreacion: "asc" }
    });

    const distribucionSexo = { M: 0, F: 0 };
    const distribucionEdad = {
      "Bebés (0-2)": 0,
      "Niños (3-12)": 0,
      "Adultos (13-59)": 0,
      "Mayor (60+)": 0
    };
    const conteoEstados: Record<string, number> = {};
    
    // Tendencia
    const conteoTendencia: Record<string, { ordenes: number; pruebas: number }> = {};
    const diasDelPeriodo: string[] = [];
    const mesesSet = new Set<string>();
    
    const diferenciaDias = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24));
    const agruparPorMes = diferenciaDias > 60;
    
    if (!agruparPorMes) {
      let temporalDate = new Date(fechaInicio);
      while (temporalDate <= fechaFin) {
        const key = formatToCaracasDateString(temporalDate);
        if (!diasDelPeriodo.includes(key)) diasDelPeriodo.push(key);
        if (!conteoTendencia[key]) conteoTendencia[key] = { ordenes: 0, pruebas: 0 };
        temporalDate.setUTCHours(temporalDate.getUTCHours() + 24);
      }
    }

    microOrdenes.forEach((orden) => {
      // Tendencia
      let fechaKey = formatToCaracasDateString(orden.fechaCreacion);
      if (agruparPorMes) {
        const [y, m] = fechaKey.split("-");
        fechaKey = `${y}-${m}`;
        mesesSet.add(fechaKey);
      }
      
      if (!conteoTendencia[fechaKey]) {
        conteoTendencia[fechaKey] = { ordenes: 0, pruebas: 0 };
      }
      conteoTendencia[fechaKey].ordenes += 1;
      
      let pruebasEnOrden = 0;
      orden.detalles.forEach(d => { pruebasEnOrden += d.cantidad; });
      conteoTendencia[fechaKey].pruebas += pruebasEnOrden;

      // Estados
      const estadoNombre = orden.estado?.nombre || "Desconocido";
      conteoEstados[estadoNombre] = (conteoEstados[estadoNombre] || 0) + 1;

      // Sexo
      if (orden.paciente.sexo === "M" || orden.paciente.sexo === "F") {
        distribucionSexo[orden.paciente.sexo] += 1;
      }

      // Edad
      const nacimiento = new Date(orden.paciente.fechaNacimiento);
      let edad = ahora.getFullYear() - nacimiento.getFullYear();
      const m = ahora.getMonth() - nacimiento.getMonth();
      if (m < 0 || (m === 0 && ahora.getDate() < nacimiento.getDate())) {
        edad--;
      }

      if (orden.paciente.esBebe || edad <= 2) {
        distribucionEdad["Bebés (0-2)"] += 1;
      } else if (edad <= 12) {
        distribucionEdad["Niños (3-12)"] += 1;
      } else if (edad <= 59) {
        distribucionEdad["Adultos (13-59)"] += 1;
      } else {
        distribucionEdad["Mayor (60+)"] += 1;
      }
    });

    // 3. Categorías y Pruebas con GroupBy Nativo
    const pruebasAgrupadas = await prisma.detalleOrden.groupBy({
      by: ['pruebaId'],
      _sum: { cantidad: true },
      where: { orden: whereBase }
    });

    const pruebaIds = pruebasAgrupadas.map(p => p.pruebaId).filter(Boolean) as string[];
    const pruebasDb = await prisma.prueba.findMany({
      where: { id: { in: pruebaIds } },
      select: { 
        id: true, 
        nombre: true, 
        subcategoria: { select: { categoria: { select: { nombre: true } } } } 
      }
    });

    const mapaPruebas = new Map(pruebasDb.map(p => [p.id, p]));
    const conteoCategorias: Record<string, number> = {};
    const conteoPruebas: Record<string, number> = {};

    pruebasAgrupadas.forEach(agg => {
      if (!agg.pruebaId) return;
      const prueba = mapaPruebas.get(agg.pruebaId);
      const cantidad = agg._sum.cantidad || 0;
      
      const pruebaNombre = prueba?.nombre || "DESCONOCIDO";
      conteoPruebas[pruebaNombre] = (conteoPruebas[pruebaNombre] || 0) + cantidad;

      const catNombre = prueba?.subcategoria?.categoria?.nombre || "OTROS";
      conteoCategorias[catNombre] = (conteoCategorias[catNombre] || 0) + cantidad;
    });

    // 4. Formateo de gráficas para el Frontend
    let graficoTendencia: any[] = [];
    if (agruparPorMes) {
      const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      graficoTendencia = Array.from(mesesSet).sort().map(fechaKey => {
        const [year, month] = fechaKey.split("-");
        return {
          label: `${mesesNombres[parseInt(month, 10) - 1]} ${year}`,
          Pacientes: conteoTendencia[fechaKey]?.ordenes || 0,
          Pruebas: conteoTendencia[fechaKey]?.pruebas || 0
        };
      });
    } else {
      graficoTendencia = diasDelPeriodo.map((fecha) => {
        const [year, month, day] = fecha.split("-");
        return {
          label: `${day}/${month}`,
          Pacientes: conteoTendencia[fecha]?.ordenes || 0,
          Pruebas: conteoTendencia[fecha]?.pruebas || 0
        };
      });
    }

    const graficoSexo = [
      { name: "Masculino", value: distribucionSexo.M },
      { name: "Femenino", value: distribucionSexo.F }
    ];
    const graficoEdad = Object.entries(distribucionEdad).map(([name, value]) => ({ name, value }));
    const graficoCategorias = Object.entries(conteoCategorias).map(([name, value]) => ({ name, value }));
    const graficoEstados = Object.entries(conteoEstados).map(([name, value]) => ({ name, value }));

    const todasLasPruebas = Object.entries(conteoPruebas)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    const topCategorias = Object.entries(conteoCategorias)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    const payloadBuffer = Buffer.from(JSON.stringify({
      kpis: {
        totalOrdenes,
        pacientesUnicos,
        totalPruebas: totalPruebasProcesadas,
        tasaProcesamiento
      },
      graficoTendencia,
      graficoSexo,
      graficoEdad,
      graficoCategorias,
      todasLasPruebas,
      topCategorias,
      graficoEstados
    }));

    const compressedData = await gzip(payloadBuffer);

    return new NextResponse(compressedData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      }
    });

  } catch (error: any) {
    console.error("Error al generar estadisticas:", error);
    return NextResponse.json({ error: `Error interno en el servidor analítico: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}