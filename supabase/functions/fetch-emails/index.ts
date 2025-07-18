
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { EmailSummary, EmailsResponse } from '../_shared/types.ts';

interface MailboxConfig {
  id: string;
  email: string;
  imap_host: string;
  imap_port: number;
  imap_encryption: 'SSL/TLS' | 'STARTTLS' | 'None';
  username: string;
  password: string;
}

class SimpleIMAPClient {
  private conn: Deno.TcpConn | Deno.TlsConn | null = null;
  private config: MailboxConfig;

  constructor(config: MailboxConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    console.log(`Connecting to ${this.config.imap_host}:${this.config.imap_port}`);
    
    try {
      if (this.config.imap_encryption === 'SSL/TLS') {
        this.conn = await Deno.connectTls({
          hostname: this.config.imap_host,
          port: this.config.imap_port,
        });
      } else {
        this.conn = await Deno.connect({
          hostname: this.config.imap_host,
          port: this.config.imap_port,
        });
      }

      // Read initial greeting with timeout
      await this.readResponseWithTimeout(10000); // 10 second timeout for greeting
      console.log('Successfully connected to IMAP server');
    } catch (error) {
      console.error('Failed to connect to IMAP server:', error);
      throw new Error(`IMAP connection failed: ${error.message}`);
    }
  }

  async authenticate(): Promise<void> {
    console.log('Authenticating...');
    await this.sendCommand(`LOGIN ${this.config.username} ${this.config.password}`);
  }

  async selectInbox(): Promise<void> {
    console.log('Selecting INBOX...');
    await this.sendCommand('SELECT INBOX');
  }

  async fetchEmails(): Promise<EmailSummary[]> {
    console.log('Fetching recent emails...');
    
    // Search for recent emails
    const searchResponse = await this.sendCommand('SEARCH RECENT');
    const emailIds = this.parseSearchResponse(searchResponse);
    
    if (emailIds.length === 0) {
      console.log('No recent emails found, fetching last 10 emails');
      const allResponse = await this.sendCommand('SEARCH ALL');
      const allIds = this.parseSearchResponse(allResponse);
      const recentIds = allIds.slice(-10); // Get last 10 emails
      return await this.fetchEmailHeaders(recentIds);
    }
    
    return await this.fetchEmailHeaders(emailIds);
  }

  private async fetchEmailHeaders(emailIds: string[]): Promise<EmailSummary[]> {
    const emails: EmailSummary[] = [];
    
    for (const id of emailIds) {
      try {
        const headerResponse = await this.sendCommand(
          `FETCH ${id} (FLAGS ENVELOPE BODYSTRUCTURE)`
        );
        const email = this.parseEmailResponse(id, headerResponse);
        if (email) {
          emails.push(email);
        }
      } catch (error) {
        console.error(`Error fetching email ${id}:`, error);
      }
    }
    
    return emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private parseSearchResponse(response: string): string[] {
    const lines = response.split('\n');
    for (const line of lines) {
      if (line.startsWith('* SEARCH ')) {
        const ids = line.substring(9).trim();
        return ids ? ids.split(' ').filter(id => id) : [];
      }
    }
    return [];
  }

  private parseEmailResponse(id: string, response: string): EmailSummary | null {
    try {
      // Parse ENVELOPE data - this is a simplified parser
      const envelopeMatch = response.match(/ENVELOPE \(([^)]+)\)/);
      if (!envelopeMatch) return null;

      const flagsMatch = response.match(/FLAGS \(([^)]*)\)/);
      const flags = flagsMatch ? flagsMatch[1] : '';
      const isRead = flags.includes('\\Seen');

      // Simple envelope parsing - in real implementation this would be more robust
      const envelope = envelopeMatch[1];
      const parts = envelope.split(' ');
      
      const email: EmailSummary = {
        id: `${this.config.id}_${id}`,
        conversation_id: `conv_${this.config.id}_${id}`,
        from: this.cleanQuotedString(parts[2] || 'Unknown'),
        subject: this.cleanQuotedString(parts[1] || 'No Subject'),
        preview: `Email from ${this.cleanQuotedString(parts[2] || 'Unknown')}`,
        date: new Date().toISOString(), // Would parse date from envelope
        read: isRead,
        starred: false,
        status: isRead ? 'resolved' : 'new',
        has_attachments: false
      };

      return email;
    } catch (error) {
      console.error('Error parsing email response:', error);
      return null;
    }
  }

  private cleanQuotedString(str: string): string {
    return str.replace(/^"/, '').replace(/"$/, '').replace(/NIL/, 'Unknown');
  }

  private async sendCommand(command: string): Promise<string> {
    if (!this.conn) throw new Error('Not connected');
    
    const fullCommand = `A001 ${command}\r\n`;
    console.log(`Sending: ${fullCommand.trim()}`);
    
    const encoder = new TextEncoder();
    await this.conn.write(encoder.encode(fullCommand));
    
    return await this.readResponse();
  }

  private async readResponse(): Promise<string> {
    return this.readResponseWithTimeout(15000); // 15 second default timeout
  }

  private async readResponseWithTimeout(timeoutMs: number): Promise<string> {
    if (!this.conn) throw new Error('Not connected');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`IMAP response timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      let response = '';
      const decoder = new TextDecoder();
      const buffer = new Uint8Array(4096);
      
      const readLoop = async () => {
        try {
          while (true) {
            const bytesRead = await this.conn!.read(buffer);
            if (bytesRead === null) break;
            
            const chunk = decoder.decode(buffer.subarray(0, bytesRead));
            response += chunk;
            
            // Check if we have a complete response
            if (response.includes('A001 OK') || response.includes('A001 NO') || response.includes('A001 BAD') || 
                response.includes('* OK')) {
              clearTimeout(timeout);
              console.log(`Received: ${response.trim()}`);
              resolve(response);
              return;
            }
          }
          clearTimeout(timeout);
          resolve(response);
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };
      
      readLoop();
    });
  }

  async close(): Promise<void> {
    if (this.conn) {
      try {
        await this.sendCommand('LOGOUT');
      } catch (error) {
        console.error('Error during logout:', error);
      }
      this.conn.close();
      this.conn = null;
    }
  }
}

async function fetchEmailsFromImap(config: MailboxConfig): Promise<EmailSummary[]> {
  const client = new SimpleIMAPClient(config);
  
  try {
    await client.connect();
    await client.authenticate();
    await client.selectInbox();
    const emails = await client.fetchEmails();
    await client.close();
    
    console.log(`Successfully fetched ${emails.length} emails from IMAP`);
    return emails;
  } catch (error) {
    console.error('IMAP error:', error);
    await client.close();
    throw error;
  }
}

// In-memory storage as a fallback
// This is temporary and will reset when the function restarts
let emailsStore: EmailSummary[] | null = null;

// Initial emails data - only used if nothing exists in storage yet
const initialMockEmails: EmailSummary[] = [
  {
    id: "1",
    conversation_id: "1",
    from: "Acme Inc. <info@acme.com>",
    subject: "Website Redesign Quote",
    preview: "Hi, I'd like to discuss the quote for our website redesign project...",
    date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    read: false,
    starred: false,
    status: "new",
    has_attachments: false,
  },
  {
    id: "2",
    conversation_id: "2",
    from: "Jane Cooper <jane.cooper@example.com>",
    subject: "Product Return RMA-29384",
    preview: "I received my order yesterday but the product is damaged. I'd like to...",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: false,
    starred: true,
    status: "in-progress",
    has_attachments: true,
  },
  {
    id: "3",
    conversation_id: "3",
    from: "Globex Corporation <contact@globex.com>",
    subject: "Partnership Opportunity",
    preview: "We're interested in exploring a potential partnership with your...",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    read: true,
    starred: false,
    status: "new",
    has_attachments: false,
  }
];

// Helper function to get emails from storage or memory
async function getStoredEmails(): Promise<EmailSummary[]> {
  if (emailsStore) {
    console.log("Using emails from in-memory store");
    return emailsStore;
  }
  
  // Initialize with default data
  console.log("No stored emails found, using initial data");
  emailsStore = [...initialMockEmails];
  return emailsStore;
}

// Helper function to save emails to memory
async function saveEmails(emails: EmailSummary[]): Promise<void> {
  emailsStore = emails;
  console.log("Saved updated emails to in-memory store");
}

const handler = async (req: Request) => {
  console.log("[fetch-emails] Function called");
  
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
    const { mailboxId, page = 1, limit = 10, status, label, search, markAsReadId } = await req.json();
    
    // Get the target mailbox and try to fetch real emails
    let targetMailboxId = mailboxId;
    let mailboxConfig: MailboxConfig | null = null;
    
    if (!targetMailboxId) {
      const { data: primaryMailbox, error: mailboxError } = await supabase
        .from('mailboxes')
        .select('*')
        .eq('is_primary', true)
        .single();

      if (mailboxError || !primaryMailbox) {
        return new Response(
          JSON.stringify({ error: 'No primary mailbox found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      targetMailboxId = primaryMailbox.id;
      
      // Check if this mailbox has IMAP configuration
      if (primaryMailbox.imap_host && primaryMailbox.username && primaryMailbox.password) {
        mailboxConfig = {
          id: primaryMailbox.id,
          email: primaryMailbox.email,
          imap_host: primaryMailbox.imap_host,
          imap_port: primaryMailbox.imap_port || 993,
          imap_encryption: primaryMailbox.imap_encryption || 'SSL/TLS',
          username: primaryMailbox.username,
          password: primaryMailbox.password
        };
      }
    } else {
      // Check specific mailbox for IMAP config
      const { data: specificMailbox, error: mbError } = await supabase
        .from('mailboxes')
        .select('*')
        .eq('id', targetMailboxId)
        .single();
        
      if (!mbError && specificMailbox?.imap_host && specificMailbox.username && specificMailbox.password) {
        mailboxConfig = {
          id: specificMailbox.id,
          email: specificMailbox.email,
          imap_host: specificMailbox.imap_host,
          imap_port: specificMailbox.imap_port || 993,
          imap_encryption: specificMailbox.imap_encryption || 'SSL/TLS',
          username: specificMailbox.username,
          password: specificMailbox.password
        };
      }
    }

    let emails: EmailSummary[] = [];
    
    // Try to fetch real emails if IMAP is configured with timeout
    if (mailboxConfig) {
      console.log(`Fetching real emails from IMAP for mailbox: ${targetMailboxId}`);
      try {
        // Add timeout to prevent function from hanging
        const imapPromise = fetchEmailsFromImap(mailboxConfig);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('IMAP connection timeout')), 25000) // 25 second timeout
        );
        
        emails = await Promise.race([imapPromise, timeoutPromise]) as EmailSummary[];
        console.log(`Successfully fetched ${emails.length} emails from IMAP`);
      } catch (error) {
        console.error('Failed to fetch from IMAP, falling back to mock data:', error);
        emails = await getStoredEmails();
      }
    } else {
      console.log(`No IMAP configuration found for mailbox: ${targetMailboxId}, using mock data`);
      emails = await getStoredEmails();
    }
    
    // Handle marking email as read if markAsReadId is provided
    if (markAsReadId) {
      const emailIndex = emails.findIndex(email => email.id === markAsReadId);
      if (emailIndex !== -1) {
        console.log(`Marking email ${markAsReadId} as read`);
        emails[emailIndex].read = true;
        
        // If using stored emails, save the updated emails back to storage
        if (!mailboxConfig) {
          await saveEmails(emails);
          console.log("Saved updated read status to storage");
        }
      } else {
        console.log(`Email with ID ${markAsReadId} not found`);
      }
    }
    
    // Apply filters
    let filteredEmails = [...emails];
    
    if (status) {
      filteredEmails = filteredEmails.filter(email => email.status === status);
    }
    
    if (label) {
      filteredEmails = filteredEmails.filter(email => email.labels?.includes(label));
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredEmails = filteredEmails.filter(email => 
        email.subject.toLowerCase().includes(searchLower) || 
        email.preview.toLowerCase().includes(searchLower) ||
        email.from.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEmails = filteredEmails.slice(startIndex, endIndex);
    const totalCount = filteredEmails.length;
    const unreadCount = filteredEmails.filter(email => !email.read).length;

    const response: EmailsResponse = {
      emails: paginatedEmails,
      totalCount,
      unreadCount
    };

    console.log(`Emails fetched successfully: ${paginatedEmails.length}/${totalCount} emails`);

    return new Response(
      JSON.stringify(response),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in fetch-emails function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

Deno.serve(handler);
