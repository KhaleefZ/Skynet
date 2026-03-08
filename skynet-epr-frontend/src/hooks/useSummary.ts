'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEPRSummary } from '@/lib/api';
import type { EPRSummary } from '@/lib/types';

interface UseSummaryReturn {
  summary: EPRSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSummary(personId: string | null): UseSummaryReturn {
  const [summary, setSummary] = useState<EPRSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!personId) {
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await getEPRSummary(personId);
      setSummary(data);
    } catch (err) {
      // Don't show error if simply no EPRs exist
      const message = err instanceof Error ? err.message : 'Failed to fetch summary';
      if (!message.includes('No EPR records')) {
        setError(message);
      }
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}
