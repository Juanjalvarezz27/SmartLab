import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const pacienteId = resolvedParams.id;
    const body = await req.json();

    const pacienteExistente = await prisma.paciente.findFirst({
      where: { id: pacienteId, laboratorioId: labId }
    });

    if (!pacienteExistente) {
      return NextResponse.json({ error: "No autorizado para modificar este paciente" }, { status: 403 });
    }

    const pacienteActualizado = await prisma.paciente.update({
      where: { id_laboratorioId: { id: pacienteId, laboratorioId: labId } },
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