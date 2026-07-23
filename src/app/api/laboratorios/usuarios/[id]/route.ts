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
    const labId = (session?.user as any)?.laboratorioId;
    const rol = (session?.user as any)?.rol;

    if (!labId || rol !== "LABORATORIO") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Validar que el usuario que intenta editar pertenece a su propio laboratorio
    const userToEdit = await prisma.usuario.findUnique({
      where: { id },
    });

    if (!userToEdit || userToEdit.laboratorioId !== labId) {
      return NextResponse.json({ error: "Usuario no encontrado o no pertenece a su laboratorio" }, { status: 404 });
    }

    const updateData: any = {
      nombre: body.nombre,
      correo: body.correo,
      rol: body.rol,
      mpps: body.rol === "LABORATORIO" ? body.mpps : null,
      col: body.rol === "LABORATORIO" ? body.col : null,
      pinFirma: body.rol === "LABORATORIO" ? body.pinFirma : null,
      activo: body.activo,
    };

    if (body.clave) {
      updateData.clave = await bcrypt.hash(body.clave, 10);
    }

    // Comprobar colisión de correo si lo cambiaron
    if (body.correo !== userToEdit.correo) {
      const existingEmail = await prisma.usuario.findUnique({
        where: { correo: body.correo },
      });
      if (existingEmail) {
        return NextResponse.json({ error: "El correo ya está en uso por otro usuario" }, { status: 400 });
      }
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(usuarioActualizado);
  } catch (error: any) {
    console.error("Error actualizando usuario:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
