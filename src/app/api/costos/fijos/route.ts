import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";
const gzip = promisify(gzipCallback);

export async function GET() {
  try {
    const session = await getServerSession();
    // Validar admin (asumiremos que está protegido o verificaremos rol si es necesario)
    
    const costosFijos = await prisma.costoFijo.findMany({
      orderBy: { nombre: 'asc' },
    });
    
    const compressedData = await gzip(Buffer.from(JSON.stringify(costosFijos), 'utf-8'));
    return new NextResponse(compressedData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      }
    });
  } catch (error: any) {
    console.error("Error al obtener costos fijos:", error);
    return NextResponse.json({ error: `Error al obtener costos fijos: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, montoMensualUSD, activo } = body;
    
    if (!nombre || montoMensualUSD === undefined) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const nuevoCosto = await prisma.costoFijo.create({
      data: {
        nombre,
        montoMensualUSD: Number(montoMensualUSD),
        activo: activo ?? true,
      },
    });

    return NextResponse.json(nuevoCosto, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear costo fijo:", error);
    return NextResponse.json({ error: `Error al crear costo fijo: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
