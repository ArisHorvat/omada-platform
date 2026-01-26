import { useState, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '@/src/context/AuthContext';
import { CurrentOrganizationService } from '@/src/services/CurrentOrganizationService';
import { ChatService, ChatMessage } from '@/src/services/ChatService';
import { WS_BASE_URL } from '@/src/config/config';

export const useChatLogic = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUserId(decoded.sub || decoded.nameid);
      } catch (e) {}
    }
    const unsubscribe = CurrentOrganizationService.subscribe((data) => {
      if (data) setOrgId(data.id);
    });
    return () => unsubscribe();
  }, [token]);

  useEffect(() => {
    if (!orgId) return;

    ChatService.getRecentMessages(orgId).then(setMessages).catch(console.error);

    ws.current = new WebSocket(`${WS_BASE_URL}/ws/organizations?orgId=${orgId}`);
    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'chat_message') {
          setMessages((prev) => [...prev, msg.data]);
        }
      } catch (e) { console.error(e); }
    };

    return () => {
      ws.current?.close();
    };
  }, [orgId]);

  const handleSend = async () => {
    if (!inputText.trim() || !orgId) return;
    const content = inputText;
    setInputText('');
    try {
      await ChatService.sendMessage(orgId, content);
    } catch (e) {
      console.error(e);
      setInputText(content);
    }
  };

  return { messages, inputText, setInputText, handleSend, userId };
};
