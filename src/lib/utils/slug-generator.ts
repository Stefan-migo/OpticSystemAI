/**
 * Genera un slug URL-friendly a partir de un texto
 *
 * @param text - Texto a convertir en slug
 * @returns Slug normalizado (solo letras minúsculas, números y guiones)
 *
 * @example
 * generateSlug("Óptica Centro") // "optica-centro"
 * generateSlug("Mi Óptica 123") // "mi-optica-123"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // Normaliza caracteres Unicode
    .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
    .replace(/[^a-z0-9\s-]/g, "") // Elimina caracteres especiales
    .replace(/\s+/g, "-") // Reemplaza espacios con guiones
    .replace(/-+/g, "-") // Elimina guiones consecutivos
    .replace(/^-|-$/g, "") // Elimina guiones al inicio y final
    .trim();
}
