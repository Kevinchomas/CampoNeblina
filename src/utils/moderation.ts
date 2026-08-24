/**
  * Lista de términos inapropiados, insultos y patrones de spam
 */
const PALABRAS_PROHIBIDAS: string[] = [
  "mierda", "coño", "carajo", "puta", "puto", "maldito", "maldita",
  "estúpido", "estupido", "estúpida", "estupida", "pendejo", "pendeja",
  "mamaguevo", "mamagueva", "marico", "marica", "huevón", "huevon",
  "singar", "verga", "chingar", "basura", "ladron", "ladrón", "estafador",
  "casino", "apuestas", "cripto gratis", "dólares fáciles", "gane dinero ya",
];

export interface ResultadoValidacion {
  esValido: boolean;
  motivo?: string;
}

/**
 * Escanea un texto en búsqueda de lenguaje inapropiado, insultos o spam.
 * @param texto Texto a evaluar (título, descripción, etc.)
 */
export const validarContenido = (texto: string): ResultadoValidacion => {
  if (!texto || !texto.trim()) {
    return { esValido: false, motivo: "El contenido no puede estar vacío." };
  }

  const textoLimpio = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remueve tildes

  for (const palabra of PALABRAS_PROHIBIDAS) {
    const palabraLimpia = palabra
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (textoLimpio.includes(palabraLimpia)) {
      return {
        esValido: false,
        motivo: `El texto contiene lenguaje inapropiado o no permitido ("${palabra}").`,
      };
    }
  }

  // Detección básica de SPAM por repetición exagerada de caracteres
  if (/(.)\1{6,}/i.test(texto)) {
    return {
      esValido: false,
      motivo: "El texto contiene repetición excesiva de caracteres (Spam).",
    };
  }

  return { esValido: true };
};
