
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
      console.log(`Parsing email response for ID ${id}:`, response.substring(0, 200));
      
      // Parse ENVELOPE data - ENVELOPE has this structure:
      // (date subject from sender reply-to to cc bcc in-reply-to message-id)
      const envelopeMatch = response.match(/ENVELOPE \(([^)]+(?:\([^)]*\))*[^)]*)\)/);
      if (!envelopeMatch) {
        console.log('No ENVELOPE found in response');
        return null;
      }

      const flagsMatch = response.match(/FLAGS \(([^)]*)\)/);
      const flags = flagsMatch ? flagsMatch[1] : '';
      const isRead = flags.includes('\\Seen');

      // Parse the envelope - it's a complex nested structure
      const envelope = envelopeMatch[1];
      console.log('Raw envelope:', envelope.substring(0, 100));
      
      // Parse envelope fields properly
      const fields = this.parseEnvelopeFields(envelope);
      console.log('Parsed envelope fields:', fields);
      
      let date = new Date().toISOString();
      let subject = 'No Subject';
      let fromEmail = 'Unknown Sender';
      
      // Extract fields: 0=date, 1=subject, 2=from, 3=sender, 4=reply-to, 5=to
      if (fields.length > 0 && fields[0] !== 'NIL') {
        date = this.parseDate(fields[0]) || date;
      }
      if (fields.length > 1 && fields[1] !== 'NIL') {
        subject = this.cleanQuotedString(fields[1]);
      }
      if (fields.length > 2 && fields[2] !== 'NIL') {
        fromEmail = this.parseEmailAddress(fields[2]);
      }
      
      const email: EmailSummary = {
        id: `${this.config.id}_${id}`,
        conversation_id: `conv_${this.config.id}_${id}`,
        from: fromEmail || 'Unknown Sender',
        subject: subject || 'No Subject',
        preview: `${subject ? subject.substring(0, 100) : 'No preview available'}`,
        date: date,
        read: isRead,
        starred: false,
        status: 'new', // Always start as new, status will be managed by the app
        has_attachments: false
      };

      console.log('Parsed email:', email);
      return email;
    } catch (error) {
      console.error('Error parsing email response:', error);
      return null;
    }
  }

  private parseEnvelopeFields(envelope: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    let parenDepth = 0;
    let i = 0;
    
    while (i < envelope.length) {
      const char = envelope[i];
      
      if (char === '"' && envelope[i-1] !== '\\') {
        inQuotes = !inQuotes;
        current += char;
      } else if (!inQuotes && char === '(') {
        parenDepth++;
        current += char;
      } else if (!inQuotes && char === ')') {
        parenDepth--;
        current += char;
      } else if (!inQuotes && char === ' ' && parenDepth === 0) {
        if (current.trim()) {
          fields.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
      i++;
    }
    
    if (current.trim()) {
      fields.push(current.trim());
    }
    
    return fields;
  }

  private parseEmailAddress(addressField: string): string {
    if (!addressField || addressField === 'NIL') return 'Unknown Sender';
    
    console.log('Parsing address field:', addressField);
    
    // Parse address structure like ((name NIL local domain))
    const doubleParenMatch = addressField.match(/\(\(("([^"]*)" NIL "([^"]*)" "([^"]*)")\)\)/);
    if (doubleParenMatch) {
      const [, , name, local, domain] = doubleParenMatch;
      if (name && name !== 'NIL' && name.trim()) {
        return `${name} <${local}@${domain}>`;
      } else {
        return `${local}@${domain}`;
      }
    }
    
    // Parse address structure like (name NIL local domain)
    const singleParenMatch = addressField.match(/\("([^"]*)" NIL "([^"]*)" "([^"]*)"\)/);
    if (singleParenMatch) {
      const [, name, local, domain] = singleParenMatch;
      if (name && name !== 'NIL' && name.trim()) {
        return `${name} <${local}@${domain}>`;
      } else {
        return `${local}@${domain}`;
      }
    }
    
    // Handle encoded names like =?UTF-8?B?...
    const encodedMatch = addressField.match(/\("([^"]*)" NIL "([^"]*)" "([^"]*)"\)/);
    if (encodedMatch) {
      const [, encodedName, local, domain] = encodedMatch;
      let name = encodedName;
      
      // Decode base64 encoded names
      if (encodedName.includes('=?UTF-8?B?')) {
        try {
          const base64Part = encodedName.match(/=\?UTF-8\?B\?([^?]+)\?=/);
          if (base64Part) {
            name = atob(base64Part[1]);
          }
        } catch (e) {
          console.log('Failed to decode base64 name:', e);
        }
      }
      
      // Decode quoted-printable encoded names
      if (encodedName.includes('=?utf-8?Q?')) {
        try {
          const qpPart = encodedName.match(/=\?utf-8\?Q\?([^?]+)\?=/);
          if (qpPart) {
            name = decodeURIComponent(qpPart[1].replace(/=/g, '%'));
          }
        } catch (e) {
          console.log('Failed to decode quoted-printable name:', e);
        }
      }
      
      if (name && name !== 'NIL' && name.trim()) {
        return `${name} <${local}@${domain}>`;
      } else {
        return `${local}@${domain}`;
      }
    }
    
    // Return the original if nothing matches
    return addressField.substring(0, 50); // Limit length for safety
  }

  private parseDate(dateStr: string): string {
    try {
      // Remove quotes and parse
      const cleanDate = dateStr.replace(/"/g, '');
      return new Date(cleanDate).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  private cleanQuotedString(str: string): string {
    if (!str || str === 'NIL') return '';
    return str.replace(/^"/, '').replace(/"$/, '').trim();
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
