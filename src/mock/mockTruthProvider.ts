import { createStaticTruthProvider } from '../truth/provider';
import { adaptMockTruthSeed } from './mockTruthAdapter';
import { mockTruthSeed } from './mockTruthSeed';

const mockTruthSnapshot = adaptMockTruthSeed(mockTruthSeed);

export const mockTruthProvider = createStaticTruthProvider({
  providerId: 'mock-offline-truth-provider',
  providerKind: 'mock',
  snapshot: mockTruthSnapshot,
});
