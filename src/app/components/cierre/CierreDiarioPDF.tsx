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
    padding: "10mm 15mm 10mm 15mm",
    fontFamily: "Inter", 
    fontSize: 9,
    color: "#1d1d1f",
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1d1d1f",
    paddingBottom: 6,
  },
  logo: {
    width: 60,
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  titleEmpresa: {
    fontFamily: "Montserrat",
    fontSize: 14,
    fontWeight: 900,
    color: "#1d1d1f",
    letterSpacing: 1,
    marginBottom: 2,
  },
  subtitleBold: {
    fontSize: 9,
    fontFamily: "Inter",
    fontWeight: 700,
    color: "#1d1d1f",
    marginTop: 2,
    marginBottom: 3,
  },
  subtitleHeader: {
    fontSize: 8,
    color: "#475569",
    marginTop: 2,
  },
  titleDocumento: {
    fontFamily: "Montserrat",
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 4,
  },
  badgeEstado: {
    alignSelf: "center",
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 15,
    backgroundColor: "#f1f5f9",
    color: "#475569"
  },
  badgeEstadoCerrado: {
    backgroundColor: "#ecfdf5",
    color: "#047857"
  },
  badgeEstadoPendiente: {
    backgroundColor: "#fffbeb",
    color: "#b45309"
  },
  gridResumen: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 15,
    gap: 12,
  },
  cardResumen: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#f8fafc",
  },
  cardResumenLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  cardResumenValue: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
    marginTop: 2,
  },
  cardResumenSubvalue: {
    fontSize: 12,
    fontWeight: 700,
    color: "#475569",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: "#e2e8f0",
    padding: "6px 10px",
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 4,
    color: "#1e293b",
  },
  table: {
    width: "auto",
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableHeader: {
    backgroundColor: "#f8fafc",
  },
  tableCellHeader: {
    padding: 6,
    fontSize: 9,
    fontWeight: 700,
    color: "#475569",
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
  },
  firmaSeccion: {
    marginTop: "auto",
    paddingTop: 20,
    alignItems: "center",
  },
  lineaFirma: {
    width: 180,
    borderTopWidth: 1,
    borderTopColor: "#1d1d1f",
    textAlign: "center",
    paddingTop: 3,
  },
  textoFirmaPrincipal: {
    fontSize: 9,
    fontWeight: 700,
  },
  flexSpace: {
    flexDirection: "row",
    justifyContent: "space-between",
  }
});

const formatMoney = (amount: number, isBs = false) => {
  const validAmount = Number(amount) || 0;
  if (isBs) return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(validAmount).replace('VES', 'Bs.');
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(validAmount);
};

const formatearMetodo = (str: string) => {
  if (!str || str === "NINGUNO") return "Ninguno";
  return str.split('_').map(p => (p === 'USD' || p === 'BS') ? p : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
};

export default function CierreDiarioPDF({ data, tasaBCV }: { data: any, tasaBCV: number }) {
  const fechaGeneracion = new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" });
  const esCerrado = data?.yaCerroHoy;

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

        {/* TÍTULO Y ESTADO */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 15 }}>
          <Text style={[styles.titleDocumento, { marginBottom: 0, marginRight: 10 }]}>{(data?.tituloCaja || "Cierre de Caja").toUpperCase()}</Text>
          <Text style={[styles.badgeEstado, esCerrado ? styles.badgeEstadoCerrado : styles.badgeEstadoPendiente, { marginBottom: 0 }]}>
            ESTADO: {esCerrado ? "TURNO CERRADO Y ARQUEADO" : "CAJA PENDIENTE"}
          </Text>
        </View>

        <View style={[styles.flexSpace, { marginBottom: 15 }]}>
          <Text style={{ fontSize: 9, fontWeight: 700, color: "#64748b" }}>Tasa BCV Aplicada: {formatMoney(tasaBCV, true)}</Text>
          <Text style={{ fontSize: 9, fontWeight: 700, color: "#64748b" }}>Generado: {fechaGeneracion}</Text>
        </View>

        {/* RESUMEN FINANCIERO */}
        <View style={styles.gridResumen}>
          
          {/* DEBERÍA HABER (SISTEMA) */}
          <View style={[styles.cardResumen, { borderColor: "#bae6fd", backgroundColor: "#f0f9ff" }]}>
            <Text style={styles.cardResumenLabel}>Debería Haber (Sistema)</Text>
            <Text style={[styles.cardResumenValue, { color: "#0369a1", marginTop: 0 }]}>
              {formatMoney(esCerrado ? (data?.resumen?.totalCalculadoUSD || 0) : (data?.resumen?.totalEnCajaUSD || 0))} 
              <Text style={[styles.cardResumenSubvalue, { color: "#0369a1" }]}> / {formatMoney(esCerrado ? (data?.resumen?.totalCalculadoBS || 0) : (data?.resumen?.totalEnCajaBS || 0), true)}</Text>
            </Text>
          </View>

          {/* LÍQUIDO REAL (DECLARADO) - Solo si ya cerró */}
          {esCerrado && (
            <View style={[styles.cardResumen, { borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" }]}>
              <Text style={styles.cardResumenLabel}>Líquido Real (Declarado)</Text>
              <Text style={[styles.cardResumenValue, { color: "#166534", marginTop: 0 }]}>
                {formatMoney(data?.resumen?.totalDeclaradoUSD || 0)} 
                <Text style={[styles.cardResumenSubvalue, { color: "#166534" }]}> / {formatMoney(data?.resumen?.totalDeclaradoBS || 0, true)}</Text>
              </Text>
            </View>
          )}

          {/* DESCUADRE - Solo si ya cerró */}
          {esCerrado && (
            <View style={[styles.cardResumen, { borderColor: (data?.resumen?.descuadreUSD === 0) ? "#e2e8f0" : ((data?.resumen?.descuadreUSD || 0) < 0 ? "#fecaca" : "#fef08a"), backgroundColor: (data?.resumen?.descuadreUSD === 0) ? "#f8fafc" : ((data?.resumen?.descuadreUSD || 0) < 0 ? "#fef2f2" : "#fefce8") }]}>
              <Text style={styles.cardResumenLabel}>Descuadre</Text>
              <Text style={[styles.cardResumenValue, { color: (data?.resumen?.descuadreUSD === 0) ? "#475569" : ((data?.resumen?.descuadreUSD || 0) < 0 ? "#b91c1c" : "#854d0e"), marginTop: 0 }]}>
                {data?.resumen?.descuadreUSD > 0 ? "+" : ""}{formatMoney(data?.resumen?.descuadreUSD || 0)} 
                <Text style={[styles.cardResumenSubvalue, { color: (data?.resumen?.descuadreUSD === 0) ? "#475569" : ((data?.resumen?.descuadreUSD || 0) < 0 ? "#b91c1c" : "#854d0e") }]}> / {data?.resumen?.descuadreBS > 0 ? "+" : ""}{formatMoney(data?.resumen?.descuadreBS || 0, true)}</Text>
              </Text>
            </View>
          )}

          {/* CUENTAS POR COBRAR */}
          <View style={[styles.cardResumen, { borderColor: "#fed7aa", backgroundColor: "#fff7ed" }]}>
            <Text style={styles.cardResumenLabel}>Cuentas por Cobrar</Text>
            <Text style={[styles.cardResumenValue, { color: "#c2410c", marginTop: 0 }]}>
              {formatMoney(data?.resumen?.cuentasPorCobrarUSD || 0)} <Text style={[styles.cardResumenSubvalue, { color: "#c2410c" }]}> / {formatMoney(data?.resumen?.cuentasPorCobrarBS || 0, true)}</Text>
            </Text>
          </View>
        </View>

        {/* DESGLOSE POR MÉTODOS */}
        <Text style={styles.sectionTitle}>INGRESOS POR MÉTODOS DE PAGO</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellHeader, { flex: 2 }]}>Método</Text>
            <Text style={[styles.tableCellHeader, { flex: 1, textAlign: "right" }]}>Monto USD</Text>
            <Text style={[styles.tableCellHeader, { flex: 1, textAlign: "right" }]}>Monto BS</Text>
          </View>
          {data?.desglosesCaja?.map((box: any, i: number) => (
            <View style={styles.tableRow} key={i}>
              <Text style={[styles.tableCell, { flex: 2, fontWeight: 700 }]}>{formatearMetodo(box.nombre)}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{formatMoney(box.ingresosUSD)}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{formatMoney(box.ingresosBS, true)}</Text>
            </View>
          ))}
          {(!data?.desglosesCaja || data?.desglosesCaja.length === 0) && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 4, textAlign: "center", color: "#94a3b8" }]}>No hay ingresos registrados</Text>
            </View>
          )}
        </View>

        {/* FLUJO DE PACIENTES */}
        <Text style={styles.sectionTitle}>FLUJO DE PACIENTES ATENDIDOS ({data?.resumen?.pacientesAtendidos || 0})</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellHeader, { flex: 1 }]}>ID</Text>
            <Text style={[styles.tableCellHeader, { flex: 3 }]}>Paciente</Text>
            <Text style={[styles.tableCellHeader, { flex: 2 }]}>Método</Text>
            <Text style={[styles.tableCellHeader, { flex: 2, textAlign: "right" }]}>Total</Text>
          </View>
          {data?.flujoPacientes?.map((p: any, i: number) => (
            <View style={styles.tableRow} key={i}>
              <Text style={[styles.tableCell, { flex: 1 }]}>#{p.ordenId}</Text>
              <Text style={[styles.tableCell, { flex: 3 }]}>{p.paciente}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{formatearMetodo(p.metodoUsado)}</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: "right" }]}>
                {formatMoney(p.totalUSD)} / {formatMoney(p.totalBS, true)}
              </Text>
            </View>
          ))}
          {(!data?.flujoPacientes || data?.flujoPacientes.length === 0) && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 8, textAlign: "center", color: "#94a3b8" }]}>No hay pacientes registrados</Text>
            </View>
          )}
        </View>

        {/* OBSERVACIONES */}
        {data?.observaciones && (
          <>
            <Text style={styles.sectionTitle}>OBSERVACIONES</Text>
            <View style={[styles.table, { marginBottom: 15 }]}>
              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.tableCell, { flex: 1, color: "#1e293b", padding: 10, backgroundColor: "#f8fafc", borderRadius: 4 }]}>
                  "{data.observaciones}"
                </Text>
              </View>
            </View>
          </>
        )}

        {/* FIRMA Y SELLO */}
        <View style={styles.firmaSeccion}>
          <View style={styles.lineaFirma}>
            <Text style={styles.textoFirmaPrincipal}>Firma del responsable</Text>
          </View>
        </View>
        
      </Page>
    </Document>
  );
}
