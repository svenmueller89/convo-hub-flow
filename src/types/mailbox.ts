
export interface Mailbox {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  imap_host?: string;
  imap_port?: number;
  imap_encryption?: 'SSL/TLS' | 'STARTTLS' | 'None';
  smtp_host?: string;
  smtp_port?: number;
  smtp_encryption?: 'SSL/TLS' | 'STARTTLS' | 'None';
  username?: string;
  last_sync?: string;
  connection_status?: 'connected' | 'error' | 'pending';
  error_message?: string;
}

export interface MailboxFormData {
  email: string;
  display_name?: string;
  is_primary?: boolean;
  imap_host?: string;
  imap_port?: number;
  imap_encryption?: 'SSL/TLS' | 'STARTTLS' | 'None';
  smtp_host?: string;
  smtp_port?: number;
  smtp_encryption?: 'SSL/TLS' | 'STARTTLS' | 'None';
  username?: string;
  password?: string;
}

export interface MailboxTestResult {
  success: boolean;
  message: string;
  details?: {
    imap?: {
      success: boolean;
      message: string;
    };
    smtp?: {
      success: boolean;
      message: string;
    };
  };
}
