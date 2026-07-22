import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import sharp from "sharp";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.rol !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "No autorizado. Solo el SuperAdmin puede crear laboratorios." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { labNombre, labRif, labTelefono, labCorreo, labDireccion, logoBase64, adminNombre, adminCorreo, adminClave } = body;

    if (!labNombre || !adminNombre || !adminCorreo || !adminClave) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    // Verificar si el correo del admin ya existe
    const correoExistente = await prisma.usuario.findUnique({
      where: { correo: adminCorreo }
    });

    if (correoExistente) {
      return NextResponse.json(
        { error: "El correo del usuario administrador ya está registrado en el sistema." },
        { status: 400 }
      );
    }

    // Procesar y comprimir el logo si fue proporcionado
    let logoProcesado = null;
    if (logoBase64) {
      try {
        // Remover el header del base64 (data:image/png;base64,...)
        const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Comprimir con sharp a WEBP (super ligero) y redimensionar
        const webpBuffer = await sharp(buffer)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
          
        logoProcesado = `data:image/webp;base64,${webpBuffer.toString('base64')}`;
      } catch (err) {
        console.warn("No se pudo procesar la imagen del logo:", err);
      }
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const claveHasheada = await bcrypt.hash(adminClave, saltRounds);

    // Ejecutar creación transaccional
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear el Laboratorio
      const nuevoLab = await tx.laboratorio.create({
        data: {
          nombre: labNombre,
          rif: labRif || null,
          telefono: labTelefono || null,
          correo: labCorreo || null,
          direccion: labDireccion || null,
          logoBase64: logoProcesado,
          activo: true
        }
      });

      // 2. Crear el Usuario Administrador asociado al laboratorio
      const nuevoAdmin = await tx.usuario.create({
        data: {
          nombre: adminNombre,
          correo: adminCorreo,
          clave: claveHasheada,
          rol: "LABORATORIO",
          activo: true,
          laboratorioId: nuevoLab.id
        }
      });

      // 3. Crear catálogos mínimos por defecto
      await tx.metodoPago.createMany({
        data: [
          { nombre: 'Efectivo USD', laboratorioId: nuevoLab.id },
          { nombre: 'Efectivo BS', laboratorioId: nuevoLab.id },
          { nombre: 'Zelle', laboratorioId: nuevoLab.id },
          { nombre: 'Pago Movil', laboratorioId: nuevoLab.id },
          { nombre: 'Punto de Venta', laboratorioId: nuevoLab.id },
        ],
        skipDuplicates: true
      });

      return { nuevoLab, nuevoAdmin };
    });

    return NextResponse.json(
      { message: "Laboratorio creado exitosamente", laboratorio: resultado.nuevoLab },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error al crear laboratorio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", detalles: error.message },
      { status: 500 }
    );
  }
}
