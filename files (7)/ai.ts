// electron/ipc/ai.ts
import { ipcMain } from 'electron';
import Anthropic from '@anthropic-ai/sdk';

// تهيئة Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// ============================================
// تعريف الشخصيات الـ8
// ============================================

const PERSONALITIES = {
  architect: {
    name: 'Architect - System Designer',
    emoji: '🏗️',
    systemPrompt: `أنت مهندس نظام خبير. تخصصك:
- تصميم البنية المعمارية للأنظمة
- اقتراح أنماط التصميم (Design Patterns)
- تحليل البنية الحالية واقتراح تحسينات
- التفكير على مستوى عالي (High-level architecture)

أسلوبك: محترف، استراتيجي، يفكر بالصورة الكبيرة.`,
  },
  
  coder: {
    name: 'Coder - Code Writer',
    emoji: '💻',
    systemPrompt: `أنت مبرمج محترف. تخصصك:
- كتابة كود نظيف وفعال
- توليد الكود من الوصف
- شرح الكود بطريقة واضحة
- تحسين الكود الموجود

أسلوبك: عملي، مباشر، يركز على التنفيذ.`,
  },
  
  reviewer: {
    name: 'Reviewer - Code Analyst',
    emoji: '👁️',
    systemPrompt: `أنت محلل كود خبير. تخصصك:
- مراجعة الكود بدقة
- اكتشاف المشاكل والـ Code Smells
- اقتراح تحسينات على الكود
- فحص Best Practices

أسلوبك: ناقد بناء، دقيق، يهتم بالجودة.`,
  },
  
  tester: {
    name: 'Tester - QA Expert',
    emoji: '🧪',
    systemPrompt: `أنت خبير اختبارات. تخصصك:
- توليد حالات الاختبار (Test Cases)
- كتابة Unit Tests و Integration Tests
- اكتشاف الـ Edge Cases
- تحليل تغطية الاختبارات

أسلوبك: شامل، يفكر في كل الاحتمالات، وقائي.`,
  },
  
  debugger: {
    name: 'Debugger - Problem Solver',
    emoji: '🐛',
    systemPrompt: `أنت محلل مشاكل خبير. تخصصك:
- تتبع الأخطاء وحلها
- تحليل Stack Traces
- اقتراح حلول للمشاكل
- Debug خطوة بخطوة

أسلوبك: تحليلي، منهجي، صبور.`,
  },
  
  optimizer: {
    name: 'Optimizer - Performance Guru',
    emoji: '⚡',
    systemPrompt: `أنت خبير تحسين الأداء. تخصصك:
- تحليل الأداء (Performance Analysis)
- تحسين السرعة والذاكرة
- اكتشاف Bottlenecks
- اقتراح تحسينات الأداء

أسلوبك: دقيق، يقيس بالأرقام، يركز على النتائج.`,
  },
  
  security: {
    name: 'Security - Security Expert',
    emoji: '🔐',
    systemPrompt: `أنت خبير أمن سيبراني. تخصصك:
- مراجعة أمنية للكود
- اكتشاف الثغرات (Vulnerabilities)
- اقتراح حلول أمنية
- Best Practices للأمان

أسلوبك: حذر، شامل، يفكر مثل المهاجم.`,
  },
  
  devops: {
    name: 'DevOps - Infrastructure Pro',
    emoji: '🔧',
    systemPrompt: `أنت خبير DevOps. تخصصك:
- إعداد CI/CD
- Docker و Kubernetes
- Cloud Infrastructure
- Deployment Strategies

أسلوبك: عملي، يهتم بالأتمتة، يفكر بالبنية التحتية.`,
  },
};

// ============================================
// Setup Handlers
// ============================================

export function setupAIHandlers() {
  
  // ============================================
  // 1. إرسال رسالة للـ AI
  // ============================================
  ipcMain.handle('ai:sendMessage', async (_, message: string, personality: string, model: string) => {
    try {
      const personalityConfig = PERSONALITIES[personality as keyof typeof PERSONALITIES];
      
      if (!personalityConfig) {
        throw new Error('Personality not found');
      }

      // استدعاء Claude API
      const response = await anthropic.messages.create({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: personalityConfig.systemPrompt,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '';

      return {
        success: true,
        message: text,
        personality: personalityConfig.name,
        emoji: personalityConfig.emoji,
        model: model,
      };
    } catch (error: any) {
      console.error('AI Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // ============================================
  // 2. إرسال رسالة مع Streaming
  // ============================================
  ipcMain.handle('ai:streamMessage', async (event, message: string, personality: string, model: string) => {
    try {
      const personalityConfig = PERSONALITIES[personality as keyof typeof PERSONALITIES];
      
      if (!personalityConfig) {
        throw new Error('Personality not found');
      }

      // استدعاء Claude API مع Streaming
      const stream = await anthropic.messages.stream({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: personalityConfig.systemPrompt,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      });

      let fullText = '';

      // إرسال chunks إلى الواجهة
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text;
          fullText += text;
          
          // إرسال chunk للواجهة
          event.sender.send('ai:chunk', text);
        }
      }

      // إرسال إشارة الانتهاء
      event.sender.send('ai:complete', {
        fullText: fullText,
        personality: personalityConfig.name,
        emoji: personalityConfig.emoji,
      });

      return {
        success: true,
        message: fullText,
      };
    } catch (error: any) {
      console.error('AI Streaming Error:', error);
      event.sender.send('ai:error', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // ============================================
  // 3. الحصول على قائمة الشخصيات
  // ============================================
  ipcMain.handle('ai:getPersonalities', async () => {
    return Object.entries(PERSONALITIES).map(([key, value]) => ({
      id: key,
      name: value.name,
      emoji: value.emoji,
    }));
  });

  // ============================================
  // 4. الحصول على النماذج المتاحة
  // ============================================
  ipcMain.handle('ai:getModels', async () => {
    return [
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4.5',
        description: 'الأذكى والأسرع',
      },
      {
        id: 'claude-opus-4-20250514',
        name: 'Claude Opus 4',
        description: 'الأقوى للمهام المعقدة',
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'نموذج سابق مستقر',
      },
    ];
  });

  // ============================================
  // 5. God Mode - استشارة جميع الشخصيات
  // ============================================
  ipcMain.handle('ai:godMode', async (_, message: string, model: string) => {
    const results: any[] = [];

    // استشارة كل شخصية
    for (const [key, personality] of Object.entries(PERSONALITIES)) {
      try {
        const response = await anthropic.messages.create({
          model: model || 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: personality.systemPrompt,
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
        });

        const content = response.content[0];
        const text = content.type === 'text' ? content.text : '';

        results.push({
          personality: personality.name,
          emoji: personality.emoji,
          response: text,
          id: key,
        });
      } catch (error: any) {
        console.error(`Error with ${key}:`, error);
        results.push({
          personality: personality.name,
          emoji: personality.emoji,
          response: `خطأ: ${error.message}`,
          id: key,
          error: true,
        });
      }
    }

    return {
      success: true,
      results: results,
    };
  });
}

// ============================================
// Helper: تحليل الكود
// ============================================
export async function analyzeCode(code: string, language: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `قم بتحليل هذا الكود في ${language}:\n\n${code}\n\nقدم تحليل شامل يشمل: المشاكل، التحسينات المقترحة، والأمان.`,
        },
      ],
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  } catch (error) {
    console.error('Code analysis error:', error);
    return 'خطأ في التحليل';
  }
}
