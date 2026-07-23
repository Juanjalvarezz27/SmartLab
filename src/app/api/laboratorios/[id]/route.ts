import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.rol;

    if (userRole !== "SUPERADMIN") {
      return NextResponse.json({ error: "No autorizado. Solo SuperAdmin." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const labActualizado = await prisma.laboratorio.update({
      where: { id },
      data: {
        nombre: body.nombre,
        rif: body.rif,
        telefono: body.telefono,
        correo: body.correo,
        direccion: body.direccion,
        ciudad: body.ciudad,
        estado: body.estado,
        activo: body.activo, // Para habilitar/inhabilitar
        logoBase64: body.logoBase64,
      },
    });

    return NextResponse.json(labActualizado);
  } catch (error: any) {
    console.error("Error al actualizar laboratorio:", error);
    return NextResponse.json(
      { error: "Error al actualizar el laboratorio" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.rol;

    if (userRole !== "SUPERADMIN") {
      return NextResponse.json({ error: "No autorizado. Solo SuperAdmin." }, { status: 401 });
    }

    const { id } = await params;

    // Prisma Delete en cascada eliminará usuarios, pacientes, ordenes, pagos, etc.
    await prisma.laboratorio.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Laboratorio eliminado correctamente" });
  } catch (error: any) {
    console.error("Error al eliminar laboratorio:", error);
    return NextResponse.json(
      { error: "Error al eliminar el laboratorio" },
      { status: 500 }
    );
  }
}
