import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Función de seguridad para evitar errores NaN en Prisma
const parsePrecioSeguro = (valor: any) => {
  if (valor === null || valor === undefined || valor === "") return null;
  const parseado = parseFloat(valor);
  return isNaN(parseado) ? null : parseado;
};

export async function PUT(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; 
    const body = await req.json();
    
    // CASO 1: Actualización simple de estado (Activar/Inactivar)
    if (body.activa !== undefined && Object.keys(body).length === 1) {
      const actualizado = await prisma.subcategoriaPrueba.update({
        where: { id },
        data: { activa: body.activa }
      });
      return NextResponse.json(actualizado);
    }

    // 1. Validar duplicados dentro del mismo formulario
    const codigos = body.pruebas.map((p: any) => p.codigo.toUpperCase());
    const duplicadosEnForm = codigos.filter((item: string, index: number) => codigos.indexOf(item) !== index);
    if (duplicadosEnForm.length > 0) {
      const repetidos = Array.from(new Set(duplicadosEnForm)).join(", ");
      return NextResponse.json({ error: `Has repetido códigos en la lista (${repetidos}). Cada código debe ser único en la misma estructura.` }, { status: 400 });
    }

    // Filtramos los IDs que vienen del frontend para saber cuáles estamos actualizando
    const idsMantener = body.pruebas.map((p: any) => p.id).filter(Boolean);

    // 2. Validación de códigos repetidos en BD (Excluyendo las pruebas que estamos actualizando)
    const pruebasExistentes = await prisma.prueba.findMany({
      where: { 
        codigo: { in: codigos }, 
        id: { notIn: idsMantener.length > 0 ? idsMantener : [''] } 
      }
    });

    if (pruebasExistentes.length > 0) {
      const conflictos = [];
      for (const pExistente of pruebasExistentes) {
        const pNueva = body.pruebas.find((p: any) => p.codigo.toUpperCase() === pExistente.codigo);
        if (pNueva && pNueva.nombre.trim().toUpperCase() !== pExistente.nombre.trim().toUpperCase()) {
          conflictos.push(`El código ${pExistente.codigo} ya pertenece a "${pExistente.nombre}" y tú intentaste usarlo para "${pNueva.nombre}"`);
        }
      }

      if (conflictos.length > 0) {
        return NextResponse.json({ error: `Error de códigos compartidos: ${conflictos.join(" | ")}.` }, { status: 400 });
      }
    }

    // 2. Validar que el nombre del paquete/perfil no exista ya en otro registro
    const subcatExistente = await prisma.subcategoriaPrueba.findFirst({
      where: { 
        nombre: body.subcategoria.toUpperCase(),
        id: { not: id } 
      }
    });
    if (subcatExistente) {
      return NextResponse.json({ error: `El perfil, paquete o subcategoría con el nombre "${body.subcategoria.toUpperCase()}" ya existe en el sistema.` }, { status: 400 });
    }



    // =========================================================================
    // NUEVA VALIDACIÓN: PREVENIR BORRADO DE PRUEBAS EN USO (Protección Foreing Key)
    // =========================================================================
    // Buscamos las pruebas que el usuario eliminó en el modal (las que NO están en idsMantener)
    const pruebasAEliminar = await prisma.prueba.findMany({
      where: {
        subcategoriaId: id,
        id: { notIn: idsMantener.length > 0 ? idsMantener : [''] } // Evita error si idsMantener está vacío
      },
      include: {
        detallesOrden: { take: 1 } // Solo necesitamos ver si tiene al menos 1 orden asociada
      }
    });

    // Filtramos las que ya tienen al menos un detalle de orden
    const pruebasEnUso = pruebasAEliminar.filter(p => p.detallesOrden.length > 0);

    if (pruebasEnUso.length > 0) {
      const nombresBloqueados = pruebasEnUso.map(p => p.nombre).join(", ");
      return NextResponse.json({ 
        error: `No puedes borrar "${nombresBloqueados}" porque ya está registrada en el historial de órdenes de pacientes. Si no la ofreces más, inactiva la subcategoría completa.` 
      }, { status: 400 });
    }
    // =========================================================================

    // Buscamos o creamos la Categoría Padre
    const categoria = await prisma.categoriaPrueba.upsert({
      where: { nombre: body.categoria.toUpperCase() },
      update: {},
      create: { nombre: body.categoria.toUpperCase() }
    });

    // Mapeamos el orden visual a todas las pruebas antes de separarlas
    const pruebasConOrden = body.pruebas.map((p: any, index: number) => ({
      ...p,
      ordenVisual: index + 1
    }));

    // SEPARAMOS LA LÓGICA: Nuevas vs Existentes
    const pruebasNuevas = pruebasConOrden.filter((p: any) => !p.id);
    const pruebasParaActualizar = pruebasConOrden.filter((p: any) => p.id);

    // Actualizamos la Subcategoría y sus relaciones de forma limpia
    const subcatActualizada = await prisma.subcategoriaPrueba.update({
      where: { id: id },
      data: {
        nombre: body.subcategoria,
        categoriaId: categoria.id,
        esPaquete: body.esPaquete,
        precioUSD: body.esPaquete ? parsePrecioSeguro(body.precioPaqueteUSD) : null,
        pruebas: {
          // 1. Eliminamos las pruebas (Ya validamos que es seguro borrarlas)
          deleteMany: { id: { notIn: idsMantener } },
          
          // 2. Creamos las pruebas nuevas agregadas
          create: pruebasNuevas.map((p: any) => ({
            codigo: p.codigo.toUpperCase(), 
            nombre: p.nombre.toUpperCase(), 
            precioUSD: body.esPaquete ? null : parsePrecioSeguro(p.precioUSD),
            unidades: p.unidades,
            valoresReferencia: p.valoresReferencia || null,
            opcionesPredefinidas: p.opcionesPredefinidas || null,
            activa: true,
            ordenVisual: p.ordenVisual,
            categoriaVisual: p.categoriaVisual || null,
            subcategoriaVisual: p.subcategoriaVisual || null
          })),

          // 3. Actualizamos las pruebas que ya existían
          update: pruebasParaActualizar.map((p: any) => ({
            where: { id: p.id },
            data: { 
              codigo: p.codigo.toUpperCase(), 
              nombre: p.nombre.toUpperCase(), 
              precioUSD: body.esPaquete ? null : parsePrecioSeguro(p.precioUSD),
              unidades: p.unidades, 
              valoresReferencia: p.valoresReferencia,
              opcionesPredefinidas: p.opcionesPredefinidas || null,
              ordenVisual: p.ordenVisual,
              categoriaVisual: p.categoriaVisual || null,
              subcategoriaVisual: p.subcategoriaVisual || null
            }
          }))
        }
      },
      include: { categoria: true, pruebas: true }
    });
    
    return NextResponse.json(subcatActualizada);
  } catch (error: any) {
    console.error("Error en PUT /api/pruebas/[id]:", error);
    if (error.code === 'P2002') {
      const target = error.meta?.target || "un campo";
      return NextResponse.json({ error: `Error: Ya existe un registro con ese nombre o código (${target}).` }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Error al actualizar registro" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.claveMaestra !== process.env.CLAVE_MAESTRA) {
      return NextResponse.json({ error: "Clave maestra incorrecta." }, { status: 401 });
    }

    await prisma.subcategoriaPrueba.delete({ where: { id: id } });
    return NextResponse.json({ message: "Subcategoría eliminada correctamente." });
  } catch (error: any) {
    const isForeignKeyError = error.code === 'P2014' || error.code === 'P2003' || (error.message && error.message.includes('foreign key constraint'));
    
    if (isForeignKeyError) {
      return NextResponse.json(
        { error: "No puedes eliminar esta subcategoría porque algunas de sus pruebas ya están registradas en el historial de órdenes de pacientes." }, 
        { status: 400 }
      );
    }
    console.error("Error detallado al eliminar subcategoria:", error);
      return NextResponse.json({ error: `Error interno al eliminar la subcategoría: ${error.message} (Código: ${error.code})` }, { status: 500 });
    }
}