import { useAuthStore } from '@/stores/authStore';
import { resolveMunicipalityId } from './municipalityId';

export { DEFAULT_MUNICIPALITY_ID, resolveMunicipalityId } from './municipalityId';

export function useMunicipalityId(): string {
  return useAuthStore((s) => resolveMunicipalityId(s.user?.municipality?.id));
}
