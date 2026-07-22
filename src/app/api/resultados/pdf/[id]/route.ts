import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import React from "react";
import ReporteDocumentServer from "../../../../components/resultados/ReporteDocumentServer";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const ordenId = parseInt(resolvedParams.id, 10);

    if (isNaN(ordenId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const orden = await prisma.orden.findUnique({
      where: { id: ordenId },
      select: {
        id: true,
        fechaCreacion: true,
        resultadosCompletados: true,
        notasSubcategoria: {
          select: {
            subcategoria: true,
            nota: true
          }
        },
        paciente: {
          select: {
            nombreCompleto: true,
            cedula: true,
            fechaNacimiento: true,
            esBebe: true,
            sexo: true,
            telefono: true,
            direccion: true,
            observaciones: true
          }
        },
        estado: { select: { nombre: true } },
        creadoPor: { select: { nombre: true } },
        detalles: {
          select: {
            id: true,
            cantidad: true,
            resultado: {
              select: {
                valoresReferencia: true,
                observaciones: true,
                firmado: true,
                valores: {
                  select: {
                    valorIngresado: true
                  }
                },
                procesadoPor: {
                  select: {
                    id: true,
                    nombre: true,
                    firmaUrl: true,
                    mpps: true,
                    col: true,
                  },
                },
              },
            },
            prueba: {
              select: {
                nombre: true,
                unidades: true,
                valoresReferencia: true,
                categoriaVisual: true,
                subcategoriaVisual: true,
                codigo: true,
                subcategoria: {
                  select: {
                    nombre: true,
                    esPaquete: true,
                    categoria: {
                      select: {
                        nombre: true
                      }
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!orden) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (!orden.resultadosCompletados) {
      return NextResponse.json(
        { error: "Los resultados aún no están listos" },
        { status: 403 }
      );
    }

    // Fecha impresa
    const ahora = new Date();
    const fechaImpresa =
      ahora.toLocaleDateString("es-VE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "America/Caracas"
      }) +
      "  |  " +
      ahora.toLocaleTimeString("es-VE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Caracas"
      });

    // Generar QR como Data URL base64
    const origin = new URL(request.url).origin;
    const urlValidacion = `${origin}/validar/${ordenId}`;
    const qrCodeUrl = await QRCode.toDataURL(urlValidacion, {
      margin: 1,
      width: 200,
      color: { dark: "#000000", light: "#FFFFFF" },
    });

    // Logo: leer del filesystem como base64 (react-pdf en servidor necesita ruta absoluta o buffer)
    const logoPath = path.join(process.cwd(), "public", "Logo2.png");
    const logoBase64 = fs.existsSync(logoPath)
      ? `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`
      : null;

    // Firmas: convertir URLs relativas a base64 si existen en el filesystem público
    const ordenConFirmas = {
      ...orden,
      detalles: orden.detalles.map((det: any) => ({
        ...det,
        resultado: det.resultado
          ? {
              ...det.resultado,
              procesadoPor: det.resultado.procesadoPor
                ? {
                    ...det.resultado.procesadoPor,
                    firmaUrl: resolverFirmaUrl(det.resultado.procesadoPor.firmaUrl),
                  }
                : null,
            }
          : null,
      })),
    };

    // Renderizar PDF en el servidor
    const buffer = await renderToBuffer(
      React.createElement(ReporteDocumentServer, {
        orden: ordenConFirmas,
        fechaImpresa,
        qrCodeUrl,
        logoBase64: logoBase64 ?? undefined,
      }) as React.ReactElement<any>
    );

    const nombreArchivo = `Resultados_${orden.paciente.nombreCompleto.replace(/\s+/g, "_")}_#${ordenId}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${nombreArchivo}"`,
        "Content-Length": buffer.length.toString(),
        // Caché privada por 5 minutos — el PDF no cambia en ese lapso
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error: any) {
    console.error("Error generando PDF en servidor:", error);
    return NextResponse.json(
      { error: `Error interno al generar el PDF: ${error?.message || 'Desconocido'}` },
      { status: 500 }
    );
  }
}

/**
 * Convierte una firmaUrl (que puede ser una URL pública relativa /uploads/...
 * o una URL completa https://...) a una Data URL base64 para react-pdf en servidor.
 */
function resolverFirmaUrl(firmaUrl: string | null): string | null {
  if (!firmaUrl) return null;

  try {
    // Si ya es una Data URL, devolverla tal cual
    if (firmaUrl.startsWith("data:")) return firmaUrl;

    // Si es una ruta relativa al servidor (ej: /uploads/firma.png)
    if (firmaUrl.startsWith("/")) {
      const filePath = path.join(process.cwd(), "public", firmaUrl);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(firmaUrl).toLowerCase().replace(".", "");
        const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
        const base64 = fs.readFileSync(filePath).toString("base64");
        return `data:${mimeType};base64,${base64}`;
      }
    }

    // Si es una URL externa (https://...), devolverla para que react-pdf la resuelva
    if (firmaUrl.startsWith("http")) return firmaUrl;

    return null;
  } catch {
    return null;
  }
}
