import { RIO_MUNICIPALITY_ID } from '../../constants.js';
import type { RawBigQuery1746Row } from './types.js';

function extractDateValue(val: { value: string } | string | null | undefined): string | null {
  if (!val) return null;
  const raw = (typeof val === 'object' && 'value' in val ? val.value : String(val)).trim();
  if (!raw) return null;

  try {
    // BigQuery DATETIME fields in DATA.RIO represent America/Sao_Paulo local time (UTC-3).
    // Ensure deterministic parsing across UTC containers and local machines.
    const normalized = raw.replace(' ', 'T');
    const hasExplicitZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized);
    const isoCandidate = normalized.includes('T')
      ? hasExplicitZone
        ? normalized
        : `${normalized}-03:00`
      : `${normalized}T00:00:00-03:00`;

    const d = new Date(isoCandidate);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

function extractDateString(val: { value: string } | string | null | undefined): string | null {
  if (!val) return null;
  const raw = (typeof val === 'object' && 'value' in val ? val.value : String(val)).trim();
  return raw && raw.length >= 10 ? raw.slice(0, 10) : null;
}

/**
 * updated_at chega como STRING, sem formato documentado. Aceita sufixo " UTC",
 * fuso sem dois-pontos (+0000) e frações com mais de 3 dígitos; sem fuso
 * explícito, segue a regra dos DATETIME do DATA.RIO (horário de Brasília).
 */
export function parseSourceTimestamp(val: string | null | undefined): string | null {
  if (typeof val !== 'string') return null;
  const normalized = val
    .trim()
    .replace(/\s*UTC$/i, 'Z')
    .replace(/(\.\d{3})\d+/, '$1')
    .replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  return extractDateValue(normalized);
}

function parseOmbudsmanFlag(val: string | null | undefined): boolean | null {
  const flag = typeof val === 'string' ? val.trim().toLowerCase() : '';
  if (flag === '1' || flag === 'true') return true;
  if (flag === '0' || flag === 'false') return false;
  return null;
}

export function mapRawRowToOfficialCall(row: RawBigQuery1746Row) {
  // Validate coordinates: Rio de Janeiro bounding box is lat [-23.15, -22.70], lng [-43.80, -43.10]
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

  // Sem data de abertura publicada o chamado não é importado: inventar a data
  // de hoje distorceria períodos e ordenação.
  const openedAt = extractDateValue(row.data_inicio);
  const closedAt = extractDateValue(row.data_fim);
  const targetDate = extractDateValue(row.data_alvo_finalizacao);
  const diagnosisTargetDate = extractDateValue(row.data_alvo_diagnostico);
  const diagnosedAt = extractDateValue(row.data_real_diagnostico);
  const sourceUpdatedAt = parseSourceTimestamp(row.updated_at);
  const partitionDate = extractDateString(row.data_particao);

  return {
    id: `rio1746-${row.id_chamado}`,
    externalId: String(row.id_chamado),
    source: 'rio1746' as const,
    municipalityId: RIO_MUNICIPALITY_ID, // Rio de Janeiro
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
    diagnosisTargetDate,
    diagnosedAt,
    viaOmbudsman: parseOmbudsmanFlag(row.unidade_organizacional_ouvidoria),
    sourceUpdatedAt,
    withinDeadline: row.dentro_prazo || null,
    timeRemaining: typeof row.tempo_prazo === 'number' ? row.tempo_prazo : null,
    timeUnit: row.prazo_unidade || null,
    deadlineType: row.prazo_tipo || null,
    complaintsCount:
      typeof row.reclamacoes === 'number' ? row.reclamacoes : null,
    streetName: row.nome_logradouro || null,
    neighborhoodId: row.id_bairro ? String(row.id_bairro) : null,
    neighborhoodName: row.nome_bairro || null,
    subprefecture: row.subprefeitura || null,
    latitude: lat,
    longitude: lng,
    sourcePartitionDate: partitionDate,
  };
}
