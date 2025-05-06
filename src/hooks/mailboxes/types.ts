
import { Mailbox, MailboxFormData, MailboxTestResult } from '@/types/mailbox';

export interface UseMailboxesQuery {
  mailboxes: Mailbox[] | undefined;
  primaryMailbox: Mailbox | undefined;
  isLoading: boolean;
  error: Error | null;
  hasPrimaryMailbox: () => boolean;
  hasMailboxes: () => boolean;
}

export interface UseMailboxMutations {
  addMailbox: {
    mutate: (formData: MailboxFormData) => void;
    mutateAsync: (formData: MailboxFormData) => Promise<Mailbox>;
    isLoading: boolean;
  };
  updateMailbox: {
    mutate: (params: { id: string; formData: Partial<MailboxFormData> }) => void;
    mutateAsync: (params: { id: string; formData: Partial<MailboxFormData> }) => Promise<Mailbox>;
    isLoading: boolean;
  };
  deleteMailbox: {
    mutate: (id: string) => void;
    mutateAsync: (id: string) => Promise<void>;
    isLoading: boolean;
  };
  setPrimaryMailbox: {
    mutate: (id: string) => void;
    mutateAsync: (id: string) => Promise<Mailbox>;
    isLoading: boolean;
  };
}

export interface UseMailboxConnectionTest {
  testMailboxConnection: (formData: MailboxFormData) => Promise<MailboxTestResult>;
}
