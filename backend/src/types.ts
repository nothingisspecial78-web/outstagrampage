export interface Profile {
  id: string;
  display_name: string;
  friend_code: string;
  hours_reclaimed: number;
  role?: 'member' | 'partner';
  created_at: string;
}

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
}

export interface Postcard {
  id: string;
  author_id: string;
  place_id: string;
  image_path: string;
  caption: string;
  taken_at: string;
  is_demo: boolean;
}

export interface CreatePostcardRequest {
  place_id: string;
  caption: string;
  lat: number;
  lng: number;
  accuracy_m?: number;
  image_base64: string;
  demo_mode?: boolean;
}

export interface MeetupToken {
  id: string;
  chat_id: string;
  created_by: string;
  token_hash: string;
  attempts: number;
  expires_at: string;
  used_at?: string;
  used_by?: string;
}

export interface Chat {
  id: string;
  user_a: string;
  user_b: string;
  message_count: number;
  message_cap: number;
  created_at: string;
}

export interface Stamp {
  id: string;
  user_id: string;
  kind: 'place' | 'meetup' | 'quest' | 'craft' | 'group';
  label: string;
  created_at: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  kind: 'walk' | 'read' | 'call' | 'help' | 'create' | 'explore';
}

export interface QuestLog {
  id: string;
  user_id: string;
  quest_id: string;
  log_date: string;
  reflection: string;
  minutes: number;
  created_at: string;
}

export interface CoachRequest {
  action: 'chat' | 'summary';
  message?: string;
}

export interface CoachResponse {
  reply: string;
  source: 'ai' | 'fallback';
  experiment?: {
    title: string;
    days: number;
    description?: string;
    why?: string;
  };
  remaining_today: number;
}
