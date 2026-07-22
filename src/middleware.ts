import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Obtenemos el token de la sesión actual
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // 1. Si el usuario ESTÁ logueado y trata de entrar al Login (/), lo mandamos al Dashboard
  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // 2. Si el usuario NO ESTÁ logueado y trata de entrar a cualquier ruta de /home, lo echamos al Login
  if (pathname.startsWith("/home") && !token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 3. RUTAS RESTRINGIDAS: Si es un USUARIO normal intentando entrar a módulos de ADMIN
  if (token && token.rol !== "ADMIN") {
    const rutasSoloAdmin = ["/home/pruebas", "/home/estadisticas", "/home/monedero"];
    
    // Verificamos si la ruta actual empieza con alguna de las bloqueadas
    const intentaEntrarRutaAdmin = rutasSoloAdmin.some(ruta => pathname.startsWith(ruta));
    
    if (intentaEntrarRutaAdmin) {
      // Lo regresamos al Dashboard por "listillo"
      return NextResponse.redirect(new URL("/home", req.url));
    }
  }

  // Si todo está en orden, dejamos que la petición continúe
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Excluir llamadas de API, archivos estáticos (_next/static),
     * optimización de imágenes (_next/image), favicon, 
     * y cualquier archivo con extensión (.png, .css, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};