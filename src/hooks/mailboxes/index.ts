
import { useMailboxQuery } from './use-mailbox-query';
import { useMailboxMutations } from './use-mailbox-mutations';
import { useMailboxConnection } from './use-mailbox-connection';
import { UseMailboxesQuery, UseMailboxMutations, UseMailboxConnectionTest } from './types';

/**
 * Main hook that combines all mailbox-related hooks
 */
export const useMailboxes = (): UseMailboxesQuery & UseMailboxMutations & UseMailboxConnectionTest => {
  const query = useMailboxQuery();
  const mutations = useMailboxMutations();
  const connection = useMailboxConnection();

  return {
    ...query,
    ...mutations,
    ...connection
  };
};
