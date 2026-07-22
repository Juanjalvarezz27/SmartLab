import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const metodos = await prisma.metodoPago.findMany({
      orderBy: { nombre: 'asc' }
    });
    const response = NextResponse.json(metodos);
    response.headers.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: `Error al cargar métodos de pago: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}