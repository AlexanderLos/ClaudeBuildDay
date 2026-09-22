/**
 * Puerto Rico's 78 municipalities. General geography, NOT notice data: used only to tell a resident
 * plainly that their town is outside this notice instead of asking them where they are again.
 */
import { normalizePlaceText } from "@/lib/curated-coordinates";

export const PR_MUNICIPALITIES: string[] = [
  "Adjuntas", "Aguada", "Aguadilla", "Aguas Buenas", "Aibonito", "Añasco", "Arecibo", "Arroyo", "Barceloneta",
  "Barranquitas", "Bayamón", "Cabo Rojo", "Caguas", "Camuy", "Canóvanas", "Carolina", "Cataño", "Cayey", "Ceiba",
  "Ciales", "Cidra", "Coamo", "Comerío", "Corozal", "Culebra", "Dorado", "Fajardo", "Florida", "Guánica", "Guayama",
  "Guayanilla", "Guaynabo", "Gurabo", "Hatillo", "Hormigueros", "Humacao", "Isabela", "Jayuya", "Juana Díaz", "Juncos",
  "Lajas", "Lares", "Las Marías", "Las Piedras", "Loíza", "Luquillo", "Manatí", "Maricao", "Maunabo", "Mayagüez", "Moca",
  "Morovis", "Naguabo", "Naranjito", "Orocovis", "Patillas", "Peñuelas", "Ponce", "Quebradillas", "Rincón", "Río Grande",
  "Sabana Grande", "Salinas", "San Germán", "San Juan", "San Lorenzo", "San Sebastián", "Santa Isabel", "Toa Alta",
  "Toa Baja", "Trujillo Alto", "Utuado", "Vega Alta", "Vega Baja", "Vieques", "Villalba", "Yabucoa", "Yauco",
];

/** First municipality named in the text as whole words, accent- and case-insensitive. */
export function findPrMunicipality(text: string): string | null {
  const padded = ` ${normalizePlaceText(text)} `;
  return PR_MUNICIPALITIES.find((m) => padded.includes(` ${normalizePlaceText(m)} `)) ?? null;
}
