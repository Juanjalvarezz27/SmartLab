import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../app/api/auth/[...nextauth]/route";

const parseId = (id: any) => isNaN(Number(id)) ? id : Number(id);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const ordenId = parseId(resolvedParams.id); // <-- CORREGIDO
    const body = await req.json();

    const { clave, estadoDestino } = body;

    const CLAVE_REAL = process.env.CLAVE_MAESTRA || "leyma2026";

    if (clave !== CLAVE_REAL) {
      return NextResponse.json({ error: "Clave maestra incorrecta" }, { status: 403 });
    }

    const estadoEnBD = await prisma.estadoOrden.findUnique({ where: { nombre: estadoDestino } });

    if (!estadoEnBD) {
      return NextResponse.json({ error: "Estado de destino no existe" }, { status: 500 });
    }

    const ordenActualizada = await prisma.orden.update({
      where: { id: ordenId as any },
      data: { estadoId: estadoEnBD.id }
    });

    return NextResponse.json({ success: true, orden: ordenActualizada });
  } catch (error: any) {
    console.error("Error al cambiar estado:", error);
    return NextResponse.json({ error: `Error interno al cambiar el estado: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}