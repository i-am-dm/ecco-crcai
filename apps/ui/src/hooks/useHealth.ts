import { useQuery } from '@tanstack/react-query';
import { rawGet } from '@/lib/api';

type OpsHealth = {
  snapshotLagP95_s: number;
  handlerErrorRate: number;
  storageBytes: number;
  storageGB: number;
  estMonthlyCostUSD: number;
};

export function useOpsHealth() {
  return useQuery<OpsHealth>({
    queryKey: ['ops', 'health'],
    queryFn: async () => {
      const data = await rawGet('/v1/ops/health');
      return data as OpsHealth;
    },
    staleTime: 60000,
  });
}
