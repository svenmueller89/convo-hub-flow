
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { Email, ConversationDetailResponse } from '../_shared/types.ts';

// Mock data for conversation details - in a real implementation, this would fetch from an email service
const mockEmails: Record<string, Email[]> = {
  "1": [
    {
      id: "1-1",
      mailbox_id: "1",
      conversation_id: "1",
      from: "Acme Inc. <info@acme.com>",
      to: ["support@convohub.com"],
      subject: "Website Redesign Quote",
      body: "Hi there,\n\nI'm reaching out to discuss the quote for our website redesign project. We're looking to modernize our online presence and improve our customer experience. Can you provide more details about your pricing structure and timeline?\n\nBest regards,\nTom Johnson\nMarketing Director, Acme Inc.",
      read: false,
      starred: false,
      date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      attachments: []
    },
    {
      id: "1-2",
      mailbox_id: "1",
      conversation_id: "1",
      from: "Support Team <support@convohub.com>",
      to: ["info@acme.com"],
      subject: "Re: Website Redesign Quote",
      body: "Hello Tom,\n\nThank you for reaching out about the website redesign project. I'd be happy to discuss our pricing structure and timeline in more detail.\n\nOur basic website redesign package starts at $5,000 and includes:\n- Custom design\n- Responsive layout\n- Basic SEO optimization\n- Content migration\n\nThe timeline is typically 4-6 weeks depending on the complexity of the project.\n\nWould you like to schedule a call to discuss your specific requirements?\n\nBest regards,\nJohn",
      read: true,
      starred: false,
      date: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      attachments: []
    }
  ],
  "2": [
    {
      id: "2-1",
      mailbox_id: "1",
      conversation_id: "2",
      from: "Jane Cooper <jane.cooper@example.com>",
      to: ["support@convohub.com"],
      subject: "Product Return RMA-29384",
      body: "I received my order yesterday but the product is damaged. I'd like to request a return and refund. The order number is #29384.\n\nPlease let me know the next steps.\n\nRegards,\nJane Cooper",
      read: false,
      starred: true,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      attachments: [
        {
          id: "attach-1",
          filename: "damaged_product.jpg",
          contentType: "image/jpeg",
          size: 1024000
        }
      ]
    },
    {
      id: "2-2",
      mailbox_id: "1",
      conversation_id: "2",
      from: "Support Team <support@convohub.com>",
      to: ["jane.cooper@example.com"],
      subject: "Re: Product Return RMA-29384",
      body: "Hi Jane,\n\nI'm sorry to hear about the damaged product. We'll process your return right away.\n\nPlease use the following return label and ship the item back to us. Once we receive it, we'll issue a full refund to your original payment method.\n\nIf you have any questions, please don't hesitate to reach out.\n\nBest regards,\nSupport Team",
      read: true,
      starred: false,
      date: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
      attachments: [
        {
          id: "attach-2",
          filename: "return_label.pdf",
          contentType: "application/pdf",
          size: 512000
        }
      ]
    }
  ],
  "3": [
    {
      id: "3-1",
      mailbox_id: "1",
      conversation_id: "3",
      from: "Globex Corporation <contact@globex.com>",
      to: ["support@convohub.com"],
      subject: "Partnership Opportunity",
      body: "Hello,\n\nWe're interested in exploring a potential partnership with your company. Our team has been impressed with your products and services, and we believe there could be synergies between our organizations.\n\nCould we schedule a meeting next week to discuss this further?\n\nBest regards,\nSidney Huffman\nBusiness Development, Globex Corporation",
      read: false,
      starred: false,
      date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      attachments: []
    }
  ],
  "4": [
    {
      id: "4-1",
      mailbox_id: "1",
      conversation_id: "4",
      from: "Robert Fox <robert.fox@example.com>",
      to: ["support@convohub.com"],
      subject: "Invoice #INV-5678",
      body: "Dear Support Team,\n\nI wanted to confirm that I've received invoice #INV-5678 and have processed the payment. The funds should be transferred to your account within 2-3 business days.\n\nPlease send a receipt once the payment has been received.\n\nThank you,\nRobert Fox",
      read: true,
      starred: false,
      date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      attachments: []
    },
    {
      id: "4-2",
      mailbox_id: "1",
      conversation_id: "4",
      from: "Support Team <support@convohub.com>",
      to: ["robert.fox@example.com"],
      subject: "Re: Invoice #INV-5678",
      body: "Hi Robert,\n\nThank you for confirming your payment for invoice #INV-5678. We appreciate your prompt attention to this matter.\n\nI'll send you a receipt as soon as the payment has been processed on our end.\n\nBest regards,\nAccounting Team",
      read: true,
      starred: false,
      date: new Date(Date.now() - 1000 * 60 * 60 * 71).toISOString(),
      attachments: []
    }
  ],
  "5": [
    {
      id: "5-1",
      mailbox_id: "1",
      conversation_id: "5",
      from: "Cory Smith <cory.smith@example.com>",
      to: ["support@convohub.com"],
      subject: "Technical Support Request",
      body: "Hello Support Team,\n\nI'm having trouble logging into my account. I've tried resetting my password multiple times, but I'm still unable to access my dashboard.\n\nCan you please help me resolve this issue?\n\nThanks,\nCory Smith",
      read: false,
      starred: false,
      date: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
      attachments: []
    },
    {
      id: "5-2",
      mailbox_id: "1",
      conversation_id: "5",
      from: "Support Team <support@convohub.com>",
      to: ["cory.smith@example.com"],
      subject: "Re: Technical Support Request",
      body: "Hi Cory,\n\nI'm sorry to hear you're having trouble accessing your account. Let's get this resolved for you.\n\nI've manually reset your password to a temporary one: TempPass123\n\nPlease log in using this password and then immediately change it to something secure. Let me know if you continue to experience any issues.\n\nBest regards,\nTech Support",
      read: true,
      starred: false,
      date: new Date(Date.now() - 1000 * 60 * 60 * 95).toISOString(),
      attachments: []
    }
  ],
  "6": [
    {
      id: "6-1",
      mailbox_id: "1",
      conversation_id: "6",
      from: "Abstergo Ltd. <info@abstergo.com>",
      to: ["support@convohub.com"],
      subject: "Order Confirmation #1234",
      body: "Thank you for your order #1234!\n\nWe're processing it now and will ship your items as soon as possible. You will receive a shipping confirmation email with tracking information when your order ships.\n\nHere's a summary of your order:\n- Product A: $299.00 (x1)\n- Product B: $149.50 (x2)\n- Shipping: $15.00\n- Total: $613.00\n\nIf you have any questions about your order, please don't hesitate to contact us.\n\nBest regards,\nAbstergo Customer Service",
      read: true,
      starred: false,
      date: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
      attachments: []
    }
  ]
};

// Mock customer data
const mockCustomers = {
  "1": {
    id: "cust-1",
    name: "Tom Johnson",
    email: "info@acme.com",
    company: "Acme Inc."
  },
  "2": {
    id: "cust-2",
    name: "Jane Cooper",
    email: "jane.cooper@example.com"
  },
  "3": {
    id: "cust-3",
    name: "Sidney Huffman",
    email: "contact@globex.com",
    company: "Globex Corporation"
  },
  "4": {
    id: "cust-4",
    name: "Robert Fox",
    email: "robert.fox@example.com"
  },
  "5": {
    id: "cust-5",
    name: "Cory Smith",
    email: "cory.smith@example.com"
  },
  "6": {
    id: "cust-6",
    name: "Customer Service",
    email: "info@abstergo.com",
    company: "Abstergo Ltd."
  }
};

// Helper functions for parsing email addresses
function extractNameFromEmailAddress(emailStr: string): string {
  if (!emailStr) return 'Unknown Customer';
  
  // Handle format like "Name <email@domain.com>"
  const match = emailStr.match(/^([^<]+)<[^>]+>$/);
  if (match) {
    return match[1].trim();
  }
  
  // Handle format like "email@domain.com"
  const emailMatch = emailStr.match(/^([^@]+)@/);
  if (emailMatch) {
    return emailMatch[1].trim();
  }
  
  return emailStr;
}

function extractEmailFromEmailAddress(emailStr: string): string {
  if (!emailStr) return '';
  
  // Handle format like "Name <email@domain.com>"
  const match = emailStr.match(/<([^>]+)>/);
  if (match) {
    return match[1].trim();
  }
  
  // Handle format like "email@domain.com"
  if (emailStr.includes('@')) {
    return emailStr.trim();
  }
  
  return '';
}

const handler = async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetch conversation function called');
    
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
    const { conversationId } = await req.json();

    console.log('Requested conversation ID:', conversationId);
    
    if (!conversationId) {
      console.error('No conversation ID provided');
      return new Response(
        JSON.stringify({ error: 'Conversation ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if this looks like a real email ID (contains mailbox_uid format)
    if (conversationId.includes('_') && conversationId.startsWith('conv_')) {
      console.log('This appears to be a real email, trying to fetch real content');
      
      // Extract email ID from conversation ID (remove 'conv_' prefix)
      const emailId = conversationId.replace('conv_', '');
      
      try {
        // Try to get real email content with timeout
        const contentPromise = supabase.functions.invoke('fetch-email-content', {
          body: { emailId: emailId }
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Conversation fetch timeout')), 15000)
        );
        
        const result = await Promise.race([contentPromise, timeoutPromise]);
        const { data: realContent, error: realError } = result as any;
        
        if (!realError && realContent) {
          console.log('Successfully fetched real email content');
          
          // Transform the real email content to match the expected format
          const transformedResponse: ConversationDetailResponse = {
            email: {
              id: emailId,
              mailbox_id: emailId.split('_')[0],
              conversation_id: conversationId,
              from: realContent.messages?.[0]?.from || 'Unknown Sender',
              to: realContent.messages?.[0]?.to ? [realContent.messages[0].to] : [''],
              subject: realContent.subject || 'No Subject',
              body: realContent.messages?.[0]?.content || 'No content available',
              read: false,
              starred: false,
              date: realContent.messages?.[0]?.date || new Date().toISOString(),
              attachments: realContent.messages?.[0]?.attachments || []
            },
            messages: realContent.messages?.map((msg: any) => ({
              id: msg.id,
              mailbox_id: emailId.split('_')[0],
              conversation_id: conversationId,
              from: msg.from,
              to: Array.isArray(msg.to) ? msg.to : [msg.to],
              subject: msg.subject,
              body: msg.content,
              read: false,
              starred: false,
              date: msg.date,
              attachments: msg.attachments || []
            })) || [],
            customer: {
              id: `real-customer-${emailId}`,
              name: extractNameFromEmailAddress(realContent.messages?.[0]?.from) || 'Unknown Customer',
              email: extractEmailFromEmailAddress(realContent.messages?.[0]?.from) || '',
              company: ''
            }
          };
          
          return new Response(
            JSON.stringify(transformedResponse),
            { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        } else {
          console.log('Real email fetch failed, falling back to mock data:', realError);
        }
      } catch (error) {
        console.log('Error fetching real email content, falling back to mock data:', error);
      }
    }

    
    // Fallback to mock data for demo emails
    console.log('Using mock conversation data');
    const conversationMessages = mockEmails[conversationId];
    
    if (!conversationMessages || conversationMessages.length === 0) {
      console.error('Conversation not found for ID:', conversationId);
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    const email = conversationMessages[0];
    
    // Get customer information
    const customer = mockCustomers[conversationId] || {
      id: `cust-unknown-${conversationId}`,
      name: email.from.split('<')[0].trim(),
      email: email.from.split('<')[1]?.replace('>', '') || "",
    };

    const response: ConversationDetailResponse = {
      email,
      messages: conversationMessages,
      customer
    };

    console.log('Returning conversation data:', JSON.stringify(response).substring(0, 500) + '...');

    return new Response(
      JSON.stringify(response),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in fetch-conversation function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

Deno.serve(handler);
