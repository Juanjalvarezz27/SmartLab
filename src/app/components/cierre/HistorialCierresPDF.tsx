import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";

// ---------------------------------------------------------------------------
// REGISTRO DE FUENTES
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
// ESTILOS DEL DOCUMENTO
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  page: {
    padding: "5mm 15mm",
    fontFamily: "Inter",
    fontSize: 8,
    color: "#1d1d1f",
    lineHeight: 1.4,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 10,
  },
  logo: {
    width: 55,
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  titleEmpresa: {
    fontFamily: "Montserrat",
    fontSize: 14,
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: 1,
  },
  subtitleBold: {
    fontSize: 9,
    fontFamily: "Inter",
    fontWeight: 700,
    color: "#334155",
    marginTop: 2,
    marginBottom: 2,
  },
  subtitleHeader: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 1,
  },
  titleDocumento: {
    fontFamily: "Montserrat",
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 10,
    color: "#0f172a",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 8,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: "Montserrat",
    fontWeight: 900,
    color: "#0f172a",
    marginRight: 8,
  },
  infoValue: {
    fontSize: 8,
    color: "#64748b",
    marginRight: 8,
  },
  badge: {
    padding: "2 6",
    borderRadius: 6,
    fontSize: 7,
    fontWeight: 900,
  },
  badgeSuccess: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  badgeError: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  financialRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    padding: 6,
  },
  finBlock: {
    flex: 1,
    alignItems: "center",
  },
  finDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 2,
  },
  finLabel: {
    fontSize: 7,
    color: "#64748b",
    textTransform: "uppercase",
    fontWeight: 700,
    marginBottom: 2,
  },
  finUSD: {
    fontSize: 9,
    fontWeight: 900,
    color: "#0f172a",
  },
  finBS: {
    fontSize: 8,
    color: "#64748b",
  },
  emptyState: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: 20,
    fontSize: 10,
  }
});

const formatMoney = (amount: number, isBs = false) => {
  const validAmount = Number(amount) || 0;
  if (isBs) return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(validAmount).replace('VES', 'Bs.');
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(validAmount);
};

export default function HistorialCierresPDF({ historial }: { historial: any[] }) {
  const fechaGeneracion = new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* MEMBRETE */}
        <View style={styles.header}>
          <Image src="/Logo2.png" style={styles.logo} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.titleEmpresa}>LEYMA C.A.</Text>
            <Text style={styles.subtitleBold}>Laboratorio clínico bacteriológico</Text>
            <Text style={styles.subtitleHeader}>RIF: J - 508463315</Text>
            <Text style={styles.subtitleHeader}>Avenida Coro, Local 4-79, sector Santa Rosa</Text>
          </View>
        </View>

        {/* TÍTULO */}
        <Text style={styles.titleDocumento}>HISTORIAL DE CIERRES DE CAJA</Text>

        {/* LISTA BALANCEADA */}
        <View>
          {historial.map((c: any, i: number) => {
            const esDescuadrado = c.descuadreUSD !== 0 || c.descuadreBS !== 0;
            const diaApertura = new Date(c.fechaApertura).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: '2-digit' });
            const horaApertura = new Date(c.fechaApertura).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
            const horaCierre = new Date(c.fechaCierre).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

            return (
              <View style={styles.card} key={i} wrap={false}>
                
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{diaApertura}</Text>
                  <Text style={styles.infoValue}>• {c.realizadoPor?.nombre || "N/A"}</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={[styles.badge, esDescuadrado ? styles.badgeError : styles.badgeSuccess]}>
                    {esDescuadrado ? "DESCUADRE" : "CUADRADO"}
                  </Text>
                </View>

                <View style={[styles.financialRow, esDescuadrado ? { backgroundColor: "#fef2f2", borderColor: "#fecaca" } : {}]}>
                  <View style={styles.finBlock}>
                    <Text style={styles.finLabel}>Calculado (Sis)</Text>
                    <Text style={styles.finUSD}>
                      {formatMoney(c.totalCalculadoUSD)} <Text style={styles.finBS}>- Bs {formatMoney(c.totalCalculadoBS, true)}</Text>
                    </Text>
                  </View>
                  <View style={styles.finDivider} />
                  <View style={styles.finBlock}>
                    <Text style={styles.finLabel}>Declarado (Físico)</Text>
                    <Text style={styles.finUSD}>
                      {formatMoney(c.totalDeclaradoUSD)} <Text style={styles.finBS}>- Bs {formatMoney(c.totalDeclaradoBS, true)}</Text>
                    </Text>
                  </View>
                  <View style={styles.finDivider} />
                  <View style={styles.finBlock}>
                    <Text style={[styles.finLabel, esDescuadrado ? { color: "#991b1b" } : { color: "#166534" }]}>Diferencia</Text>
                    <Text style={[styles.finUSD, esDescuadrado ? { color: "#dc2626" } : { color: "#16a34a" }]}>
                      {formatMoney(c.descuadreUSD)} <Text style={esDescuadrado ? { color: "#dc2626", fontSize: 8, fontWeight: 400 } : { color: "#16a34a", fontSize: 8, fontWeight: 400 }}>- Bs {formatMoney(c.descuadreBS, true)}</Text>
                    </Text>
                  </View>
                </View>

                {c.observaciones && (
                  <View style={{ marginTop: 6, padding: 6, backgroundColor: "#f8fafc", borderRadius: 4, borderWidth: 1, borderColor: "#e2e8f0" }}>
                    <Text style={{ fontSize: 7, color: "#64748b", fontWeight: 700, marginBottom: 2, textTransform: "uppercase" }}>Observaciones</Text>
                    <Text style={{ fontSize: 8, color: "#334155" }}>"{c.observaciones}"</Text>
                  </View>
                )}
              </View>
            )
          })}

          {(!historial || historial.length === 0) && (
            <Text style={styles.emptyState}>No hay cierres en el rango seleccionado</Text>
          )}
        </View>
        
      </Page>
    </Document>
  );
}
