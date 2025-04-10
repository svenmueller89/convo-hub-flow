
export type CustomerInteraction = {
  id: string;
  customer_id: string;
  user_id: string;
  content: string;
  interaction_type: string;
  created_at: string;
  updated_at: string;
};

export type CustomerInteractionFormData = Pick<CustomerInteraction, 'content' | 'interaction_type'>;
