import { useMemo } from 'react';
import { Account } from '@/lib/types';

export function useAccountTracking(accounts: Account[]) {
  return useMemo(() => {
    const activeAccounts = accounts.filter((a) => a.is_active);
    const accountCount = activeAccounts.length;

    return {
      showAccountField: accountCount > 1,
      defaultAccountId:
        accountCount === 1
          ? activeAccounts[0].id
          : activeAccounts.find((a) => a.is_primary)?.id || null,
      requireAccount: accountCount > 0,
      accounts: activeAccounts,
    };
  }, [accounts]);
}
