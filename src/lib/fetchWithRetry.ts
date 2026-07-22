export const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  retries = 3,
  delayMs = 1000
): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);

      // Errores de cliente (400-404) no se reintentan porque el resultado no cambiará a menos que sea un timeout (408).
      // Si la respuesta es exitosa (200-299), se devuelve.
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 408)) {
        return res;
      }

      // Si es un error de servidor (5xx) o Timeout (408) y es el último intento, devolvemos la respuesta fallida.
      if (i === retries - 1) {
        return res;
      }
    } catch (error) {
      // Error de red absoluto (TypeError: Failed to fetch)
      if (i === retries - 1) throw error;
    }

    // Exponential backoff: 1s, 2s, 4s...
    await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, i)));
  }

  throw new Error("Máximo de reintentos alcanzado");
};

/**
 * Función helper que reintenta automáticamente y arroja un error si la respuesta final no es OK.
 * También intenta parsear el JSON de la respuesta para extraer el mensaje de error.
 */
export const fetchJSON = async (
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<any> => {
  const res = await fetchWithRetry(url, options, retries);
  
  let data;
  try {
    data = await res.json();
  } catch (e) {
    // Si la respuesta no es JSON válido (ej. un HTML 504 Gateway Timeout), no fallamos aquí
    // sino que dejamos que el res.ok tire el error genérico abajo.
    data = null;
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || "Ocurrió un error inesperado de comunicación con el servidor.";
    throw new Error(errorMsg);
  }

  return data;
};
