import type { CanonicalTruthSnapshot } from './contracts';

export interface TruthProvider {
  providerId: string;
  providerKind: 'mock' | 'reference-replay' | 'api';
  // Early baseline stays synchronous and in-memory. Future providers can evolve behind this seam.
  getSnapshot(): CanonicalTruthSnapshot;
}

interface StaticTruthProviderConfig {
  providerId: string;
  providerKind: TruthProvider['providerKind'];
  snapshot: CanonicalTruthSnapshot;
}

export function createStaticTruthProvider(config: StaticTruthProviderConfig): TruthProvider {
  return {
    providerId: config.providerId,
    providerKind: config.providerKind,
    getSnapshot() {
      return config.snapshot;
    },
  };
}
