import type { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** "500 m", "1 km", "2,5 km": raio de busca em texto curto. */
export function formatRadius(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  const km = meters / 1000;
  return `${Number.isInteger(km) ? km : km.toFixed(1).replace('.', ',')} km`;
}

/** Ícone sugerido pelo nome que a pessoa deu ao lugar (Casa, Trabalho, Escola...). */
export function getPlaceIcon(name: string): IconName {
  const lower = name.toLowerCase();
  if (lower.includes('casa') || lower.includes('lar') || lower.includes('ap')) return 'home-outline';
  if (lower.includes('trab') || lower.includes('serv') || lower.includes('escrit')) return 'briefcase-outline';
  if (lower.includes('escola') || lower.includes('facul') || lower.includes('univ')) return 'school-outline';
  return 'location-outline';
}
