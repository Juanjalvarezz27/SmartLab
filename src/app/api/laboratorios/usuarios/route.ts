import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;
    const rol = (session?.user as any)?.rol;

    if (!labId || (rol !== "LABORATORIO" && rol !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuarios = await prisma.usuario.findMany({
      where: { laboratorioId: labId },
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
        activo: true,
        mpps: true,
        col: true,
        pinFirma: true,
        fechaCreacion: true,
      },
      orderBy: { fechaCreacion: "desc" },
    });

    return NextResponse.json(usuarios);
  } catch (error: any) {
    console.error("Error obteniendo usuarios:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;
    const rol = (session?.user as any)?.rol;

    if (!labId || (rol !== "LABORATORIO" && rol !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    
    // Verificar que el correo no exista ya
    const existingUser = await prisma.usuario.findUnique({
      where: { correo: body.correo },
    });
    
    if (existingUser) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(body.clave, 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre: body.nombre,
        correo: body.correo,
        clave: hashedPassword,
        rol: (body.rol === "BIOANALISTA" || body.rol === "ASISTENTE") ? body.rol : "ASISTENTE",
        mpps: body.mpps || null,
        col: body.col || null,
        pinFirma: body.pinFirma || null,
        activo: true,
        laboratorioId: labId,
      },
    });

    return NextResponse.json(nuevoUsuario, { status: 201 });
  } catch (error: any) {
    console.error("Error creando usuario:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
