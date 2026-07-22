import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    rol: string;
    laboratorioId?: string | null;
  }

  interface Session {
    user: User & {
      id: string;
      rol: string;
      laboratorioId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: string;
    laboratorioId?: string | null;
  }
}
