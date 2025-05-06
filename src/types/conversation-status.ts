
export interface ConversationStatus {
  id: string;
  name: string;
  color: string;
  is_default: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationStatusFormData {
  name: string;
  color: string;
  is_default?: boolean;
}
