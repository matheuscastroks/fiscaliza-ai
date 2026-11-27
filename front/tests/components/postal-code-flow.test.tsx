import { act, renderHook } from '@testing-library/react-native';
import { usePostalCodeFlow } from '@/features/profile/usePostalCodeFlow';
import { confirmMunicipality, lookupPostalCode } from '@/services/postalCode';

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: object) => unknown) => selector({}),
}));

jest.mock('@/services/postalCode', () => ({
  onlyDigits: (value: string) => value.replace(/\D/g, ''),
  lookupPostalCode: jest.fn(),
  confirmMunicipality: jest.fn(),
}));

it('mantém o CEP digitado após falha e limpa o aviso quando o campo é corrigido', async () => {
  jest.mocked(lookupPostalCode).mockRejectedValueOnce(new Error('CEP não encontrado.'));
  const { result } = await renderHook(() => usePostalCodeFlow('00000-000'));

  await act(() => result.current.search());
  expect(result.current.postalCode).toBe('00000-000');
  expect(result.current.error).toBe('CEP não encontrado.');
  expect(result.current.lookup).toBeNull();
  expect(result.current.busy).toBe(false);
  expect(confirmMunicipality).not.toHaveBeenCalled();

  await act(() => { result.current.reset('20040-020'); });
  expect(result.current.postalCode).toBe('20040-020');
  expect(result.current.error).toBe('');
});
