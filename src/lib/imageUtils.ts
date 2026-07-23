export function compressImage(file: File, maxWidth: number = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          const scaleSize = maxWidth / width;
          width = maxWidth;
          height = height * scaleSize;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          // Usamos PNG porque las librerías generadoras de PDF (como pdfmake o jsPDF)
          // usualmente no soportan WebP nativamente, pero sí soportan PNG para mantener transparencia.
          // Al limitar a 300px, el PNG suele pesar ~20KB lo cual sigue siendo muy liviano.
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/png");
          resolve(compressedBase64);
        } else {
          reject(new Error("No se pudo obtener el contexto del canvas"));
        }
      };
      img.onerror = () => reject(new Error("Error al cargar la imagen"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsDataURL(file);
  });
}
