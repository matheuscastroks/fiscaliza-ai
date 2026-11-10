import { request } from './http';
import type { PostalCodeLookup, SessionUser } from '@/shared/contracts';

export { formatPostalCode, onlyDigits } from '@/features/profile/postalCodeFormat';

/** Consulta o CEP no servidor (a API é a autoridade do município). */
export function lookupPostalCode(digits: string, signal?: AbortSignal) {
  return request<PostalCodeLookup>(`/profile/postal-code/${digits}`, 'GET', undefined, signal);
}

/** Confirma o município do perfil a partir de um CEP já consultado. */
export function confirmMunicipality(lookup: PostalCodeLookup) {
  return request<SessionUser>('/profile/municipality', 'PUT', {
    postalCode: lookup.postalCode,
    municipalityId: lookup.municipality.id,
  });
}
