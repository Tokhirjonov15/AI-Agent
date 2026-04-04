import { ChatHistoryItem } from '../../libs/types/chat.types';

export class ChatRequestDto {
  question?: string;
  goal?: string;
  history?: ChatHistoryItem[];
}
