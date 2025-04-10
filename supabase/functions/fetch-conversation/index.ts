
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
  ]
};

// Mock customer data
const mockCustomers = {
  "1": {
    id: "cust-1",
    name: "Acme Inc.",
    email: "info@acme.com",
    company: "Acme Inc."
  },
  "2": {
    id: "cust-2",
    name: "Jane Cooper",
    email: "jane.cooper@example.com"
  }
};

const handler = async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    const { conversationId } = await req.json();

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'Conversation ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // In a real implementation, we would fetch conversation from an email service
    // For now, we'll use mock data
    const conversationMessages = mockEmails[conversationId];
    
    if (!conversationMessages || conversationMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get the main email (first in the conversation)
    const email = conversationMessages[0];
    
    // Get customer information
    const customer = mockCustomers[conversationId];

    // Mark the email as read
    // In a real implementation, we would update the database or email service
    
    const response: ConversationDetailResponse = {
      email,
      messages: conversationMessages,
      customer
    };

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
