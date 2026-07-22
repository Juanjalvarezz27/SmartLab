import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";
const gzip = promisify(gzipCallback);

export async function GET() {
  try {
    const insumos = await prisma.insumo.findMany({
      orderBy: { nombre: 'asc' },
    });
    
    const compressedData = await gzip(Buffer.from(JSON.stringify(insumos), 'utf-8'));
    return new NextResponse(compressedData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      }
    });
  } catch (error: any) {
    console.error("Error al obtener insumos:", error);
    return NextResponse.json({ error: `Error al obtener insumos: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, unidadMedida, costoUnitarioUSD, cantidadComprada, costoTotalUSD, activo } = body;
    
    if (!nombre || !unidadMedida || costoUnitarioUSD === undefined) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const nuevoInsumo = await prisma.insumo.create({
      data: {
        nombre,
        unidadMedida,
        costoUnitarioUSD: Number(costoUnitarioUSD),
        cantidadComprada: cantidadComprada ? Number(cantidadComprada) : null,
        costoTotalUSD: costoTotalUSD ? Number(costoTotalUSD) : null,
        activo: activo ?? true,
      },
    });

    return NextResponse.json(nuevoInsumo, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear insumo:", error);
    return NextResponse.json({ error: `Error al crear insumo: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
