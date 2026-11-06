import { AppSelect } from '@/components/ui/AppSelect';
import type { RadiusMeters } from './types';
export const RADIUS_OPTIONS = [{ value: '500', label: '500 m' }, { value: '1000', label: '1 km' }, { value: '2000', label: '2 km' }, { value: '5000', label: '5 km' }];
export function RadiusControl({ value, onChange }: { value: RadiusMeters; onChange: (radius: RadiusMeters) => void }) {
  return <AppSelect compact clearable={false} label="Entorno dos chamados 1746" value={String(value)} options={RADIUS_OPTIONS} onChange={(v) => onChange(Number(v) as RadiusMeters)} />;
}
