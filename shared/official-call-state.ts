import type { OfficialCall } from './contracts';
export function isOfficialCallClosed(call: OfficialCall): boolean {
  return Boolean(
    call.closedAt ||
      [call.officialSituation, call.officialStatus].some((value) =>
        /^(encerrad[oa]|fechad[oa])\b/i.test(value?.trim() || ''),
      ),
  );
}
