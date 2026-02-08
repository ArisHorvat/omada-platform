export type NewsType = 'announcement' | 'alert' | 'event' | 'info';

export interface Attachment {
  name: string;
  url: string; // The remote URL (if saved)
  uri?: string; // The local URI (if just picked)
  type: string; // 'image/jpeg', 'application/pdf', etc.
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  type: NewsType;
  createdAt: string;
  attachments?: Attachment[];
  coverImageUrl?: string;
}