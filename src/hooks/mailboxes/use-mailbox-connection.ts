
import { supabase } from '@/integrations/supabase/client';
import { MailboxFormData, MailboxTestResult } from '@/types/mailbox';
import { UseMailboxConnectionTest } from './types';

/**
 * Hook for testing mailbox connection
 */
export const useMailboxConnection = (): UseMailboxConnectionTest => {
  // Test mailbox connection
  const testMailboxConnection = async (formData: MailboxFormData): Promise<MailboxTestResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('test-mailbox-connection', {
        body: {
          email: formData.email,
          imap_host: formData.imap_host,
          imap_port: formData.imap_port,
          imap_encryption: formData.imap_encryption,
          smtp_host: formData.smtp_host,
          smtp_port: formData.smtp_port,
          smtp_encryption: formData.smtp_encryption,
          username: formData.username,
          password: formData.password,
        }
      });

      if (error) {
        throw error;
      }

      return data as MailboxTestResult;
    } catch (error) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        details: {
          imap: {
            success: false,
            message: `IMAP test failed: ${error.message}`
          },
          smtp: {
            success: false,
            message: `SMTP test failed: ${error.message}`
          }
        }
      };
    }
  };

  return {
    testMailboxConnection
  };
};
