import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const bioanalistas = await prisma.usuario.findMany({
      where: { 
        rol: { nombre: "ADMIN" },
        activo: true,
        pinFirma: { not: null }
      },
      select: { id: true, nombre: true }
    });
    
    const response = NextResponse.json(bioanalistas);
    response.headers.set('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: `Error al obtener lista de bioanalistas: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}