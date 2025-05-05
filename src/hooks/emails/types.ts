
import { EmailSummary, ConversationDetailResponse } from '@/types/email';

export interface SetEmailStatusParams {
  emailId: string;
  status: 'new' | 'in-progress' | 'resolved';
}

export interface UseEmailsReturnType {
  emails: EmailSummary[];
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<any>;
  selectedEmail: string | null;
  setSelectedEmail: (emailId: string) => void;
  getEmailById: (emailId: string) => EmailSummary | undefined;
  setEmailStatus: any; // Mutation return type
  markAsIrrelevant: any; // Mutation return type
  markAsSpam: any; // Mutation return type
  conversation: ConversationDetailResponse | null;
  conversationLoading: boolean;
  conversationError: unknown;
  allEmails: EmailSummary[];
}
