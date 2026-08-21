import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../types/ChatMessage';

const CHAT_KEY = '@gunluk_asistan/chat_messages';
const MAX_MESSAGES = 60;

export async function getChatMessages(): Promise<ChatMessage[]> {
  const raw = await AsyncStorage.getItem(CHAT_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as ChatMessage[];
}

export async function appendChatMessage(message: ChatMessage): Promise<ChatMessage[]> {
  const messages = await getChatMessages();
  const updated = [...messages, message].slice(-MAX_MESSAGES);
  await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(updated));
  return updated;
}

export async function clearChatMessages(): Promise<void> {
  await AsyncStorage.removeItem(CHAT_KEY);
}
