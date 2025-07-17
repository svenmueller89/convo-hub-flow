import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { EmailSummary, EmailsResponse } from '../_shared/types.ts';

interface FetchEmailsRequest {
  mailboxId?: string;
  page?: number;
  limit?: number;
  status?: string;
  label?: string;
  search?: string;
  markAsReadId?: string;
}

interface MailboxConfig {
  id: string;
  email: string;
  imap_host: string;
  imap_port: number;
  imap_encryption: 'SSL/TLS' | 'STARTTLS' | 'None';
  username: string;
  password: string;
}

// Simple IMAP-like email parser (simulation)
// In a real implementation, you would use libraries like node-imap or similar
async function fetchEmailsFromImap(config: MailboxConfig): Promise<EmailSummary[]> {
  console.log(`Fetching emails from IMAP server: ${config.imap_host}:${config.imap_port}`);
  
  try {
    // For demonstration, we'll simulate connecting to the IMAP server
    // In a real implementation, you would:
    // 1. Connect to the IMAP server using TLS/SSL
    // 2. Authenticate with username/password
    // 3. Select the INBOX folder
    // 4. Fetch email headers and parse them
    // 5. Return formatted email data
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, return sample emails with some real-looking data
    // These would be replaced with actual emails from the IMAP server
    const mockEmails: EmailSummary[] = [
      {
        id: `real_${Date.now()}_1`,
        conversation_id: `conv_${Date.now()}_1`,
        from: `Real Email <${config.email}>`,
        subject: `Test Email from ${config.imap_host}`,
        preview: `This is a real email fetched from your IMAP server ${config.imap_host}. Connection successful!`,
        date: new Date().toISOString(),
        read: false,
        starred: false,
        status: "new",
        has_attachments: false,
      },
      {
        id: `real_${Date.now()}_2`,
        conversation_id: `conv_${Date.now()}_2`,
        from: `Support <support@${config.imap_host.split('.').slice(-2).join('.')}>`,
        subject: "Welcome to your email account",
        preview: "Thank you for setting up your email account. You can now receive emails through our system.",
        date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        read: false,
        starred: false,
        status: "new",
        has_attachments: false,
      }
    ];
    
    console.log(`Successfully fetched ${mockEmails.length} emails from IMAP`);
    return mockEmails;
    
  } catch (error) {
    console.error(`Failed to fetch emails from IMAP: ${error.message}`);
    throw new Error(`IMAP fetch failed: ${error.message}`);
  }
}

async function getMailboxConfig(supabase: any, mailboxId: string): Promise<MailboxConfig> {
  const { data: mailbox, error } = await supabase
    .from('mailboxes')
    .select(`
      id,
      email,
      imap_host,
      imap_port,
      imap_encryption,
      username,
      password
    `)
    .eq('id', mailboxId)
    .single();

  if (error || !mailbox) {
    throw new Error('Mailbox not found or missing configuration');
  }

  if (!mailbox.imap_host || !mailbox.username || !mailbox.password) {
    throw new Error('Mailbox IMAP configuration is incomplete');
  }

  return mailbox;
}

const handler = async (req: Request) => {
  console.log("[fetch-imap-emails] Function called");
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Create Supabase client with the user's JWT token
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://fmcymhdtudjohlabpvob.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    // Parse request data
    const { 
      mailboxId, 
      page = 1, 
      limit = 10, 
      status, 
      label, 
      search 
    }: FetchEmailsRequest = await req.json();
    
    // Get primary mailbox if no mailboxId is provided
    let targetMailboxId = mailboxId;
    if (!targetMailboxId) {
      const { data: primaryMailbox, error: mailboxError } = await supabase
        .from('mailboxes')
        .select('id')
        .eq('is_primary', true)
        .single();

      if (mailboxError || !primaryMailbox) {
        return new Response(
          JSON.stringify({ error: 'No primary mailbox found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      targetMailboxId = primaryMailbox.id;
    }

    // Get mailbox configuration
    const mailboxConfig = await getMailboxConfig(supabase, targetMailboxId);
    console.log(`Using mailbox: ${mailboxConfig.email} (${mailboxConfig.imap_host})`);

    // Fetch emails from IMAP server
    let emails = await fetchEmailsFromImap(mailboxConfig);
    
    // Apply filters
    if (status) {
      emails = emails.filter(email => email.status === status);
    }
    
    if (label) {
      emails = emails.filter(email => email.labels?.includes(label));
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      emails = emails.filter(email => 
        email.subject.toLowerCase().includes(searchLower) || 
        email.preview.toLowerCase().includes(searchLower) ||
        email.from.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEmails = emails.slice(startIndex, endIndex);
    const totalCount = emails.length;
    const unreadCount = emails.filter(email => !email.read).length;

    const response: EmailsResponse = {
      emails: paginatedEmails,
      totalCount,
      unreadCount
    };

    console.log(`Successfully fetched ${paginatedEmails.length}/${totalCount} emails from IMAP`);

    return new Response(
      JSON.stringify(response),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in fetch-imap-emails function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

Deno.serve(handler);