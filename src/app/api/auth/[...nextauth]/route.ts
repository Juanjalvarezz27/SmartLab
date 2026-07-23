import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        correo: { label: "Correo", type: "email" },
        clave: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.correo || !credentials?.clave) {
          throw new Error("Por favor ingresa tu correo y contraseña.");
        }

      const usuario = await prisma.usuario.findUnique({
        where: { correo: credentials.correo },
        include: { laboratorio: true }
      });

      if (!usuario || !usuario.activo) throw new Error("El usuario no existe o está inactivo.");
      if (usuario.laboratorio && !usuario.laboratorio.activo) {
        throw new Error("El acceso de este laboratorio se encuentra suspendido.");
      }
      
      const claveCorrecta = await bcrypt.compare(credentials.clave, usuario.clave);
      if (!claveCorrecta) throw new Error("Contraseña incorrecta.");

      return {
        id: usuario.id,
        name: usuario.nombre,
        email: usuario.correo,
        rol: usuario.rol, 
        laboratorioId: usuario.laboratorioId,
      };
    }
  })
],
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.rol = (user as any).rol;
      token.laboratorioId = (user as any).laboratorioId;
    }
    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      (session.user as any).rol = token.rol; 
      (session.user as any).id = token.sub; 
      (session.user as any).laboratorioId = token.laboratorioId;
    }
    return session;
  }
},
  pages: {
    signIn: "/", // Le decimos a NextAuth dónde está nuestra vista de login
  },
  session: {
    strategy: "jwt",
    // AQUÍ DEFINIMOS LA VIDA ÚTIL DE LA SESIÓN
    maxAge: 12 * 60 * 60, // 12 horas en segundos (43,200)
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// Exportamos los métodos GET y POST que Next.js requiere para sus APIs
export { handler as GET, handler as POST };