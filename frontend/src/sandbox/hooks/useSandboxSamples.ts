import { useCallback, useEffect, useState } from 'react';
import {
  type SampleFilters,
  type SampleListResponse,
  sandboxSamplesApi,
} from '../api/sandboxClient';

export function useSandboxSamples(filters: SampleFilters) {
  const [data, setData] = useState<SampleListResponse>({
    items: [],
    total: 0,
    page: 1,
    per_page: filters.per_page ?? 24,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stableKey = JSON.stringify(filters);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sandboxSamplesApi.list(filters);
      setData(res);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Failed to load samples');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
