import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuarioSesion = await prisma.usuario.findUnique({ where: { correo: session.user.email } });
    if (!usuarioSesion) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json();
    const { ordenId, resultados, accion, pin, bioanalistaId, notasSubcategoria } = body; 

    if (!ordenId || !resultados || resultados.length === 0) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const ordenExistente = await prisma.orden.findUnique({
      where: { id: ordenId },
      include: { paciente: true }
    });

    if (!ordenExistente) {
      throw new Error("Orden inválida: La orden no existe en el sistema.");
    }

    if (!ordenExistente.pacienteId || !ordenExistente.paciente) {
      throw new Error("Orden inválida: Falta relación crítica con el paciente.");
    }

    let validadorId = usuarioSesion.id;
    let validacionActiva = false;

    if (accion === "EDITAR") {
      if (!pin) return NextResponse.json({ error: "Falta la clave maestra." }, { status: 400 });
      if (pin !== process.env.CLAVE_MAESTRA) {
        return NextResponse.json({ error: "Clave maestra incorrecta." }, { status: 403 });
      }
      validacionActiva = true;
    } else if (accion === "FIRMAR") {
      if (!pin || !bioanalistaId) return NextResponse.json({ error: "Faltan credenciales de validación." }, { status: 400 });
      
      const bioanalista = await prisma.usuario.findFirst({ 
        where: { id: bioanalistaId, pinFirma: pin, activo: true } 
      });
      
      if (!bioanalista) return NextResponse.json({ error: "PIN incorrecto para la bioanalista seleccionada." }, { status: 403 });
      
      validadorId = bioanalista.id;
      validacionActiva = true;
    }

    await prisma.$transaction(async (tx) => {
      // Optimizacion: buscar todos los resultados actuales de una sola vez
      const detalleIds = resultados.map((r: any) => r.detalleOrdenId);
      const existingResultsList = await tx.resultadoPrueba.findMany({
        where: { detalleOrdenId: { in: detalleIds } }
      });
      const existingResultsMap = new Map(existingResultsList.map(r => [r.detalleOrdenId, r]));

      for (const res of resultados) {
        const currentRes = existingResultsMap.get(res.detalleOrdenId);
        
        // Si ya está firmado por completo y no es edición, NO LO TOCAMOS
        if (currentRes?.firmado && accion !== "EDITAR") continue;

        // Determinamos si ESTE examen específico debe ser firmado en esta pasada
        // Si es edición, permitiremos que todos los enviados se guarden sin cambiar las firmas originales
        const debeFirmarEste = validacionActiva && (res.marcadoParaFirma || accion === "EDITAR");

        const nextUsuarioId = accion === "EDITAR" ? (currentRes?.usuarioId || usuarioSesion.id) : (debeFirmarEste ? validadorId : (currentRes?.usuarioId || usuarioSesion.id));
        const nextFirmado = accion === "EDITAR" ? (currentRes?.firmado ?? true) : (debeFirmarEste ? true : (currentRes?.firmado || false));
        const nextFecha = accion === "EDITAR" ? (currentRes?.fechaProcesado || new Date()) : (debeFirmarEste ? new Date() : (currentRes?.fechaProcesado || new Date()));

        // UPSERT DEL ENCABEZADO (ResultadoPrueba)
        const resPrueba = await tx.resultadoPrueba.upsert({
          where: { detalleOrdenId: res.detalleOrdenId },
          update: {
            observaciones: res.observaciones || null,
            valoresReferencia: res.valoresReferencia || null,
            usuarioId: nextUsuarioId,
            firmado: nextFirmado,
            fechaProcesado: nextFecha,
          },
          create: {
            detalleOrdenId: res.detalleOrdenId,
            usuarioId: nextUsuarioId,
            firmado: nextFirmado,
            observaciones: res.observaciones || null,
            valoresReferencia: res.valoresReferencia || null,
            fechaProcesado: nextFecha,
          }
        });

        // OPTIMIZACIÓN: Prevenir Dead Tuples y Bloat
        // Buscamos los valores que ya existen para este resultado
        const existingValores = await tx.valorResultado.findMany({
          where: { resultadoId: resPrueba.id }
        });
        
        // Agrupamos los IDs existentes por pruebaId para manejar múltiples valores del mismo parámetro (ej. con el botón +)
        const existingValoresByPrueba = new Map<string, string[]>();
        for (const ev of existingValores) {
          if (!existingValoresByPrueba.has(ev.pruebaId)) {
            existingValoresByPrueba.set(ev.pruebaId, []);
          }
          existingValoresByPrueba.get(ev.pruebaId)!.push(ev.id);
        }

        // Iteramos los valores que vienen del frontend y actualizamos o creamos uno por uno.
        // Esto permite a PostgreSQL hacer un HOT (Heap-Only-Tuple) update, sin afectar los índices,
        // lo que ahorra un masivo espacio de disco en comparación al deleteMany + create de antes.
        for (const v of res.valores) {
          const idsForPrueba = existingValoresByPrueba.get(v.pruebaId);
          let valorId = null;
          
          if (idsForPrueba && idsForPrueba.length > 0) {
             valorId = idsForPrueba.shift(); // Tomamos el primer ID disponible y lo quitamos del array
          }

          if (valorId) {
             await tx.valorResultado.update({
               where: { id: valorId },
               data: { valorIngresado: v.valorIngresado }
             });
          } else {
             await tx.valorResultado.create({
               data: {
                 resultadoId: resPrueba.id,
                 pruebaId: v.pruebaId,
                 valorIngresado: v.valorIngresado
               }
             });
          }
        }
        
        // Eliminamos los valores sobrantes (si el usuario quitó resultados con el botón -)
        const idsToDelete: string[] = [];
        for (const ids of existingValoresByPrueba.values()) {
           idsToDelete.push(...ids);
        }
        
        if (idsToDelete.length > 0) {
           await tx.valorResultado.deleteMany({
             where: { id: { in: idsToDelete } }
           });
        }
      }

      // Verificamos si absolutamente TODOS los detalles de la orden ya están FIRMADOS
      const allDetalles = await tx.detalleOrden.findMany({
        where: { ordenId },
        include: { resultado: true }
      });
      
      const allSigned = allDetalles.length > 0 && allDetalles.every(d => d.resultado?.firmado === true);

      // Actualizar estado de la orden
      await tx.orden.update({
        where: { id: ordenId },
        data: { resultadosCompletados: allSigned }
      });

      // Procesar notas por subcategoría si vienen en el payload
      if (notasSubcategoria && notasSubcategoria.length > 0) {
        for (const ns of notasSubcategoria) {
          if (!ns.nota || ns.nota.trim() === '') {
            await tx.notaSubcategoriaOrden.deleteMany({
              where: { ordenId: ordenId, subcategoria: ns.subcategoria }
            });
          } else {
            await tx.notaSubcategoriaOrden.upsert({
              where: { 
                ordenId_subcategoria: { ordenId: ordenId, subcategoria: ns.subcategoria } 
              },
              update: { nota: ns.nota },
              create: { ordenId: ordenId, subcategoria: ns.subcategoria, nota: ns.nota }
            });
          }
        }
      }
    }, {
      // Reducción drástica de timeout para evitar bloqueos eternos (locks)
      maxWait: 5000,   // Espera máxima para adquirir candado: 5 segundos
      timeout: 10000   // Tiempo máximo para completar toda la transacción: 10 segundos
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al guardar resultados:", error);
    return NextResponse.json({ error: `Error interno al procesar los resultados: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}