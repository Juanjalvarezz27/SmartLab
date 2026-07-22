import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";

// ---------------------------------------------------------------------------
// 1. REGISTRO DE FUENTES
// ---------------------------------------------------------------------------
Font.register({
  family: 'Montserrat',
  src: '/fonts/montserrat-900.ttf' 
});

Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/inter-400.ttf', fontWeight: 400 },
    { src: '/fonts/inter-700.ttf', fontWeight: 700 }
  ]
});

// ---------------------------------------------------------------------------
// 2. ESTILOS DEL DOCUMENTO (OPTIMIZADOS PARA ESPACIO)
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  page: {
    padding: "15mm 25mm 20mm 20mm", // Compactado padding superior
    fontFamily: "Inter", 
    fontSize: 11, // Fuente general ligeramente más pequeña
    color: "#1d1d1f",
    lineHeight: 1.5, // Interlineado más ajustado
  },
  header: {
    alignItems: "center",
    marginBottom: 20, // Reducido margen con el título
    borderBottomWidth: 1, // Línea más fina
    borderBottomColor: "#1d1d1f",
    paddingBottom: 10, // Reducido espacio interno
  },
  logo: {
    width: 80, // Logo mucho más pequeño y discreto
    marginBottom: 8,
  },
  titleLaboratorio: {
    fontFamily: "Montserrat",
    fontSize: 14, // Título de laboratorio compactado
    color: "#1d1d1f",
    letterSpacing: 1,
  },
  subtitleHeader: {
    fontSize: 9, // Subtítulos más pequeños
    color: "#1d1d1f",
    marginTop: 2,
    fontWeight: 400,
  },
  titleDocumento: {
    fontFamily: "Montserrat",
    fontSize: 14, // Título compactado
    textAlign: "center",
    letterSpacing: 2,
    textDecoration: "underline",
    marginBottom: 25, // Reducido margen con el cuerpo
  },
  cuerpo: {
    textAlign: "justify",
    marginBottom: 15, // Menos espacio entre párrafos
  },
  textoDestacado: {
    fontWeight: 700, 
  },
  listaPruebas: {
    marginVertical: 10, // Lista más compacta
    paddingLeft: 25,
  },
  itemPrueba: {
    fontSize: 10, // Pruebas ligeramente más pequeñas
    fontWeight: 700,
    marginBottom: 3,
  },
  firmaSeccion: {
    marginTop: "auto", // Empuja al final pero con menos espacio extra
    paddingTop: 40,
    alignItems: "center",
  },
  lineaFirma: {
    width: 200,
    borderTopWidth: 1,
    borderTopColor: "#1d1d1f",
    textAlign: "center",
    paddingTop: 5,
  },
  textoFirmaPrincipal: {
    fontSize: 10,
    fontWeight: 700,
  },
  textoFirmaSecundario: {
    fontSize: 8,
    color: "#1d1d1f",
    marginTop: 1,
    fontWeight: 400,
  }
});

// ---------------------------------------------------------------------------
// 3. COMPONENTE DEL PDF
// ---------------------------------------------------------------------------
export default function ConstanciaPDF({ orden }: { orden: any }) {
  const fechaOrden = new Date(orden.fechaCreacion);
  const fechaFormateada = fechaOrden.toLocaleDateString("es-VE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Caracas"
  });

  const hoy = new Date();
  const fechaHoyStr = hoy.toLocaleDateString("es-VE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Caracas"
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* MEMBRETE COMPACTADO */}
        <View style={styles.header}>
          <Image src="/Logo2.png" style={styles.logo} />
          <Text style={styles.titleLaboratorio}>LABORATORIO CLÍNICO LEYMA C.A.</Text>
          <Text style={styles.subtitleHeader}>RIF: J - 508463315</Text>
          <Text style={styles.subtitleHeader}>Avenida Coro, Local 4-79, sector Santa Rosa</Text>
        </View>

        {/* TÍTULO */}
        <Text style={styles.titleDocumento}>CONSTANCIA DE ASISTENCIA</Text>

        {/* CUERPO */}
        <View style={styles.cuerpo}>
          <Text>
            Quien suscribe, hace constar por medio de la presente que el(la) ciudadano(a){" "}
            <Text style={styles.textoDestacado}>{orden.paciente.nombreCompleto.toUpperCase()}</Text>, titular de la
            Cédula de Identidad Nro. <Text style={styles.textoDestacado}>V-{orden.paciente.cedula || "S/N"}</Text>,
            asistió a las instalaciones de Laboratorio Clínico LEYMA C.A. el día{" "}
            <Text style={styles.textoDestacado}>{fechaFormateada}</Text> (Según Orden N°{" "}
            {orden.id.toString().padStart(5, "0")}), con el fin de realizarse los siguientes exámenes de laboratorio:
          </Text>
        </View>

        {/* LISTA DE PRUEBAS COMPACTA */}
        <View style={styles.listaPruebas}>
          {orden.examenesResumen?.map((examen: any, idx: number) => (
            <Text key={idx} style={styles.itemPrueba}>
              • {examen.nombre.toUpperCase()}
            </Text>
          ))}
        </View>

        {/* PIE DE CUERPO */}
        <View style={styles.cuerpo}>
          <Text>
            Constancia que se expide a petición de la parte interesada en Trujillo, a los {fechaHoyStr}.
          </Text>
        </View>

        {/* FIRMA Y SELLO */}
        <View style={styles.firmaSeccion}>
          <View style={styles.lineaFirma}>
            <Text style={styles.textoFirmaPrincipal}>Lic. Bioanalista Responsable</Text>
          </View>
        </View>
        
      </Page>
    </Document>
  );
}