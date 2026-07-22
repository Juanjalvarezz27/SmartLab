import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";
const gzip = promisify(gzipCallback);

// Obtener todos los paquetes con sus insumos
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const paquetes = await prisma.paqueteInsumo.findMany({
      where: { activo: true, laboratorioId: labId },
      include: {
        items: {
          include: { insumo: true },
        },
      },
      orderBy: { nombre: "asc" },
    });
    
    const compressedData = await gzip(Buffer.from(JSON.stringify(paquetes), 'utf-8'));
    return new NextResponse(compressedData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      }
    });
  } catch (error: any) {
    console.error("Error al obtener paquetes de insumos:", error);
    return NextResponse.json({ error: `Error al obtener paquetes: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}

// Crear un nuevo paquete de insumos
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { nombre, items } = body;

    if (!nombre?.trim()) {
      return NextResponse.json({ error: "El nombre del paquete es requerido" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Debe incluir al menos un insumo en el paquete" }, { status: 400 });
    }

    // Validar cantidades
    const itemsInvalidos = items.some((i: any) => !i.insumoId || !i.cantidadUsada || i.cantidadUsada <= 0);
    if (itemsInvalidos) {
      return NextResponse.json({ error: "Todos los insumos deben tener una cantidad mayor a 0" }, { status: 400 });
    }

    const nuevoPaquete = await prisma.paqueteInsumo.create({
      data: {
        nombre: nombre.trim().toUpperCase(),
        laboratorioId: labId,
        items: {
          create: items.map((item: any) => ({
            insumoId: Number(item.insumoId),
            cantidadUsada: Number(item.cantidadUsada),
            laboratorioId: labId
          })),
        },
      },
      include: {
        items: { include: { insumo: true } },
      },
    });

    return NextResponse.json(nuevoPaquete, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear paquete de insumos:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: `Ya existe un paquete con ese nombre: ${error?.message || 'Desconocido'}` }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear el paquete" }, { status: 500 });
  }
}
