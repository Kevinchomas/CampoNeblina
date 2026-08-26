import { Inmueble } from "./types";

/**
 * Genera dinámicamente el catálogo oficial de los 178 inmuebles de la urbanización.
 * Torres 7 y 8.
 * Pisos 1, 2 y del 4 al 15 tienen 6 apartamentos por piso (1 al 6).
 * Piso 3 (Excepción) tiene 5 apartamentos por piso (1 al 5).
 */
export const generateInmuebles = (): Inmueble[] => {
  const list: Inmueble[] = [];
  const torres: (7 | 8)[] = [7, 8];

  for (const torre of torres) {
    // Planta Baja (PB) - 6 apartamentos (1 al 6)
    for (let apto = 1; apto <= 6; apto++) {
      list.push({
        torre,
        piso: "PB",
        apartamento: apto,
        codigo: `${torre}-PB-${apto}`,
      });
    }

    // Pisos 1 al 15
    for (let piso = 1; piso <= 15; piso++) {
      const aptos = piso === 3 ? [1, 2, 4, 5, 6] : [1, 2, 3, 4, 5, 6];
      for (const apto of aptos) {
        list.push({
          torre,
          piso,
          apartamento: apto,
          codigo: `${torre}-${piso}-${apto}`,
        });
      }
    }
  }
  return list;
};

// Catálogo completo de 178 inmuebles cargado en memoria
export const INMUEBLES_CATALOG = generateInmuebles();

/**
 * Verifica si un código de inmueble es válido dentro del catálogo de la urbanización.
 * @param codigo Código en formato [Torre]-[Piso]-[Apto] (ej. "7-3-5")
 */
export const isValidInmueble = (codigo: string): boolean => {
  return INMUEBLES_CATALOG.some((inmueble) => inmueble.codigo === codigo);
};

/**
 * Obtiene la información detallada de un inmueble dado su código único.
 */
export const getInmuebleByCodigo = (codigo: string): Inmueble | undefined => {
  return INMUEBLES_CATALOG.find((inmueble) => inmueble.codigo === codigo);
};

/**
 * Filtra y devuelve todos los inmuebles pertenecientes a una torre específica.
 */
export const getInmueblesByTorre = (torre: 7 | 8): Inmueble[] => {
  return INMUEBLES_CATALOG.filter((inmueble) => inmueble.torre === torre);
};
