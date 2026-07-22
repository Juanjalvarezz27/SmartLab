"use client";

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

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

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 70, 
    paddingLeft: 30,
    paddingRight: 50,
    fontFamily: 'Inter',
    fontSize: 10, 
    color: '#1D1D1F'
  },
  topContact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
    marginBottom: 10,
  },
  topContactText: { fontSize: 7, color: '#000000', fontWeight: 700 }, 
  topContactRight: { flexDirection: 'row', gap: 10 },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#0071E3',
    paddingBottom: 10,
    marginBottom: 15
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 55, height: 55, objectFit: 'contain', marginRight: 12 },
  
  logoTitle: { fontSize: 26, fontFamily: 'Montserrat', marginBottom: 2, color: '#0071E3' }, 
  logoSubtitle: { fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: '#1D1D1F' }, 
  
  headerData: { textAlign: 'right' }, 
  docTitle: { fontSize: 16, fontWeight: 700, marginBottom: 5, color: '#0071E3', letterSpacing: 1 },
  headerDataRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 },
  headerDataLabel: { fontWeight: 700, marginRight: 5, fontSize: 9 },
  headerDataValue: { fontSize: 9 },

  patientBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  patientRow: { flexDirection: 'row' },
  patientLabel: { width: 45, fontWeight: 700, fontSize: 9, color: '#000000' }, 
  patientValue: { width: 180, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }, 

  table: { width: '100%', marginBottom: 15 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0071E3',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  thName: { width: '100%', color: '#FFF', fontSize: 8, fontWeight: 700 },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tdName: { width: '100%', fontSize: 9, fontWeight: 700 },

  totalsBox: {
    width: '40%',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#F8FAFC'
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalLabel: { fontSize: 9, fontWeight: 700, color: '#000000' },
  totalValue: { fontSize: 9, fontWeight: 700, textAlign: 'right' },
  
  finalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 4, 
    paddingTop: 4, 
    borderTopWidth: 1, 
    borderTopColor: '#CBD5E1' 
  },
  finalLabel: { fontSize: 11, fontWeight: 700, color: '#0071E3' },
  finalValue: { fontSize: 11, fontWeight: 700, color: '#0071E3', textAlign: 'right' },
  
  finalValueBs: { fontSize: 8, fontWeight: 700, color: '#000000', textAlign: 'right', marginTop: 2 },

  footer: {
    position: 'absolute',
    bottom: 30, 
    left: 40, 
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  footerNote: { fontSize: 8, color: '#000000', textAlign: 'center', marginBottom: 2 },
  footerLegal: { fontSize: 7, color: '#000000', textAlign: 'center', fontWeight: 700 }
});

const PresupuestoDocument = ({ 
  paciente, 
  pruebas, 
  serviciosExtras = [],
  tasaBCV, 
  descuento, 
  subtotal, 
  total 
}: { 
  paciente: { nombre: string, cedula: string }, 
  pruebas: any[], 
  serviciosExtras?: any[],
  tasaBCV: number, 
  descuento: number, 
  subtotal: number, 
  total: number 
}) => {
  const formatFecha = () => {
    return new Date().toLocaleDateString('es-VE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>
        
        {/* INFO CONTACTO SUPERIOR */}
        <View style={pdfStyles.topContact}>
          <Text style={pdfStyles.topContactText}>DIRECCIÓN: AVENIDA CORO, LOCAL 4-79, SECTOR SANTA ROSA.</Text>
          <View style={pdfStyles.topContactRight}>
            <Text style={pdfStyles.topContactText}>TELÉFONO: 0412-9164371</Text>
            <Text style={pdfStyles.topContactText}>CORREO: CONTACTO@LEYMA.COM</Text>
            <Text style={pdfStyles.topContactText}>RIF: J - 508463315</Text>
          </View>
        </View>

        {/* HEADER */}
        <View style={pdfStyles.header}>
          <View style={pdfStyles.logoRow}>
            <Image src="/Logo2.png" style={pdfStyles.logoImage} />
            <View>
              <Text style={pdfStyles.logoTitle}>LEYMA C.A.</Text>
              <Text style={pdfStyles.logoSubtitle}>LABORATORIO CLÍNICO BACTERIOLÓGICO</Text>
            </View>
          </View>
          <View style={pdfStyles.headerData}>
            <Text style={pdfStyles.docTitle}>PRESUPUESTO</Text>
            <View style={pdfStyles.headerDataRow}>
              <Text style={pdfStyles.headerDataLabel}>Fecha Emisión:</Text>
              <Text style={pdfStyles.headerDataValue}>{formatFecha()}</Text>
            </View>
            <View style={pdfStyles.headerDataRow}>
              <Text style={pdfStyles.headerDataLabel}>Tasa Ref (BCV):</Text>
              <Text style={pdfStyles.headerDataValue}>Bs {tasaBCV.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* DATOS DEL PACIENTE */}
        {(paciente.nombre || paciente.cedula) && (
          <View style={pdfStyles.patientBox}>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>Paciente:</Text>
              <Text style={pdfStyles.patientValue}>{paciente.nombre || 'NO ESPECIFICADO'}</Text>
            </View>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>C.I:</Text>
              <Text style={pdfStyles.patientValue}>{paciente.cedula || 'N/A'}</Text>
            </View>
          </View>
        )}

        {/* TABLA DE EXÁMENES */}
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={pdfStyles.thName}>PARAMETRO</Text>
          </View>

          {pruebas.map((p, idx) => (
            <View key={idx} style={pdfStyles.tableRow}>
              <Text style={pdfStyles.tdName}>{p.nombre} {p.cantidad > 1 ? `(x${p.cantidad})` : ''}</Text>
            </View>
          ))}
          {serviciosExtras.map((s, idx) => {
            const qty = s.cantidad || 1;
            return (
              <View key={`srv-${idx}`} style={pdfStyles.tableRow}>
                <Text style={pdfStyles.tdName}>{s.nombre} {qty > 1 ? `(x${qty})` : ''}</Text>
              </View>
            );
          })}
        </View>

        {/* TOTALES */}
        <View style={pdfStyles.totalsBox}>
          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>Subtotal:</Text>
            <Text style={pdfStyles.totalValue}>${subtotal.toFixed(2)}</Text>
          </View>
          {descuento > 0 && (
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.totalLabel}>Descuento:</Text>
              <Text style={pdfStyles.totalValue}>-${descuento.toFixed(2)}</Text>
            </View>
          )}
          <View style={pdfStyles.finalRow}>
            <Text style={pdfStyles.finalLabel}>TOTAL A PAGAR</Text>
            <Text style={pdfStyles.finalValue}>${total.toFixed(2)}</Text>
          </View>
          <Text style={pdfStyles.finalValueBs}>Referencia: Bs {(total * tasaBCV).toFixed(2)}</Text>
        </View>

        {/* FOOTER */}
        <View style={pdfStyles.footer} fixed>
          <Text style={pdfStyles.footerNote}>
            Los precios indicados en este presupuesto son referenciales y están sujetos a variación.
          </Text>
          <Text style={pdfStyles.footerLegal}>
            ESTE DOCUMENTO NO ES UNA FACTURA.
          </Text>
        </View>

      </Page>
    </Document>
  );
};

export default PresupuestoDocument;
