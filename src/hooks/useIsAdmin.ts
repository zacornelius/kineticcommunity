'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export function useIsAdmin() {
  const { data: session } = useSession();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-status'],
    queryFn: async () => {
      const res = await fetch('/api/admin/status');
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Admin status check failed:', res.status, res.statusText, errorText);
        return false;
      }
      const data = await res.json();
      console.log('Admin status response:', data);
      return data.isAdmin as boolean;
    },
    enabled: !!session?.user?.id,
    staleTime: 60000 * 5, // Cache for 5 minutes
  });

  if (error) {
    console.error('Admin status query error:', error);
  }

  return { isAdmin: data ?? false, isLoading };
}
