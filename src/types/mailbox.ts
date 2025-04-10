
export interface Mailbox {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface MailboxFormData {
  email: string;
  display_name?: string;
  is_primary?: boolean;
}
