type Device = {
  hasServicesEnabledAsync: () => Promise<boolean>;
  requestForegroundPermissionsAsync: () => Promise<{ granted: boolean }>;
  getCurrentPositionAsync: () => Promise<{ coords: { latitude: number; longitude: number; accuracy: number | null } }>;
};
export async function captureDeviceLocation(device: Device, signal: AbortSignal, timeoutMs = 15000) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancel: () => void = () => {};
  let expired = false;
  const canceled = () => { if (signal.aborted || expired) throw Error('Localização cancelada.'); };
  try {
    canceled();
    return await Promise.race([
      (async () => {
        if (!await device.hasServicesEnabledAsync()) throw Error('Localização desativada no dispositivo. Escolha um bairro ou ative o GPS.');
        canceled();
        if (!(await device.requestForegroundPermissionsAsync()).granted) throw Error('Localização não autorizada. Escolha um bairro ou autorize nas configurações do aparelho.');
        canceled();
        const { coords } = await device.getCurrentPositionAsync();
        canceled();
        if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) throw Error('Posição indisponível. Tente novamente.');
        return { latitude: coords.latitude, longitude: coords.longitude, accuracyMeters: coords.accuracy, capturedAt: Date.now() };
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => { expired = true; reject(Error('A localização demorou. Tente novamente ou escolha um bairro.')); }, timeoutMs);
        cancel = () => reject(Error('Localização cancelada.'));
        signal.addEventListener('abort', cancel, { once: true });
      }),
    ]);
  } finally { clearTimeout(timer); signal.removeEventListener('abort', cancel); }
}
