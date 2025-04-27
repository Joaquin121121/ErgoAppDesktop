export interface User {
  id?: string;
  email: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  last_sign_in_at?: string;
  confirmed_at?: string;
  is_confirmed?: boolean;
  role?: string;
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
    preferred_name?: string;
    [key: string]: any;
  };
  app_metadata?: {
    provider?: string;
    providers?: string[];
    [key: string]: any;
  };
}
