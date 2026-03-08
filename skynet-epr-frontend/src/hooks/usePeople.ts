'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPeople } from '@/lib/api';
import type { Person, Role } from '@/lib/types';

interface UsePeopleOptions {
  role?: Role;
  search?: string;
}

interface UsePeopleReturn {
  people: Person[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePeople(options: UsePeopleOptions = {}): UsePeopleReturn {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeople = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getPeople({
        role: options.role,
        search: options.search,
      });
      setPeople(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch people');
    } finally {
      setLoading(false);
    }
  }, [options.role, options.search]);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  return { people, loading, error, refetch: fetchPeople };
}
