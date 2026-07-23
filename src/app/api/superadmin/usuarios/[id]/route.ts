import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

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

    const updateData: any = {
      correo: body.correo,
    };

    if (body.nuevaClave && body.nuevaClave.trim() !== "") {
      updateData.clave = await bcrypt.hash(body.nuevaClave, 10);
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: { id: true, nombre: true, correo: true, activo: true, rol: true } // Don't return password hash
    });

    return NextResponse.json(usuarioActualizado);
  } catch (error: any) {
    console.error("Error al actualizar usuario (SuperAdmin):", error);
    // Verificar si es error de correo duplicado de Prisma
    if (error.code === 'P2002' && error.meta?.target?.includes('correo')) {
       return NextResponse.json(
        { error: "Ese correo ya está en uso por otro usuario" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar el usuario" },
      { status: 500 }
    );
  }
}
