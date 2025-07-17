-- Add missing mailbox configuration columns
ALTER TABLE public.mailboxes 
ADD COLUMN imap_host TEXT,
ADD COLUMN imap_port INTEGER DEFAULT 993,
ADD COLUMN imap_encryption TEXT DEFAULT 'SSL/TLS' CHECK (imap_encryption IN ('SSL/TLS', 'STARTTLS', 'None')),
ADD COLUMN smtp_host TEXT,
ADD COLUMN smtp_port INTEGER DEFAULT 587,
ADD COLUMN smtp_encryption TEXT DEFAULT 'SSL/TLS' CHECK (smtp_encryption IN ('SSL/TLS', 'STARTTLS', 'None')),
ADD COLUMN username TEXT,
ADD COLUMN password TEXT,
ADD COLUMN last_sync TIMESTAMP WITH TIME ZONE,
ADD COLUMN connection_status TEXT DEFAULT 'pending' CHECK (connection_status IN ('connected', 'error', 'pending')),
ADD COLUMN error_message TEXT;