import React from 'react';
import { Text } from 'react-native';
import { act, renderRouter, screen } from 'expo-router/testing-library';
import { CitizenStack } from '@/features/navigation/CitizenStack';

const routes = (authenticated: boolean) => ({
  _layout: () => <CitizenStack authenticated={authenticated} backgroundColor="#ffffff" />,
  '(tabs)/index': () => <Text>Exploração pública</Text>,
  LoginScreen: () => <Text>Entrar</Text>,
  RegisterScreen: () => <Text>Criar conta</Text>,
  MunicipalityScreen: () => <Text>Confirmar município</Text>,
});

it('anônimo não monta a confirmação de município por link direto', async () => {
  await renderRouter(routes(false), { initialUrl: '/MunicipalityScreen' });
  expect(screen.queryByText('Confirmar município')).toBeNull();
  expect(screen.getByText('Exploração pública')).toBeTruthy();
});

it('conta autenticada acessa a confirmação de município', async () => {
  await renderRouter(routes(true), { initialUrl: '/MunicipalityScreen' });
  expect(screen.getByText('Confirmar município')).toBeTruthy();
});

it('anônimo ainda acessa o login', async () => {
  await renderRouter(routes(false), { initialUrl: '/LoginScreen' });
  expect(screen.getByText('Entrar')).toBeTruthy();
});

it('conta autenticada não volta ao formulário de login por link direto', async () => {
  await renderRouter(routes(true), { initialUrl: '/LoginScreen' });
  expect(screen.queryByText('Entrar')).toBeNull();
  expect(screen.getByText('Exploração pública')).toBeTruthy();
});

it('logout remove a tela protegida em uso', async () => {

  let endSession: () => void = () => { throw new Error('layout não montado'); };
  function Layout() {
    const [authenticated, setAuthenticated] = React.useState(true);
    endSession = () => setAuthenticated(false);
    return <CitizenStack authenticated={authenticated} backgroundColor="#ffffff" />;
  }
  await renderRouter({ ...routes(true), _layout: Layout }, { initialUrl: '/MunicipalityScreen' });
  expect(screen.getByText('Confirmar município')).toBeTruthy();
  await act(() => endSession());
  expect(screen.queryByText('Confirmar município')).toBeNull();
  expect(screen.getByText('Exploração pública')).toBeTruthy();
});
