import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { promisify } from "util";
import { gzip as gzipCallback } from "zlib";
const gzip = promisify(gzipCallback);

export function normalizarNombre(nombre: string): string {
  if (!nombre) return "";
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
    .toUpperCase()
    .replace(/\s+/g, " ") // Reduce múltiples espacios a uno solo
    .trim();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || searchParams.get("cedula");

  if (!q) return NextResponse.json({ error: "Término de búsqueda no proporcionado" }, { status: 400 });

  try {
    const pacientes = await prisma.paciente.findMany({
      where: {
        OR: [
          { cedula: { contains: q } },
          { nombreCompleto: { contains: q, mode: "insensitive" } }
        ]
      },
      take: 10,
      orderBy: { nombreCompleto: "asc" },
      select: {
        id: true,
        cedula: true,
        nombreCompleto: true,
        fechaNacimiento: true,
        esBebe: true,
        sexo: true,
        telefono: true,
        correo: true,
        direccion: true,
        observaciones: true
      }
    });

    const jsonString = JSON.stringify(pacientes);
    const compressedBuffer = await gzip(Buffer.from(jsonString, 'utf-8'));

    return new NextResponse(compressedBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
        // Opcional: Cache corto para no machacar el backend si escriben la misma letra rápido
        'Cache-Control': 's-maxage=10, stale-while-revalidate=30'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: `Error al buscar pacientes: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // VALIDACIÓN ROBUSTA: Si no es bebé, la cédula debe tener texto real
    const cedulaLimpia = body.cedula?.trim();
    if (!body.esBebe && !cedulaLimpia) {
      return NextResponse.json({ error: "La cédula es obligatoria para adultos" }, { status: 400 });
    }

    const fechaNacimiento = new Date(body.fechaNacimiento);
    if (isNaN(fechaNacimiento.getTime())) {
      return NextResponse.json({ error: "La fecha de nacimiento proporcionada es inválida." }, { status: 400 });
    }

    const nombreNormalizado = normalizarNombre(body.nombreCompleto);
    const esSinCedula = body.esBebe || !cedulaLimpia;

    // VALIDACIÓN ANTI-DUPLICADOS (HOMONIMIA) PARA PACIENTES SIN CÉDULA
    if (esSinCedula) {
      const existente = await prisma.paciente.findFirst({
        where: {
          nombreCompleto: nombreNormalizado,
          fechaNacimiento: fechaNacimiento
        }
      });
      if (existente) {
        return NextResponse.json(
          { error: "Ya existe un paciente sin cédula registrado con este mismo nombre exacto y fecha de nacimiento." },
          { status: 400 }
        );
      }
    }

    const nuevoPaciente = await prisma.paciente.create({
      data: {
        // Si es bebe o la cedula esta vacia, guardamos NULL para no romper el Unique de la DB
        cedula: esSinCedula ? null : cedulaLimpia,
        nombreCompleto: nombreNormalizado,
        fechaNacimiento: fechaNacimiento,
        esBebe: body.esBebe,
        sexo: body.sexo,
        telefono: body.telefono || null,
        correo: body.correo?.toLowerCase() || null,
        direccion: body.direccion || null,
        observaciones: body.observaciones || null,
      }
    });

    return NextResponse.json(nuevoPaciente);
  } catch (error: any) {
    console.error("ERROR POST /api/pacientes:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: `Esta cédula ya está registrada: ${error?.message || 'Desconocido'}` }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno al registrar paciente", details: error.message }, { status: 500 });
  }
}