import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const pacienteId = resolvedParams.id;
    const body = await req.json();

    const pacienteActualizado = await prisma.paciente.update({
      where: { id: pacienteId },
      data: {
        nombreCompleto: body.nombreCompleto,
        fechaNacimiento: new Date(body.fechaNacimiento), // Pasamos de YYYY-MM-DD a objeto Date
        sexo: body.sexo,
        telefono: body.telefono,
        correo: body.correo,
        direccion: body.direccion,
        observaciones: body.observaciones
      }
    });

    return NextResponse.json(pacienteActualizado);
  } catch (error: any) {
    console.error("Error al actualizar paciente:", error);
    return NextResponse.json({ error: `Error interno al actualizar paciente: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}