import { PrismaClient } from '@prisma/client';

export async function seedSubcategorias(prisma: PrismaClient) {
  console.log('Sembrando Subcategorías de Pruebas...');

  const subcategorias = [
    {
      id: 'cmq3vszy2000b3s8wmpuireuz',
      nombre: 'Química Sanguínea',
      activa: true,
      esPaquete: false,
      precioUSD: null,
      categoriaId: 2
    },
    {
      id: 'cmq3vti6o00253s8wvplzq8sb',
      nombre: 'Bilirrubina Total y Fraccionada',
      activa: true,
      esPaquete: true,
      precioUSD: 4.5,
      categoriaId: 2
    },
    {
      id: 'cmq3vtku2002d3s8wdunm8mfe',
      nombre: 'Proteínas Totales y Fraccionadas',
      activa: true,
      esPaquete: true,
      precioUSD: 3.5,
      categoriaId: 2
    },
    {
      id: 'cmq3vtnh7002l3s8wbijg5rmh',
      nombre: 'Transaminasas',
      activa: true,
      esPaquete: true,
      precioUSD: 4.0,
      categoriaId: 2
    },
    {
      id: 'cmq415fcs0001ky04fyupwk7z',
      nombre: 'Perfil Lipidico',
      activa: true,
      esPaquete: true,
      precioUSD: 15.0,
      categoriaId: 2
    },
    {
      id: 'cmq45knhv0001kz04wcoyyare',
      nombre: 'Quimica Urinaria',
      activa: true,
      esPaquete: false,
      precioUSD: null,
      categoriaId: 2
    },
    {
      id: 'cmq46a7sr0001l7044au5kz8o',
      nombre: 'Depuracion de Creatinina',
      activa: true,
      esPaquete: true,
      precioUSD: 10.0,
      categoriaId: 3
    },
    {
      id: 'cmq4769540001jr04b9sfnn9r',
      nombre: 'Proteinuria',
      activa: true,
      esPaquete: true,
      precioUSD: 6.0,
      categoriaId: 3
    },
    {
      id: 'cmq48bhdq0001l204trmuj5tr',
      nombre: 'Biometria Hematica',
      activa: true,
      esPaquete: true,
      precioUSD: 8.0,
      categoriaId: 1
    },
    {
      id: 'cmq48p8p40006l404asnvhzg8',
      nombre: 'Hematologia Completa',
      activa: true,
      esPaquete: true,
      precioUSD: 3.0,
      categoriaId: 1
    },
    {
      id: 'cmq48xw5k000el404ibw8et6n',
      nombre: 'Velocidad de Sedimentacion Globular',
      activa: true,
      esPaquete: false,
      precioUSD: null,
      categoriaId: 1
    },
    {
      id: 'cmq4923qs000hl4046r8jqh7d',
      nombre: 'Descripcion de frotis de sangre periferica',
      activa: true,
      esPaquete: true,
      precioUSD: 6.0,
      categoriaId: 1
    },
    {
      id: 'cmq49a5ew0001ju04arehdhrt',
      nombre: 'Grupo Sanguineo',
      activa: true,
      esPaquete: false,
      precioUSD: null,
      categoriaId: 1
    },
    {
      id: 'cmq49pfqx0001l704jgwc8z3i',
      nombre: 'Tiroideas',
      activa: true,
      esPaquete: false,
      precioUSD: null,
      categoriaId: 5
    },
    {
      id: 'cmq49xx900009l704tdj4p3vw',
      nombre: 'Perfil tiroideo',
      activa: true,
      esPaquete: true,
      precioUSD: 21.0,
      categoriaId: 5
    },
    {
      id: 'cmq4aeq2a0001ld04z03cv0ia',
      nombre: 'Insulina',
      activa: true,
      esPaquete: false,
      precioUSD: null,
      categoriaId: 5
    },
    {
      id: 'cmq4ani5q0001js04sjkpw9h1',
      nombre: 'Cortisol',
      activa: true,
      esPaquete: false,
      precioUSD: null,
      categoriaId: 5
    },
    {
      id: 'cmq4b1gtj0001l804ykoa7qn7',
      nombre: 'Perfil Prostatico',
      activa: true,
      esPaquete: true,
      precioUSD: 20.0,
      categoriaId: 2
    },
    {
      id: 'cmq4ccoib0001jy04u3qcftsj',
      nombre: 'Inmunologia',
      activa: true,
      esPaquete: false,
      precioUSD: null,
      categoriaId: 2
    },
    {
      id: 'cmq5gk2c40001jo049ue1cid9',
      nombre: 'Tiempos',
      activa: true,
      esPaquete: false,
      precioUSD: null,
      categoriaId: 7
    },
    {
      id: 'cmq5gmeze0008jo04j94up87o',
      nombre: 'Inmunologia',
      activa: true,
      esPaquete: false,
      precioUSD: null,
      categoriaId: 2
    },
    {
      id: 'cmq5h1l1m0001jj04jnaft9ur',
      nombre: 'Analisis Macroscopico',
      activa: true,
      esPaquete: true,
      precioUSD: 1.5,
      categoriaId: 8
    },
    {
      id: 'cmq5hdau30001jl047ypgzlk5',
      nombre: 'Analisis Microscopico',
      activa: true,
      esPaquete: true,
      precioUSD: 1.0,
      categoriaId: 8
    },
    {
      id: 'cmq5jd22x0001ky04km7ouaxp',
      nombre: 'Analisis Macroscopico',
      activa: true,
      esPaquete: true,
      precioUSD: 1.5,
      categoriaId: 10
    },
    {
      id: 'cmq5jh6hv0008ky04vikziuch',
      nombre: 'Analisis Microscopico',
      activa: true,
      esPaquete: true,
      precioUSD: 1.0,
      categoriaId: 10
    }
  ];

  for (const sub of subcategorias) {
    await prisma.subcategoriaPrueba.upsert({
      where: { id: sub.id },
      update: {
        nombre: sub.nombre,
        activa: sub.activa,
        esPaquete: sub.esPaquete,
        precioUSD: sub.precioUSD,
        categoriaId: sub.categoriaId
      },
      create: sub,
    });
  }
}