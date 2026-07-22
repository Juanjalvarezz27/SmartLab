import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";

const gzip = promisify(gzipCallback);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    const costosFijos = await prisma.costoFijo.findMany({
      where: { laboratorioId: labId },
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
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

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
        laboratorioId: labId
      },
    });

    return NextResponse.json(nuevoCosto, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear costo fijo:", error);
    return NextResponse.json({ error: `Error al crear costo fijo: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
