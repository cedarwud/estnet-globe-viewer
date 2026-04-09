import { useEffect, useState } from 'react';
import type { EarthTextureSet, ImageryProvider } from './provider';

export interface ResolvedEarthTextureState {
  textureSet: EarthTextureSet | null;
  activeProviderId: string;
  activeProviderKind: ImageryProvider['providerKind'];
  status: 'ready' | 'loading' | 'fallback';
  failureReason: string | null;
}

function buildReadyState(
  provider: ImageryProvider,
  textureSet: EarthTextureSet | null,
  status: ResolvedEarthTextureState['status'],
  failureReason: string | null
): ResolvedEarthTextureState {
  return {
    textureSet,
    activeProviderId: provider.providerId,
    activeProviderKind: provider.providerKind,
    status,
    failureReason,
  };
}

function buildInitialState(
  provider: ImageryProvider,
  fallbackProvider: ImageryProvider
): ResolvedEarthTextureState {
  const immediateTextureSet = provider.getEarthTextureSet();
  if (provider.availability !== 'configured') {
    return buildReadyState(
      fallbackProvider,
      fallbackProvider.getEarthTextureSet(),
      provider === fallbackProvider ? 'ready' : 'fallback',
      provider.availabilityReason
    );
  }

  if (!provider.loadEarthTextureSet) {
    if (immediateTextureSet) {
      return buildReadyState(provider, immediateTextureSet, 'ready', null);
    }

    return buildReadyState(
      fallbackProvider,
      fallbackProvider.getEarthTextureSet(),
      provider === fallbackProvider ? 'ready' : 'fallback',
      provider === fallbackProvider
        ? null
        : 'The requested home-globe imagery provider returned no runtime Earth texture set.'
    );
  }

  return buildReadyState(
    immediateTextureSet ? provider : fallbackProvider,
    immediateTextureSet ?? fallbackProvider.getEarthTextureSet(),
    'loading',
    null
  );
}

export function useEarthTextures(
  provider: ImageryProvider,
  fallbackProvider: ImageryProvider = provider
): ResolvedEarthTextureState {
  const [state, setState] = useState<ResolvedEarthTextureState>(() =>
    buildInitialState(provider, fallbackProvider)
  );

  useEffect(() => {
    setState(buildInitialState(provider, fallbackProvider));

    if (provider.availability !== 'configured' || !provider.loadEarthTextureSet) {
      return undefined;
    }

    const controller = new AbortController();

    void provider
      .loadEarthTextureSet(controller.signal)
      .then((textureSet) => {
        if (controller.signal.aborted) {
          return;
        }

        if (textureSet) {
          setState(buildReadyState(provider, textureSet, 'ready', null));
          return;
        }

        setState(
          buildReadyState(
            fallbackProvider,
            fallbackProvider.getEarthTextureSet(),
            'fallback',
            'Google Map Tiles satellite imagery returned no runtime Earth texture set. The home globe stayed on the offline baseline.'
          )
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        const failureReason =
          error instanceof Error
            ? error.message
            : 'Google Map Tiles satellite imagery failed unexpectedly. The home globe stayed on the offline baseline.';

        setState(
          buildReadyState(
            fallbackProvider,
            fallbackProvider.getEarthTextureSet(),
            'fallback',
            failureReason
          )
        );
      });

    return () => {
      controller.abort();
    };
  }, [fallbackProvider, provider]);

  return state;
}
