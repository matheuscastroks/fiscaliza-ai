import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isExpoPushToken, sendExpoPushNotification } from '../src/notifications.js';

test('notifications: isExpoPushToken correctly validates token format', () => {
  assert.equal(isExpoPushToken('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'), true);
  assert.equal(isExpoPushToken('ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]'), true);
  assert.equal(isExpoPushToken(''), false);
  assert.equal(isExpoPushToken('invalid-token-format'), false);
  assert.equal(isExpoPushToken(null as unknown as string), false);
});

test('notifications: sendExpoPushNotification rejects when no valid tokens are passed', async () => {
  const result = await sendExpoPushNotification({
    to: 'invalid-token',
    title: 'Teste',
    body: 'Mensagem',
  });
  assert.equal(result.success, false);
  assert.ok(result.error?.includes('Nenhum token Expo válido'));
});

test('notifications: sendExpoPushNotification posts to Expo Push API with correct payload', async () => {
  let interceptedUrl = '';
  let interceptedBody = '';

  const mockFetch = (async (url: string | URL | Request, init?: RequestInit) => {
    interceptedUrl = url.toString();
    interceptedBody = init?.body as string;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        data: [{ status: 'ok', id: 'ticket-uuid-1234' }],
      }),
    } as unknown as Response;
  }) as typeof fetch;

  const result = await sendExpoPushNotification(
    {
      to: 'ExponentPushToken[test-citizen-token-1]',
      title: 'Chamado Atualizado',
      body: 'O chamado 1746 foi resolvido',
      data: { callId: 'call-abc-123' },
    },
    mockFetch,
  );

  assert.equal(result.success, true);
  assert.equal(result.ticketId, 'ticket-uuid-1234');
  assert.equal(interceptedUrl, 'https://exp.host/--/api/v2/push/send');

  const parsed = JSON.parse(interceptedBody);
  assert.equal(Array.isArray(parsed), true);
  assert.equal(parsed[0].to, 'ExponentPushToken[test-citizen-token-1]');
  assert.equal(parsed[0].title, 'Chamado Atualizado');
  assert.equal(parsed[0].body, 'O chamado 1746 foi resolvido');
  assert.equal(parsed[0].data.callId, 'call-abc-123');
  assert.equal(parsed[0].channelId, 'fiscaliza-calls');
});
