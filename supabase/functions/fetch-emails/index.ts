
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { EmailSummary, EmailsResponse } from '../_shared/types.ts';

// Helper function to simulate emails for a specific mailbox
function generateSimulatedEmails(mailboxId: string): EmailSummary[] {
  return [
    {
      id: `${mailboxId}_001`,
      conversation_id: `conv_${mailboxId}_001`,
      from: "Acme Inc. <info@acme.com>",
      subject: "Website Redesign Quote",
      preview: "Hi, I'd like to discuss the quote for our website redesign project...",
      date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: false,
      starred: false,
      status: "new",
      has_attachments: false,
    },
    {
      id: `${mailboxId}_002`,
      conversation_id: `conv_${mailboxId}_002`,
      from: "Jane Cooper <jane.cooper@example.com>",
      subject: "Product Return RMA-29384",
      preview: "I received my order yesterday but the product is damaged. I'd like to...",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      read: false,
      starred: true,
      status: "in-progress",
      has_attachments: true,
    },
    {
      id: `${mailboxId}_003`,
      conversation_id: `conv_${mailboxId}_003`,
      from: "Globex Corporation <contact@globex.com>",
      subject: "Partnership Opportunity",
      preview: "We're interested in exploring a potential partnership with your...",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      read: true,
      starred: false,
      status: "resolved",
      has_attachments: false,
    }
  ];
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
    
    // Get the target mailbox ID
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
    }

    console.log(`Generating simulated emails for mailbox: ${targetMailboxId}`);
    
    // Generate simulated emails based on the mailbox
    let mockEmails = generateSimulatedEmails(targetMailboxId);
    
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
