import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

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
      await this.readResponseWithTimeout(10000);
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

  async fetchEmailByUid(uid: string): Promise<any> {
    console.log(`Fetching email with UID: ${uid}`);
    
    try {
      // Fetch email headers and content
      const headerResponse = await this.sendCommand(
        `FETCH ${uid} (FLAGS ENVELOPE BODY[TEXT] BODY[HEADER])`
      );
      
      return this.parseEmailContent(uid, headerResponse);
    } catch (error) {
      console.error(`Error fetching email ${uid}:`, error);
      throw error;
    }
  }

  private parseEmailContent(uid: string, response: string): any {
    try {
      console.log('Parsing email content for UID:', uid);
      
      // Extract subject, from, to from ENVELOPE
      const envelopeMatch = response.match(/ENVELOPE \(([^)]+)\)/);
      const flagsMatch = response.match(/FLAGS \(([^)]*)\)/);
      const bodyTextMatch = response.match(/BODY\[TEXT\]\s*{[^}]*}\s*([^]*?)(?=\s*BODY\[HEADER\]|\s*\)|\s*$)/);
      const bodyHeaderMatch = response.match(/BODY\[HEADER\]\s*{[^}]*}\s*([^]*?)(?=\s*\)|\s*$)/);
      
      const flags = flagsMatch ? flagsMatch[1] : '';
      const isRead = flags.includes('\\Seen');
      
      let subject = 'No Subject';
      let from = 'Unknown Sender';
      let to = '';
      let date = new Date().toISOString();
      let content = 'No content available';
      
      // Parse envelope properly - ENVELOPE structure is (date subject from sender reply-to to cc bcc in-reply-to message-id)
      if (envelopeMatch) {
        try {
          const envelope = envelopeMatch[1];
          console.log('Raw envelope:', envelope.substring(0, 100));
          
          // Parse the envelope fields properly
          const fields = this.parseEnvelopeFields(envelope);
          console.log('Parsed envelope fields:', fields);
          
          if (fields.length > 0) date = this.parseDate(fields[0]) || date;
          if (fields.length > 1) subject = this.cleanQuotedString(fields[1] || 'No Subject');
          if (fields.length > 2) from = this.parseEmailAddress(fields[2]) || 'Unknown Sender';
          if (fields.length > 5) to = this.parseEmailAddress(fields[5]) || '';
        } catch (error) {
          console.error('Error parsing envelope:', error);
        }
      }
      
      // Get email content
      if (bodyTextMatch) {
        content = bodyTextMatch[1].trim();
      }
      
      // Parse headers for better from/to information
      if (bodyHeaderMatch) {
        const headers = bodyHeaderMatch[1];
        const fromMatch = headers.match(/From:\s*([^\r\n]+)/i);
        const toMatch = headers.match(/To:\s*([^\r\n]+)/i);
        const subjectMatch = headers.match(/Subject:\s*([^\r\n]+)/i);
        const dateMatch = headers.match(/Date:\s*([^\r\n]+)/i);
        
        if (fromMatch) from = fromMatch[1].trim();
        if (toMatch) to = toMatch[1].trim();
        if (subjectMatch) subject = subjectMatch[1].trim();
        if (dateMatch) {
          try {
            date = new Date(dateMatch[1].trim()).toISOString();
          } catch {
            date = new Date().toISOString();
          }
        }
      }

      return {
        id: `${this.config.id}_${uid}`,
        subject: subject,
        from: from,
        to: to,
        date: date,
        content: content,
        html: content.includes('<') ? content : `<pre>${content}</pre>`,
        text: content.replace(/<[^>]*>/g, ''),
        attachments: [],
        read: isRead
      };
    } catch (error) {
      console.error('Error parsing email content:', error);
      throw error;
    }
  }

  private cleanQuotedString(str: string): string {
    if (!str || str === 'NIL') return '';
    return str.replace(/^"/, '').replace(/"$/, '').trim();
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
    if (!addressField || addressField === 'NIL') return '';
    
    // Parse address structure like ((name NIL local domain))
    const match = addressField.match(/\(\("([^"]*)" NIL "([^"]*)" "([^"]*)"\)\)/);
    if (match) {
      const [, name, local, domain] = match;
      if (name && name !== 'NIL') {
        return `${name} <${local}@${domain}>`;
      } else {
        return `${local}@${domain}`;
      }
    }
    
    // Fallback for simpler formats
    const simpleMatch = addressField.match(/\(([^)]+)\)/);
    if (simpleMatch) {
      const parts = simpleMatch[1].split(' ');
      if (parts.length >= 4) {
        const name = this.cleanQuotedString(parts[0]);
        const local = this.cleanQuotedString(parts[2]);
        const domain = this.cleanQuotedString(parts[3]);
        if (name && name !== 'NIL') {
          return `${name} <${local}@${domain}>`;
        } else {
          return `${local}@${domain}`;
        }
      }
    }
    
    return addressField;
  }

  private parseDate(dateStr: string): string | null {
    if (!dateStr || dateStr === 'NIL') return null;
    
    try {
      const cleanDate = this.cleanQuotedString(dateStr);
      return new Date(cleanDate).toISOString();
    } catch {
      return null;
    }
  }

  private async sendCommand(command: string): Promise<string> {
    if (!this.conn) throw new Error('Not connected');
    
    const fullCommand = `A001 ${command}\r\n`;
    console.log(`Sending: ${fullCommand.trim()}`);
    
    const encoder = new TextEncoder();
    await this.conn.write(encoder.encode(fullCommand));
    
    return await this.readResponseWithTimeout(15000);
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

// Fetch email content using custom IMAP client
async function fetchEmailContent(config: MailboxConfig, emailId: string): Promise<any> {
  const client = new SimpleIMAPClient(config);
  
  try {
    await client.connect();
    await client.authenticate();
    await client.selectInbox();
    
    // Extract UID from email ID
    const uid = emailId.split('_').pop();
    if (!uid) {
      throw new Error('Invalid email ID format');
    }
    
    const emailContent = await client.fetchEmailByUid(uid);
    await client.close();
    
    console.log('Successfully fetched email content from IMAP');
    return emailContent;
  } catch (error) {
    console.error('IMAP error:', error);
    await client.close();
    throw error;
  }
}

const handler = async (req: Request) => {
  console.log("[fetch-email-content] Function called");
  
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
    const { emailId, mailboxId } = await req.json();
    
    if (!emailId) {
      return new Response(
        JSON.stringify({ error: 'Email ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get mailbox configuration
    let targetMailboxId = mailboxId;
    if (!targetMailboxId) {
      // Extract mailbox ID from email ID if not provided
      targetMailboxId = emailId.split('_')[0];
    }

    const { data: mailbox, error: mailboxError } = await supabase
      .from('mailboxes')
      .select('*')
      .eq('id', targetMailboxId)
      .single();

    if (mailboxError || !mailbox) {
      return new Response(
        JSON.stringify({ error: 'Mailbox not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if this is a real email (has IMAP config and email ID format)
    if (mailbox.imap_host && mailbox.username && mailbox.password && emailId.includes('_')) {
      console.log(`Fetching real email content for ${emailId}`);
      
      try {
        const mailboxConfig: MailboxConfig = {
          id: mailbox.id,
          email: mailbox.email,
          imap_host: mailbox.imap_host,
          imap_port: mailbox.imap_port || 993,
          imap_encryption: mailbox.imap_encryption || 'SSL/TLS',
          username: mailbox.username,
          password: mailbox.password
        };
        
        // Add timeout to prevent function from hanging
        const imapPromise = fetchEmailContent(mailboxConfig, emailId);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email content fetch timeout')), 20000) // 20 second timeout
        );
        
        const emailContent = await Promise.race([imapPromise, timeoutPromise]);
        
        // Format response to match expected conversation format
        const conversation = {
          id: emailId,
          subject: emailContent.subject,
          participants: [emailContent.from, emailContent.to].filter(Boolean),
          messages: [{
            id: `msg_${emailId}`,
            from: emailContent.from,
            to: emailContent.to,
            subject: emailContent.subject,
            content: emailContent.html || emailContent.text || 'No content available',
            date: emailContent.date,
            attachments: emailContent.attachments || []
          }]
        };

        console.log('Successfully fetched real email content');

        return new Response(
          JSON.stringify(conversation),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
        
      } catch (error) {
        console.error('Failed to fetch real email content:', error);
        // Fall through to mock data
      }
    }

    // Fallback to mock conversation data
    console.log('Using mock conversation data');
    const mockConversation = {
      id: emailId,
      subject: "Mock Email Subject",
      participants: ["sender@example.com", "recipient@example.com"],
      messages: [{
        id: `msg_${emailId}`,
        from: "sender@example.com",
        to: "recipient@example.com", 
        subject: "Mock Email Subject",
        content: "<p>This is mock email content. In a real implementation, this would be the actual email content fetched from your IMAP server.</p>",
        date: new Date().toISOString(),
        attachments: []
      }]
    };

    return new Response(
      JSON.stringify(mockConversation),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in fetch-email-content function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

Deno.serve(handler);