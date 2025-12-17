export interface DocumentState {
  title: string;
  content: string;
}

export interface Reference {
  id: string;
  authors: string;
  year: string;
  title: string;
  source: string;
  doi?: string;
  linkedInText?: boolean;
}

export interface Suggestion {
  id: string;
  originalText: string;
  suggestedText: string;
  type: 'rewrite' | 'shorten' | 'expand' | 'academic' | 'custom';
  rationale?: string;
  accepted?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  suggestion?: Suggestion;
  timestamp?: number;
}

export enum ViewMode {
  EDITOR = 'EDITOR',
  REFERENCES = 'REFERENCES',
}
