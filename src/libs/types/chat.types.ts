export type Resource = {
  title: string;
  url: string;
  source: 'article' | 'news' | 'youtube';
};

export type ChatHistoryItem = {
  role?: string;
  text?: string;
};

export type ChatResponse = {
  answer: string;
  resources: Resource[];
};
