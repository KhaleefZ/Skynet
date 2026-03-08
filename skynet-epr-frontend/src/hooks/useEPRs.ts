'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEPRs } from '@/lib/api';
import type { EPRRecord } from '@/lib/types';

interface UseEPRsReturn {
  eprs: EPRRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEPRs(personId: string | null): UseEPRsReturn {
  const [eprs, setEprs] = useState<EPRRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEPRs = useCallback(async () => {
    if (!personId) {
      setEprs([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await getEPRs(personId);
      setEprs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch EPRs');
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    fetchEPRs();
  }, [fetchEPRs]);

  return { eprs, loading, error, refetch: fetchEPRs };
}
