import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;
    const rol = (session?.user as any)?.rol;

    if (!labId || (rol !== "LABORATORIO" && rol !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const lab = await prisma.laboratorio.findUnique({
      where: { id: labId },
      select: {
        nombre: true,
        logoBase64: true,
        telefono: true,
        correo: true,
        direccion: true,
        rif: true,
        ciudad: true,
        estado: true,
      }
    });

    if (!lab) {
      return NextResponse.json({ error: "Laboratorio no encontrado" }, { status: 404 });
    }

    return NextResponse.json(lab);
  } catch (error: any) {
    console.error("Error obteniendo configuracion del laboratorio:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;
    const rol = (session?.user as any)?.rol;

    if (!labId || (rol !== "LABORATORIO" && rol !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();

    // Solo actualizamos los campos permitidos, NO actualizamos "activo" u otros campos delicados.
    const labActualizado = await prisma.laboratorio.update({
      where: { id: labId },
      data: {
        nombre: body.nombre,
        logoBase64: body.logoBase64,
        telefono: body.telefono,
        correo: body.correo,
        direccion: body.direccion,
        rif: body.rif,
        ciudad: body.ciudad,
        estado: body.estado,
      },
    });

    return NextResponse.json(labActualizado);
  } catch (error: any) {
    console.error("Error actualizando configuracion del laboratorio:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
