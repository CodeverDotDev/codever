/**
 * A single Codever entry (bookmark or note) the assistant used as context,
 * rendered as a clickable reference card next to the answer.
 */
export interface AssistantReference {
  type: 'bookmark' | 'note';
  id: string;
  title: string;
  url?: string;
  excerpt: string;
}

/** Response returned by POST /personal/users/:userId/assistant/chat */
export interface AssistantResponse {
  answer: string;
  references: AssistantReference[];
}

/** A message in the local chat transcript. */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  references?: AssistantReference[];
  /** true when this assistant message represents an error state */
  error?: boolean;
}

