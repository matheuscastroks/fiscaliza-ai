import type { RawBigQuery1746Row } from './types.js';

function extractDateValue(val: { value: string } | string | null | undefined): string | null {
  if (!val) return null;
  const raw = typeof val === 'object' && 'value' in val ? val.value : String(val);
  if (!raw) return null;
  // If it's a date or datetime like "2026-09-20T13:07:16", ensure valid ISO
  try {
    const d = new Date(raw.includes('T') ? raw : raw + 'T00:00:00Z');
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

function extractDateString(val: { value: string } | string | null | undefined): string | null {
  if (!val) return null;
  const raw = typeof val === 'object' && 'value' in val ? val.value : String(val);
  return raw && raw.length >= 10 ? raw.slice(0, 10) : null;
}

export function mapRawRowToOfficialCall(row: RawBigQuery1746Row) {
  // Validate coordinates: Rio de Janeiro bounding polygon is roughly lat [-23.15, -22.70], lng [-43.80, -43.10]
  let lat: number | null = null;
  let lng: number | null = null;

  if (
    typeof row.latitude === 'number' &&
    typeof row.longitude === 'number' &&
    Number.isFinite(row.latitude) &&
    Number.isFinite(row.longitude) &&
    row.latitude !== 0 &&
    row.longitude !== 0 &&
    row.latitude >= -23.15 &&
    row.latitude <= -22.7 &&
    row.longitude >= -43.8 &&
    row.longitude <= -43.1
  ) {
    lat = row.latitude;
    lng = row.longitude;
  }

  const openedAt = extractDateValue(row.data_inicio) || new Date().toISOString();
  const closedAt = extractDateValue(row.data_fim);
  const targetDate = extractDateValue(row.data_alvo_finalizacao);
  const partitionDate = extractDateString(row.data_particao);

  return {
    id: `rio1746-${row.id_chamado}`,
    externalId: String(row.id_chamado),
    source: 'rio1746' as const,
    municipalityId: '3304557', // Rio de Janeiro
    serviceCategory: row.categoria || null,
    serviceType: row.tipo || 'Outros',
    serviceSubtype: row.subtipo || 'Geral',
    organizationName: row.nome_unidade_organizacional || null,
    officialStatus: row.status || null,
    officialSituation: row.situacao || null,
    officialSituationType: row.tipo_situacao || null,
    statusJustification: row.justificativa_status || null,
    openedAt,
    closedAt,
    targetDate,
    withinDeadline: row.dentro_prazo || null,
    timeRemaining: typeof row.tempo_prazo === 'number' ? row.tempo_prazo : null,
    timeUnit: row.prazo_unidade || null,
    neighborhoodId: row.id_bairro ? String(row.id_bairro) : null,
    neighborhoodName: row.nome_bairro || null,
    subprefecture: row.subprefeitura || null,
    latitude: lat,
    longitude: lng,
    sourcePartitionDate: partitionDate,
  };
}
