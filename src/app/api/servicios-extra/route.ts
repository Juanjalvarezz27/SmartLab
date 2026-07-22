import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET: Devuelve el catálogo de servicios extra activos
export const revalidate = 15;

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const todos = searchParams.get("todos") === "true";

    const servicios = await prisma.servicioExtra.findMany({
      where: todos ? { laboratorioId: labId } : { activo: true, laboratorioId: labId },
      orderBy: { precioUSD: "asc" },
    });
    const response = NextResponse.json(servicios);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error: any) {
    console.error("Error al cargar servicios extra:", error);
    return NextResponse.json({ error: `Error interno al cargar servicios: ${error?.message || 'Desconocido'}` }, { status: 500 });
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
    const { nombre, precioUSD, activo } = body;

    if (!nombre || precioUSD === undefined) {
      return NextResponse.json({ error: "El nombre y precio son obligatorios" }, { status: 400 });
    }

    const nuevoServicio = await prisma.servicioExtra.create({
      data: {
        nombre,
        precioUSD: parseFloat(precioUSD),
        activo: activo !== undefined ? activo : true,
        laboratorioId: labId
      }
    });

    return NextResponse.json(nuevoServicio);
  } catch (error: any) {
    console.error("Error al crear servicio extra:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: `Ya existe un servicio extra con ese nombre: ${error?.message || 'Desconocido'}` }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno al guardar" }, { status: 500 });
  }
}
