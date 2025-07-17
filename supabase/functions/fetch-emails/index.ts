
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { EmailSummary, EmailsResponse } from '../_shared/types.ts';

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
  },
  {
    id: "4",
    conversation_id: "4",
    from: "Robert Fox <robert@foxindustries.com>",
    subject: "Invoice #INV-5678",
    preview: "Thank you for the prompt payment. The invoice has been marked as paid.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    read: true,
    starred: false,
    status: "resolved",
    has_attachments: true,
  },
  {
    id: "5",
    conversation_id: "5",
    from: "Cory Smith <cory.smith@example.com>",
    subject: "Technical Support Request",
    preview: "I'm having trouble logging into my account. I've tried resetting...",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
    read: true,
    starred: false,
    status: "in-progress",
    has_attachments: false,
  },
  {
    id: "6",
    conversation_id: "6",
    from: "Abstergo Ltd. <info@abstergo.com>",
    subject: "Order Confirmation #1234",
    preview: "Thank you for your order. We're processing it now and will ship...",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
    read: true,
    starred: false,
    status: "resolved",
    has_attachments: false,
  },
  {
    id: "7",
    conversation_id: "7",
    from: "Sarah Williams <sarah@example.com>",
    subject: "Meeting Follow-up",
    preview: "Thanks for the meeting yesterday. As discussed, I'm sending over the...",
    date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    read: false,
    starred: false,
    status: "new",
    has_attachments: true,
  },
  {
    id: "8",
    conversation_id: "8",
    from: "Newsletter <news@companyupdates.com>",
    subject: "Weekly Industry Insights",
    preview: "This week's top stories include new market trends and regulatory...",
    date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    read: true,
    starred: false,
    status: "resolved",
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
    
    // If a mailbox is configured with IMAP settings, try to fetch real emails
    let targetMailboxId = mailboxId;
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
        console.log(`Primary mailbox has IMAP config, delegating to fetch-imap-emails`);
        
        // Call the IMAP-specific function
        const imapResponse = await supabase.functions.invoke('fetch-imap-emails', {
          body: { mailboxId: targetMailboxId, page, limit, status, label, search }
        });
        
        if (imapResponse.error) {
          console.error('IMAP fetch failed, falling back to mock data:', imapResponse.error);
        } else {
          return new Response(
            JSON.stringify(imapResponse.data),
            { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      }
    } else {
      // Check specific mailbox for IMAP config
      const { data: specificMailbox, error: mbError } = await supabase
        .from('mailboxes')
        .select('*')
        .eq('id', targetMailboxId)
        .single();
        
      if (!mbError && specificMailbox?.imap_host && specificMailbox.username && specificMailbox.password) {
        console.log(`Mailbox ${targetMailboxId} has IMAP config, delegating to fetch-imap-emails`);
        
        const imapResponse = await supabase.functions.invoke('fetch-imap-emails', {
          body: { mailboxId: targetMailboxId, page, limit, status, label, search }
        });
        
        if (imapResponse.error) {
          console.error('IMAP fetch failed, falling back to mock data:', imapResponse.error);
        } else {
          return new Response(
            JSON.stringify(imapResponse.data),
            { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      }
    }

    
    // Fallback to mock emails if IMAP is not configured or failed
    console.log("Using mock email data as fallback");
    let mockEmails = await getStoredEmails();
    
    // Handle marking email as read if markAsReadId is provided
    if (markAsReadId) {
      const emailIndex = mockEmails.findIndex(email => email.id === markAsReadId);
      if (emailIndex !== -1) {
        console.log(`Marking email ${markAsReadId} as read`);
        mockEmails[emailIndex].read = true;
        
        // Save the updated emails back to storage
        await saveEmails(mockEmails);
        console.log("Saved updated read status to storage");
      } else {
        console.log(`Email with ID ${markAsReadId} not found`);
      }
    }
    let filteredEmails = [...mockEmails];
    
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

    console.log("Emails fetched successfully:", response);

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
