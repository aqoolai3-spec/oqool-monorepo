// src/hooks/useAI.ts
import { useState, useCallback, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  personality?: string;
  emoji?: string;
  timestamp: Date;
}

interface Personality {
  id: string;
  name: string;
  emoji: string;
}

interface Model {
  id: string;
  name: string;
  description: string;
}

export function useAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPersonality, setCurrentPersonality] = useState<string>('coder');
  const [currentModel, setCurrentModel] = useState<string>('claude-sonnet-4-20250514');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [personalities, setPersonalities] = useState<Personality[]>([]);
  const [models, setModels] = useState<Model[]>([]);

  // ============================================
  // تحميل الشخصيات والنماذج عند البداية
  // ============================================
  useEffect(() => {
    loadPersonalities();
    loadModels();
  }, []);

  const loadPersonalities = async () => {
    try {
      const result = await window.electron.ai.getPersonalities();
      setPersonalities(result);
    } catch (error) {
      console.error('Error loading personalities:', error);
    }
  };

  const loadModels = async () => {
    try {
      const result = await window.electron.ai.getModels();
      setModels(result);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  // ============================================
  // 1. إرسال رسالة عادية
  // ============================================
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // إضافة رسالة المستخدم
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await window.electron.ai.sendMessage(
        content,
        currentPersonality,
        currentModel
      );

      if (response.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.message,
          personality: response.personality,
          emoji: response.emoji,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // رسالة خطأ
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `خطأ: ${response.error}`,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `خطأ: ${error.message}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPersonality, currentModel]);

  // ============================================
  // 2. إرسال رسالة مع Streaming
  // ============================================
  const sendMessageWithStreaming = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // إضافة رسالة المستخدم
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');

    // إضافة رسالة فارغة للـ streaming
    const streamMessageId = (Date.now() + 1).toString();
    const streamMessage: Message = {
      id: streamMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, streamMessage]);

    try {
      // الاستماع للـ chunks
      window.electron.ai.onChunk((chunk: string) => {
        setStreamingContent(prev => {
          const newContent = prev + chunk;
          
          // تحديث الرسالة
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === streamMessageId
                ? { ...msg, content: newContent }
                : msg
            )
          );
          
          return newContent;
        });
      });

      // إرسال الرسالة
      await window.electron.ai.streamMessage(
        content,
        currentPersonality,
        currentModel,
        (chunk: string) => {
          setStreamingContent(prev => prev + chunk);
        }
      );

    } catch (error: any) {
      console.error('Error streaming message:', error);
      
      // تحديث برسالة خطأ
      setMessages(prev =>
        prev.map(msg =>
          msg.id === streamMessageId
            ? { ...msg, content: `خطأ: ${error.message}` }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  }, [currentPersonality, currentModel]);

  // ============================================
  // 3. God Mode - استشارة جميع الشخصيات
  // ============================================
  const godMode = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // إضافة رسالة المستخدم
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await window.electron.ai.godMode(content, currentModel);

      if (response.success) {
        // إضافة رسالة من كل شخصية
        response.results.forEach((result: any, index: number) => {
          const message: Message = {
            id: `${Date.now()}-${index}`,
            role: 'assistant',
            content: result.response,
            personality: result.personality,
            emoji: result.emoji,
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, message]);
        });
      }
    } catch (error: any) {
      console.error('Error in God Mode:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentModel]);

  // ============================================
  // 4. مسح المحادثة
  // ============================================
  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  // ============================================
  // 5. حذف رسالة
  // ============================================
  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  // ============================================
  // 6. تصدير المحادثة
  // ============================================
  const exportChat = useCallback(() => {
    const chatText = messages
      .map(msg => {
        const prefix = msg.role === 'user' ? 'أنت' : msg.personality || 'AI';
        return `[${prefix}]: ${msg.content}\n`;
      })
      .join('\n');

    return chatText;
  }, [messages]);

  // ============================================
  // 7. تغيير الشخصية
  // ============================================
  const changePersonality = useCallback((personalityId: string) => {
    setCurrentPersonality(personalityId);
  }, []);

  // ============================================
  // 8. تغيير النموذج
  // ============================================
  const changeModel = useCallback((modelId: string) => {
    setCurrentModel(modelId);
  }, []);

  return {
    // State
    messages,
    currentPersonality,
    currentModel,
    isLoading,
    streamingContent,
    personalities,
    models,
    
    // Actions
    sendMessage,
    sendMessageWithStreaming,
    godMode,
    clearChat,
    deleteMessage,
    exportChat,
    changePersonality,
    changeModel,
  };
}
