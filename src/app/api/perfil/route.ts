import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";
const gzip = promisify(gzipCallback);

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const usuario = await prisma.usuario.findUnique({
      where: { id: token.sub },
      select: {
        nombre: true,
        correo: true,
        pinFirma: true,
        firmaUrl: true,
        mpps: true,
        col: true,
        rol: { select: { nombre: true } }
      }
    });

    if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const compressedData = await gzip(Buffer.from(JSON.stringify(usuario), 'utf-8'));
    return new NextResponse(compressedData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: `Error al obtener perfil: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { nombre, claveActual, nuevaClave, pinActual, nuevoPin, firmaUrl, mpps, col } = body;

    const usuarioActual = await prisma.usuario.findUnique({ where: { id: token.sub } });
    if (!usuarioActual) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const updateData: any = { nombre };

    if (mpps !== undefined) updateData.mpps = mpps;
    if (col !== undefined) updateData.col = col;

    // Validar y actualizar la Firma Digital (Imagen)
    if (firmaUrl !== undefined) updateData.firmaUrl = firmaUrl;

    // Validar y actualizar el PIN
    if (nuevoPin) {
      if (usuarioActual.pinFirma && usuarioActual.pinFirma !== pinActual) {
        return NextResponse.json({ error: "El PIN actual es incorrecto." }, { status: 400 });
      }
      updateData.pinFirma = nuevoPin;
    }

    // Validar y actualizar la Contraseña
    if (claveActual && nuevaClave) {
      const claveCorrecta = await bcrypt.compare(claveActual, usuarioActual.clave);
      if (!claveCorrecta) {
        return NextResponse.json({ error: "La contraseña actual es incorrecta." }, { status: 400 });
      }
      updateData.clave = await bcrypt.hash(nuevaClave, 10);
    }

    await prisma.usuario.update({
      where: { id: token.sub },
      data: updateData,
    });

    return NextResponse.json({ mensaje: "Perfil actualizado correctamente" });
  } catch (error: any) {
    return NextResponse.json({ error: `Error al actualizar perfil: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}