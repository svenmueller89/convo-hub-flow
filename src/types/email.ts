
export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface Email {
  id: string;
  mailbox_id: string;
  conversation_id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  html_body?: string;
  read: boolean;
  starred: boolean;
  date: string;
  labels?: string[];
  attachments?: EmailAttachment[];
  status?: 'new' | 'in-progress' | 'resolved'; // Explicitly defined status property
}

export interface EmailSummary {
  id: string;
  conversation_id: string;
  from: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  starred: boolean;
  status: 'new' | 'in-progress' | 'resolved';
  labels?: string[];
  has_attachments: boolean;
}

export interface FetchEmailsParams {
  mailboxId?: string;
  page?: number;
  limit?: number;
  status?: string;
  label?: string;
  search?: string;
}

export interface EmailsResponse {
  emails: EmailSummary[];
  totalCount: number;
  unreadCount: number;
}

export interface ConversationDetailResponse {
  email: Email;
  messages: Email[];
  customer?: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
}
