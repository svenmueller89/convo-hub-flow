
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { EmailSummary } from '../_shared/types.ts';

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
  console.log("[update-email-status] Function called");
  
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
    const { emailId, status, label } = await req.json();
    
    if (!emailId || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: emailId or status' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Get emails from storage
    let emails = await getStoredEmails();
    
    // Find and update the email
    const emailIndex = emails.findIndex(email => email.id === emailId);
    if (emailIndex === -1) {
      return new Response(
        JSON.stringify({ error: `Email with ID ${emailId} not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Update the email status
    console.log(`Updating email ${emailId} status from ${emails[emailIndex].status} to ${status}`);
    emails[emailIndex].status = status as 'new' | 'in-progress' | 'resolved';
    
    // Add label if provided
    if (label) {
      console.log(`Adding label ${label} to email ${emailId}`);
      emails[emailIndex].labels = emails[emailIndex].labels || [];
      if (!emails[emailIndex].labels.includes(label)) {
        emails[emailIndex].labels.push(label);
      }
    }
    
    // Save the updated emails back to storage
    await saveEmails(emails);
    
    // In a real app, we would update database records here
    console.log(`Email status updated successfully`);
    
    // Get updated emails
    const updatedEmailsResponse = {
      emails,
      totalCount: emails.length,
      newCount: emails.filter(e => !e.status || e.status === 'new').length
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: updatedEmailsResponse,
        message: `Email status updated successfully to ${status}` 
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in update-email-status function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

Deno.serve(handler);
