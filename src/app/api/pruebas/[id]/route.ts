import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
    const session = await getServerSession(authOptions);
    const labId = (session?.user as any)?.laboratorioId;

    if (!labId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params; 
    const body = await req.json();
    
    // Verificar propiedad (Tenant check)
    const recordExists = await prisma.subcategoriaPrueba.findFirst({
      where: { id: id, laboratorioId: labId }
    });

    if (!recordExists) {
      return NextResponse.json({ error: "No autorizado para modificar este registro" }, { status: 403 });
    }

    // CASO 1: Actualización simple de estado (Activar/Inactivar)
    if (body.activa !== undefined && Object.keys(body).length === 1) {
      const actualizado = await prisma.subcategoriaPrueba.update({
        where: { id_laboratorioId: { id, laboratorioId: labId } },
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

    const idsMantener = body.pruebas.map((p: any) => p.id).filter(Boolean);

    // 2. Validación de códigos repetidos en BD para ESTE laboratorio
    const pruebasExistentes = await prisma.prueba.findMany({
      where: { 
        laboratorioId: labId,
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

    // 3. Validar que el nombre del paquete/perfil no exista ya en otro registro del laboratorio
    const subcatExistente = await prisma.subcategoriaPrueba.findFirst({
      where: { 
        laboratorioId: labId,
        nombre: body.subcategoria.toUpperCase(),
        id: { not: id } 
      }
    });
    if (subcatExistente) {
      return NextResponse.json({ error: `El perfil, paquete o subcategoría con el nombre "${body.subcategoria.toUpperCase()}" ya existe en el sistema.` }, { status: 400 });
    }

    // Buscamos las pruebas que el usuario eliminó en el modal
    const pruebasAEliminar = await prisma.prueba.findMany({
      where: {
        laboratorioId: labId,
        subcategoriaId: id,
        id: { notIn: idsMantener.length > 0 ? idsMantener : [''] }
      },
      include: {
        detallesOrden: { take: 1 } 
      }
    });

    const pruebasEnUso = pruebasAEliminar.filter(p => p.detallesOrden.length > 0);

    if (pruebasEnUso.length > 0) {
      const nombresBloqueados = pruebasEnUso.map(p => p.nombre).join(", ");
      return NextResponse.json({ 
        error: `No puedes borrar "${nombresBloqueados}" porque ya está registrada en el historial de órdenes de pacientes. Si no la ofreces más, inactiva la subcategoría completa.` 
      }, { status: 400 });
    }

    // Buscamos o creamos la Categoría Padre
    const categoria = await prisma.categoriaPrueba.upsert({
      where: { 
        laboratorioId_nombre: {
          laboratorioId: labId,
          nombre: body.categoria.toUpperCase()
        }
      },
      update: {},
      create: { 
        nombre: body.categoria.toUpperCase(),
        laboratorioId: labId
      }
    });

    const pruebasConOrden = body.pruebas.map((p: any, index: number) => ({
      ...p,
      ordenVisual: index + 1
    }));

    const pruebasNuevas = pruebasConOrden.filter((p: any) => !p.id);
    const pruebasParaActualizar = pruebasConOrden.filter((p: any) => p.id);

    const subcatActualizada = await prisma.subcategoriaPrueba.update({
      where: { id_laboratorioId: { id, laboratorioId: labId } },
      data: {
        nombre: body.subcategoria,
        categoria: { connect: { id_laboratorioId: { id: categoria.id, laboratorioId: labId } } },
        esPaquete: body.esPaquete,
        precioUSD: body.esPaquete ? parsePrecioSeguro(body.precioPaqueteUSD) : null,
        pruebas: {
          deleteMany: { id: { notIn: idsMantener } },
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
          update: pruebasParaActualizar.map((p: any) => ({
            where: { id_laboratorioId: { id: p.id, laboratorioId: labId } },
            data: {
              codigo: p.codigo.toUpperCase(),
              nombre: p.nombre.toUpperCase(),
              precioUSD: body.esPaquete ? null : parsePrecioSeguro(p.precioUSD),
              unidades: p.unidades,
              valoresReferencia: p.valoresReferencia || null,
              opcionesPredefinidas: p.opcionesPredefinidas || null,
              ordenVisual: p.ordenVisual,
              categoriaVisual: p.categoriaVisual || null,
              subcategoriaVisual: p.subcategoriaVisual || null
            }
          }))
        }
      },
      include: { pruebas: true }
    });

    return NextResponse.json(subcatActualizada);
  } catch (error: any) {
    console.error("Error al actualizar prueba:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: `Error: Algunos códigos ingresados ya están siendo utilizados en otras subcategorías o pruebas (${error.meta?.target || "código repetido"}). Asegúrate de no duplicar códigos existentes.` }, { status: 400 });
    }
    return NextResponse.json({ error: "Error de servidor al actualizar. Intenta más tarde." }, { status: 500 });
  }
}