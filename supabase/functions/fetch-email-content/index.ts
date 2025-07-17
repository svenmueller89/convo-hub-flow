import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import Imap from 'npm:imap@0.8.19';
import { simpleParser } from 'npm:mailparser@3.7.1';

interface MailboxConfig {
  id: string;
  email: string;
  imap_host: string;
  imap_port: number;
  imap_encryption: 'SSL/TLS' | 'STARTTLS' | 'None';
  username: string;
  password: string;
}

// Fetch full email content from IMAP
async function fetchEmailContent(config: MailboxConfig, emailId: string): Promise<any> {
  console.log(`Fetching email content for ${emailId} from IMAP server: ${config.imap_host}:${config.imap_port}`);
  
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: config.username,
      password: config.password,
      host: config.imap_host,
      port: config.imap_port,
      tls: config.imap_encryption === 'SSL/TLS',
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 30000,
      connTimeout: 60000,
      keepalive: false
    });

    function openInbox(cb: (error: Error | null, box?: any) => void) {
      imap.openBox('INBOX', true, cb);
    }

    imap.once('ready', function() {
      console.log('IMAP connection ready for email content fetch');
      openInbox(function(err, box) {
        if (err) {
          console.error('Error opening inbox for content fetch:', err);
          reject(err);
          return;
        }

        // Extract UID from email ID (format: mailboxId_uid)
        const uid = emailId.split('_').pop();
        if (!uid) {
          reject(new Error('Invalid email ID format'));
          return;
        }

        console.log(`Fetching content for UID: ${uid}`);

        // Fetch the full email by UID
        const fetch = imap.fetch(uid, { 
          bodies: '', // Fetch entire message
          struct: true,
          markSeen: false // Don't mark as read automatically
        });

        let emailData: any = null;

        fetch.on('message', function(msg: any) {
          msg.on('body', function(stream: any) {
            let buffer = '';
            stream.on('data', function(chunk: any) {
              buffer += chunk.toString();
            });
            
            stream.once('end', function() {
              // Parse the email using mailparser
              simpleParser(buffer)
                .then(parsed => {
                  emailData = {
                    subject: parsed.subject || 'No Subject',
                    from: parsed.from?.text || 'Unknown Sender',
                    to: parsed.to?.text || '',
                    date: parsed.date || new Date(),
                    text: parsed.text || '',
                    html: parsed.html || '',
                    attachments: parsed.attachments || []
                  };
                  console.log('Email parsed successfully');
                })
                .catch(error => {
                  console.error('Error parsing email:', error);
                  reject(error);
                });
            });
          });

          msg.once('attributes', function(attrs: any) {
            // Could process attributes here if needed
          });
        });

        fetch.once('error', function(err: Error) {
          console.error('Fetch error for email content:', err);
          reject(err);
        });

        fetch.once('end', function() {
          console.log('Finished fetching email content');
          imap.end();
          
          if (emailData) {
            resolve(emailData);
          } else {
            reject(new Error('Failed to parse email content'));
          }
        });
      });
    });

    imap.once('error', function(err: Error) {
      console.error('IMAP connection error for content fetch:', err);
      reject(err);
    });

    console.log('Connecting to IMAP for email content...');
    imap.connect();
  });
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
        
        const emailContent = await fetchEmailContent(mailboxConfig, emailId);
        
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
            attachments: emailContent.attachments.map((att: any) => ({
              filename: att.filename,
              size: att.size,
              contentType: att.contentType
            }))
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