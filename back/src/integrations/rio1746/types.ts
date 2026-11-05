export interface RawBigQuery1746Row {
  id_chamado: string;
  data_inicio: { value: string } | string;
  data_fim?: { value: string } | string | null;
  id_bairro?: string | null;
  nome_bairro?: string | null;
  subprefeitura?: string | null;
  id_logradouro?: string | null;
  numero_logradouro?: number | null;
  nome_unidade_organizacional?: string | null;
  categoria?: string | null;
  tipo: string;
  subtipo: string;
  status?: string | null;
  situacao?: string | null;
  tipo_situacao?: string | null;
  justificativa_status?: string | null;
  data_alvo_finalizacao?: { value: string } | string | null;
  tempo_prazo?: number | null;
  prazo_unidade?: string | null;
  dentro_prazo?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  data_particao?: { value: string } | string | null;
  updated_at?: string | null;
}
