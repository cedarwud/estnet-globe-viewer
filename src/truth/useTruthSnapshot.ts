import { useMemo } from 'react';
import type { CanonicalTruthSnapshot } from './contracts';
import type { TruthProvider } from './provider';

export function useTruthSnapshot(provider: TruthProvider): CanonicalTruthSnapshot {
  return useMemo(() => provider.getSnapshot(), [provider]);
}
