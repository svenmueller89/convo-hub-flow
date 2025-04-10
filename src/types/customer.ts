
export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerFormData = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
