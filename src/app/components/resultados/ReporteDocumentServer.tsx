// ReporteDocumentServer.tsx
// Versión del ReporteDocument para uso en el SERVIDOR (API routes).
// NO tiene "use client". Acepta logoBase64 como prop.

import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";

import path from "path";

// Registro de fuentes
Font.register({
  family: "Montserrat",
  src: path.join(process.cwd(), "public", "fonts", "montserrat-900.ttf"),
});

Font.register({
  family: "Inter",
  fonts: [
    {
      src: path.join(process.cwd(), "public", "fonts", "inter-400.ttf"),
      fontWeight: 400,
    },
    {
      src: path.join(process.cwd(), "public", "fonts", "inter-700.ttf"),
      fontWeight: 700,
    },
  ],
});

// Desactivar hyphenation para evitar errores de cálculo de altura en page-breaks
Font.registerHyphenationCallback(word => [word]);

const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 50,
    paddingLeft: 20,
    paddingRight: 40,
    fontFamily: "Inter",
    fontSize: 10,
    color: "#000",
  },
  fixedFooter: {
    marginTop: "auto",
  },
  topContact: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 4,
    marginBottom: 6,
  },
  topContactLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  topContactRightBox: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 3,
  },
  topContactText: { fontSize: 7, color: "#000000", fontWeight: 700 },
  topContactRight: { flexDirection: "row", gap: 4 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    paddingBottom: 4,
    marginBottom: 6,
  },
  logoRow: { flexDirection: "row", alignItems: "center" },
  logoImage: { width: 50, height: 50, objectFit: "contain", marginRight: 12 },
  logoTitle: { fontSize: 24, fontFamily: "Montserrat", marginBottom: 1 },
  logoSubtitle: { fontSize: 8, fontWeight: 700, letterSpacing: 0.5 },
  headerData: { textAlign: "right", fontSize: 10 },
  headerDataRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 2 },
  headerDataLabel: { fontWeight: 700, marginRight: 4 },
  patientBox: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    paddingBottom: 4,
    marginBottom: 6,
  },
  patientColLeft: { width: "55%", paddingRight: 10 },
  patientColRight: {
    width: "45%",
    borderLeftWidth: 1,
    borderLeftColor: "#E2E8F0",
    paddingLeft: 15,
  },
  patientRow: { flexDirection: "row", marginBottom: 1 },
  patientLabel: { width: 85, fontWeight: 700, fontSize: 9 },
  patientValue: { flex: 1, fontSize: 9, textTransform: "uppercase" },
  categoryBlock: {
    width: "100%",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 8,
  },
  catTitleView: {
    backgroundColor: "#BFDBFE",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
  },
  catTitleText: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  catBioanalistaText: {
    fontSize: 12,
    fontWeight: 700,
    color: "#000",
    letterSpacing: 0.5,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 2,
  },
  colDesc: { width: "27%", fontWeight: 700, fontSize: 8.5 },
  colRes: { width: "32%", fontWeight: 700, fontSize: 8.5, textAlign: "center" },
  colUni: { width: "15%", fontWeight: 700, fontSize: 8.5, textAlign: "center" },
  colRef: { width: "26%", fontWeight: 700, fontSize: 8.5, textAlign: "center" },
  subcatTitleView: {
    backgroundColor: "#DBEAFE",
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  subcatTitleText: {
    fontSize: 10.5,
    fontWeight: 700,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 2,
    paddingVertical: 2,
  },
  rowDesc: { width: "27%", fontSize: 8.5, fontWeight: 700 },
  rowDescSub: { width: "27%", fontSize: 8.5, fontWeight: 700, paddingLeft: 10 },
  multiRowDesc: {
    width: "27%",
    fontSize: 8,
    fontWeight: 400,
    paddingLeft: 15,
    color: "#000000",
  },
  rowRes: { width: "32%", fontSize: 9, fontWeight: 700, textAlign: "center", lineHeight: 1.2 },
  rowUni: { width: "15%", fontSize: 8.5, textAlign: "center", lineHeight: 1.2 },
  rowRef: { width: "26%", fontSize: 8.5, textAlign: "center", lineHeight: 1.2 },
  obsContainer: {
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 5,
    marginTop: 2,
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#F3F4F6", // Fondo gris muy claro
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 2,
  },
  obsLabel: { fontSize: 8, fontWeight: 700, color: "#4B5563" },
  obsText: { fontSize: 8, fontWeight: 400, color: "#4B5563", flex: 1 },
  footerSignaturesContainer: {
    marginTop: 30,
    paddingBottom: 0,
  },
  footerSignaturesRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
  },
  footerSignatureBlock: {
    alignItems: "center",
    width: 140,
  },
  footerFirmaImage: {
    width: 135,
    height: 45,
    objectFit: "contain",
    marginBottom: -5,
  },
  footerSignatureLine: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#000",
    paddingTop: 6,
    alignItems: "center",
  },
  footerBioanalista: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  footerLabName: {
    fontSize: 7,
    color: "#000000",
    marginTop: 2,
    textAlign: "center",
  },
});

// Helpers
function formatFechaHora(dateString: string): string {
  const d = new Date(dateString);
  const dateStr = d.toLocaleDateString("es-VE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Caracas",
  });
  const timeStr = d.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Caracas",
  });
  return `${dateStr} ${timeStr}`;
}

function calcularEdad(fechaNac: string, esBebe: boolean): string {
  if (!fechaNac) return "N/A";
  const hoy = new Date();
  const nacimiento = new Date(fechaNac);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return `${edad} ${esBebe ? "Meses" : "Años"}`;
}

interface ReporteDocumentServerProps {
  orden: any;
  fechaImpresa: string;
  qrCodeUrl: string;
  logoBase64?: string;
}

const ReporteDocumentServer = ({
  orden,
  fechaImpresa,
  qrCodeUrl,
  logoBase64,
}: ReporteDocumentServerProps) => {
  const allSigners = new Map();
  const groupedByCategory = orden.detalles.reduce((acc: any, det: any) => {
    let catNombreOriginal = (
      det.prueba?.categoriaVisual ||
      det.prueba?.subcategoria?.categoria?.nombre ||
      "OTROS"
    ).trim().toUpperCase();

    let subcatNombre = (
      det.prueba?.subcategoriaVisual ||
      det.prueba?.subcategoria?.nombre ||
      "PRUEBAS INDIVIDUALES"
    ).trim().toUpperCase();

    if (det.prueba?.subcategoria?.esPaquete) {
      catNombreOriginal = `${det.prueba.subcategoria.categoria?.nombre || "PERFIL"} - ${det.prueba.subcategoria.nombre}`.trim().toUpperCase();
      if (det.prueba.categoriaVisual || det.prueba.subcategoriaVisual) {
        subcatNombre = `${det.prueba.categoriaVisual || "S/C"} - ${det.prueba.subcategoriaVisual || "S/S"}`.trim().toUpperCase();
      } else {
        subcatNombre = "PRUEBAS INDIVIDUALES";
      }
    }

    const bioId = (det.resultado?.firmado && det.resultado?.procesadoPor) ? det.resultado.procesadoPor.id : "no-firmado";
    const groupKey = `${catNombreOriginal}_${bioId}`;

    if (!acc[groupKey]) {
      acc[groupKey] = {
        catNombreOriginal,
        subcategorias: {},
        signers: new Map(),
      };
    }

    if (!acc[groupKey].subcategorias[subcatNombre]) {
      acc[groupKey].subcategorias[subcatNombre] = [];
    }

    acc[groupKey].subcategorias[subcatNombre].push(det);

    if (det.resultado?.firmado && det.resultado?.procesadoPor) {
      acc[groupKey].signers.set(det.resultado.procesadoPor.id, det.resultado.procesadoPor);
      allSigners.set(det.resultado.procesadoPor.id, det.resultado.procesadoPor);
    }

    return acc;
  }, {});

  // Renderiza una fila + su observación (cada una puede separarse si es necesario)
  const renderDetalleRow = (det: any, subCatNombre: string) => {
    const isPaquete = subCatNombre !== "PRUEBAS INDIVIDUALES";
    const listaValores = det.resultado?.valores || [];
    return (
      <View key={det.id}>
        {det.cantidad > 1 ? (
          <View>
            <View style={pdfStyles.row}>
              <Text style={isPaquete ? pdfStyles.rowDescSub : pdfStyles.rowDesc}>
                {det.prueba.nombre}
              </Text>
              <Text style={pdfStyles.rowRes}></Text>
              <Text style={pdfStyles.rowUni}>{det.prueba.unidades || ""}</Text>
              <Text style={pdfStyles.rowRef}>
                {det.resultado?.valoresReferencia || det.prueba.valoresReferencia || ""}
              </Text>
            </View>
            {Array(det.cantidad)
              .fill(0)
              .map((_: any, i: number) => {
                const valorMuestra = listaValores[i]?.valorIngresado || "-";
                return (
                  <View key={i} style={pdfStyles.row}>
                    <Text style={pdfStyles.multiRowDesc}>Muestra {i + 1}</Text>
                    <Text style={pdfStyles.rowRes}>{valorMuestra}</Text>
                    <Text style={pdfStyles.rowUni}></Text>
                    <Text style={pdfStyles.rowRef}></Text>
                  </View>
                );
              })}
          </View>
        ) : (
          <View style={pdfStyles.row}>
            <Text style={isPaquete ? pdfStyles.rowDescSub : pdfStyles.rowDesc}>
              {det.prueba.nombre}
            </Text>
            <Text style={pdfStyles.rowRes}>
              {listaValores.length > 0
                ? listaValores.map((v: any) => v.valorIngresado || " ").join("\n").trim() || "-"
                : "-"}
            </Text>
            <Text style={pdfStyles.rowUni}>{det.prueba.unidades || ""}</Text>
            <Text style={pdfStyles.rowRef}>
              {det.resultado?.valoresReferencia || det.prueba.valoresReferencia || ""}
            </Text>
          </View>
        )}
        {det.resultado?.observaciones && (
          <View style={pdfStyles.obsContainer}>
            <Text style={pdfStyles.obsLabel}>Nota ({det.prueba.nombre}): </Text>
            <Text style={pdfStyles.obsText}>{det.resultado.observaciones}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>

        {/* INFO CONTACTO SUPERIOR Y QR */}
        <View style={pdfStyles.topContact}>
          <View style={pdfStyles.topContactLeft}>
            {qrCodeUrl ? (
              <Image src={qrCodeUrl} style={{ width: 35, height: 35 }} />
            ) : <View style={{ width: 35, height: 35 }} />}
            <View style={{ flexDirection: "column", justifyContent: "center" }}>
              <Text style={{ fontSize: 7.5, fontWeight: 700, color: "#1D1D1F" }}>DOC. VERIFICADO</Text>
              <Text style={{ fontSize: 7, color: "#000000", marginTop: 1, maxWidth: 150 }}>
                Escanee para validar la{"\n"}autenticidad de resultados.
              </Text>
            </View>
          </View>
          <View style={pdfStyles.topContactRightBox}>
            <Text style={pdfStyles.topContactText}>
              DIRECCIÓN: AVENIDA CORO, LOCAL 4-79, SECTOR SANTA ROSA.
            </Text>
            <View style={pdfStyles.topContactRight}>
              <Text style={pdfStyles.topContactText}>TELÉFONO: 04220353660</Text>
              <Text style={pdfStyles.topContactText}>CORREO: LABORATORIOLEYMA@GMAIL.COM</Text>
              <Text style={pdfStyles.topContactText}>RIF: J - 508463315</Text>
            </View>
          </View>
        </View>

        {/* HEADER */}
        <View style={pdfStyles.header}>
          <View style={pdfStyles.logoRow}>
            {logoBase64 ? (
              <Image src={logoBase64} style={pdfStyles.logoImage} />
            ) : null}
            <View>
              <Text style={pdfStyles.logoTitle}>LEYMA C.A.</Text>
              <Text style={pdfStyles.logoSubtitle}>LABORATORIO CLÍNICO BACTERIOLÓGICO</Text>
            </View>
          </View>
          <View style={pdfStyles.headerData}>
            <View style={pdfStyles.headerDataRow}>
              <Text style={pdfStyles.headerDataLabel}>Orden N°:</Text>
              <Text>#{orden.id.toString().padStart(6, "0")}</Text>
            </View>
            <View style={pdfStyles.headerDataRow}>
              <Text style={pdfStyles.headerDataLabel}>Ingreso:</Text>
              <Text>{formatFechaHora(orden.fechaCreacion)}</Text>
            </View>
            <View style={pdfStyles.headerDataRow}>
              <Text style={pdfStyles.headerDataLabel}>Impreso:</Text>
              <Text>{fechaImpresa}</Text>
            </View>
          </View>
        </View>

        {/* FICHA DEL PACIENTE */}
        <View style={pdfStyles.patientBox}>
          <View style={pdfStyles.patientColLeft}>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>Paciente:</Text>
              <Text style={pdfStyles.patientValue}>{orden.paciente.nombreCompleto}</Text>
            </View>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>Edad:</Text>
              <Text style={pdfStyles.patientValue}>
                {calcularEdad(orden.paciente.fechaNacimiento, orden.paciente.esBebe)}
              </Text>
            </View>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>Dirección:</Text>
              <Text style={pdfStyles.patientValue}>
                {orden.paciente.direccion || "No registrada"}
              </Text>
            </View>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>Observaciones:</Text>
              <Text style={pdfStyles.patientValue}>
                {orden.paciente.observaciones || "---"}
              </Text>
            </View>
          </View>

          <View style={pdfStyles.patientColRight}>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>C.I:</Text>
              <Text style={pdfStyles.patientValue}>
                {orden.paciente.cedula || "S/N"}
              </Text>
            </View>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>Sexo:</Text>
              <Text style={pdfStyles.patientValue}>
                {orden.paciente.sexo === "M" ? "Masculino" : "Femenino"}
              </Text>
            </View>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>Teléfono:</Text>
              <Text style={pdfStyles.patientValue}>
                {orden.paciente.telefono || "No registrado"}
              </Text>
            </View>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>Ubicación:</Text>
              <Text style={pdfStyles.patientValue}>MATRIZ</Text>
            </View>
          </View>
        </View>

        {/* CUERPO DEL REPORTE */}
        {Object.entries(groupedByCategory).map(
          ([groupKey, catData]: [string, any]) => {
            const catNombre = catData.catNombreOriginal;
            const bioanalistasText =
              catData.signers.size > 0
                ? ` - PROCESADO POR: ${Array.from(catData.signers.values())
                    .map((b: any) => b.nombre)
                    .join(" / ")}`
                : "";
            const isLongTitle = (catNombre + bioanalistasText).length > 65;

            return (
              <View key={groupKey} style={pdfStyles.categoryBlock}>
                {Object.entries(catData.subcategorias).map(
                  ([subCatNombre, detalles]: [string, any], index: number) => (
                    <View key={subCatNombre} style={{ marginBottom: 8 }}>
                      {/* Título de categoría */}
                      {index === 0 && (
                        <View style={pdfStyles.catTitleView} minPresenceAhead={20}>
                          <Text style={[pdfStyles.catTitleText, isLongTitle ? { fontSize: 11 } : {}]}>
                            {catNombre}
                            {bioanalistasText && (
                              <Text style={[pdfStyles.catBioanalistaText, isLongTitle ? { fontSize: 11 } : {}]}>{bioanalistasText}</Text>
                            )}
                          </Text>
                        </View>
                      )}

                      {index === 0 && subCatNombre === "PRUEBAS INDIVIDUALES" && (
                        <View style={{ height: 8 }} />
                      )}

                      {/* Subcategoría */}
                      {subCatNombre !== "PRUEBAS INDIVIDUALES" && (
                        <View minPresenceAhead={20}>
                          <View style={pdfStyles.subcatTitleView}>
                            <Text style={pdfStyles.subcatTitleText}>{subCatNombre}</Text>
                          </View>
                          <View style={{ height: 8 }} />
                        </View>
                      )}

                      {/* Encabezado de tabla */}
                      <View style={pdfStyles.tableHeader} minPresenceAhead={15}>
                        <Text style={pdfStyles.colDesc}>PARAMETRO</Text>
                        <Text style={pdfStyles.colRes}>RESULTADO</Text>
                        <Text style={pdfStyles.colUni}>UNIDADES</Text>
                        <Text style={pdfStyles.colRef}>VALORES DE REFERENCIA</Text>
                      </View>

                      <View style={{ height: 3 }} />

                      {/* TODAS las filas fluyen libremente */}
                      {(detalles as any[]).map((det: any) => renderDetalleRow(det, subCatNombre))}

                      {(() => {
                        const firstDet = detalles[0];
                        const originalSubcatName = (firstDet?.prueba?.subcategoriaVisual || firstDet?.prueba?.subcategoria?.nombre || "PRUEBAS INDIVIDUALES").trim().toUpperCase();
                        const notaObj = orden.notasSubcategoria?.find((ns: any) =>
                          (ns.subcategoria || "").trim().toUpperCase() === originalSubcatName
                        );
                        if (notaObj && notaObj.nota) {
                          return (
                            <View style={{ marginTop: 4, paddingLeft: 8, paddingRight: 8, marginBottom: 8 }}>
                              <Text style={{ fontSize: 9, color: "#475569" }}>
                                Nota: {notaObj.nota}
                              </Text>
                            </View>
                          );
                        }
                        return null;
                      })()}
                    </View>
                  )
                )}
              </View>
            );
          }
        )}

        {/* FIRMAS */}
        <View style={pdfStyles.fixedFooter}>
          <View style={pdfStyles.footerSignaturesContainer}>
            <View style={pdfStyles.footerSignaturesRow}>
              {allSigners.size > 0 ? (
                Array.from(allSigners.values()).map((bio: any) => (
                  <View key={bio.id} style={pdfStyles.footerSignatureBlock}>
                    {bio.firmaUrl ? (
                      <Image src={bio.firmaUrl} style={pdfStyles.footerFirmaImage} />
                    ) : (
                      <View style={{ height: 45 }} />
                    )}
                    <View style={pdfStyles.footerSignatureLine}>
                      <Text style={pdfStyles.footerBioanalista}>{bio.nombre}</Text>
                      {(bio.mpps || bio.col) ? (
                        <Text style={pdfStyles.footerLabName}>
                          {bio.mpps ? `MPPS: ${bio.mpps}` : ""} {bio.mpps && bio.col ? " - " : ""} {bio.col ? `C.B.T: ${bio.col}` : ""}
                        </Text>
                      ) : (
                        <Text style={pdfStyles.footerLabName}>BIOANALISTA</Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={pdfStyles.footerSignatureBlock}>
                  <View style={{ height: 45 }} />
                  <View style={pdfStyles.footerSignatureLine}>
                    <Text style={pdfStyles.footerBioanalista}>BIOANALISTA</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ReporteDocumentServer;
