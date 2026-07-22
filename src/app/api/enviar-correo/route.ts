import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { email, subject, message, fileName, pdfBase64 } = await request.json();

    if (!email || !pdfBase64) {
      return NextResponse.json({ error: "Faltan datos requeridos." }, { status: 400 });
    }

    // Configurar el transporter. 
    // Usar variables de entorno para el correo y la contraseña (o contraseña de aplicación de Gmail)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Laboratorio LEYMA C.A." <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject || "Documento de Laboratorio LEYMA C.A.",
      text: message || "Adjunto se encuentra su documento.",
      attachments: [
        {
          filename: fileName || "Documento.pdf",
          content: pdfBase64,
          encoding: "base64",
          contentType: "application/pdf",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Correo enviado exitosamente." });
  } catch (error: any) {
    console.error("Error al enviar correo:", error);
    return NextResponse.json({ error: "Error interno al enviar el correo." }, { status: 500 });
  }
}
