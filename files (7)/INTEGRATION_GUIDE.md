# 🔗 دليل ربط الوظائف - Oqool Desktop IDE

## 📦 **الملفات المطلوبة:**

```
project/
├── electron/
│   ├── main.ts                  ← تحديث
│   ├── preload.ts               ← استبدال
│   └── ipc/
│       ├── file-system.ts       ← إضافة
│       └── ai.ts                ← إضافة
│
└── src/
    ├── hooks/
    │   ├── useFileSystem.ts     ← إضافة
    │   └── useAI.ts             ← إضافة
    └── App.tsx                  ← تحديث
```

---

## 🚀 **الخطوة 1: تثبيت المكتبات المطلوبة**

```bash
# في مجلد المشروع
cd /path/to/oqool-desktop

# تثبيت Anthropic SDK
npm install @anthropic-ai/sdk

# تثبيت أنواع Node.js
npm install --save-dev @types/node
```

---

## 🔧 **الخطوة 2: إضافة الملفات**

### **2.1 ملف `electron/ipc/file-system.ts`**
- انسخ المحتوى من `file-system.ts`
- ضعه في `electron/ipc/file-system.ts`

### **2.2 ملف `electron/ipc/ai.ts`**
- انسخ المحتوى من `ai.ts`
- ضعه في `electron/ipc/ai.ts`

### **2.3 ملف `electron/preload.ts`**
- **استبدل** الملف الحالي بالملف الجديد
- هذا يعرّف واجهات الـ API

### **2.4 ملفات Hooks**
- `src/hooks/useFileSystem.ts` ← إضافة
- `src/hooks/useAI.ts` ← إضافة

---

## ⚙️ **الخطوة 3: تحديث `electron/main.ts`**

أضف استيراد الـ handlers:

```typescript
// electron/main.ts
import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';

// ← أضف هذي السطرين
import { setupFileSystemHandlers } from './ipc/file-system';
import { setupAIHandlers } from './ipc/ai';

// إخفاء القائمة
Menu.setApplicationMenu(null);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load app
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5174');
  }
}

// ← أضف هذا قبل app.whenReady()
app.whenReady().then(() => {
  // ← تفعيل الـ handlers
  setupFileSystemHandlers();
  setupAIHandlers();
  
  createWindow();
});

// ... باقي الكود
```

---

## 🔐 **الخطوة 4: إعداد Claude API Key**

### **الطريقة 1: ملف `.env`**

```bash
# في جذر المشروع
touch .env

# أضف المفتاح
echo "ANTHROPIC_API_KEY=your-api-key-here" >> .env
```

### **الطريقة 2: متغير بيئة**

```bash
# Linux/Mac
export ANTHROPIC_API_KEY="your-api-key-here"

# Windows
set ANTHROPIC_API_KEY=your-api-key-here
```

### **الطريقة 3: في الكود مباشرة (للتطوير فقط)**

```typescript
// في electron/ipc/ai.ts
const anthropic = new Anthropic({
  apiKey: 'your-api-key-here', // ⚠️ لا تنشر هذا!
});
```

---

## 📝 **الخطوة 5: استخدام الـ Hooks في React**

### **مثال: استخدام نظام الملفات**

```tsx
// src/App.tsx
import { useFileSystem } from './hooks/useFileSystem';

function App() {
  const {
    currentFile,
    openFiles,
    openFile,
    saveFile,
    newFile,
    updateContent,
  } = useFileSystem();

  const handleOpenFile = async () => {
    await openFile();
  };

  const handleSaveFile = async () => {
    await saveFile();
  };

  const handleNewFile = async () => {
    await newFile();
  };

  return (
    <div>
      <button onClick={handleOpenFile}>فتح ملف</button>
      <button onClick={handleSaveFile}>حفظ</button>
      <button onClick={handleNewFile}>ملف جديد</button>
      
      {currentFile && (
        <textarea
          value={currentFile.content}
          onChange={(e) => updateContent(e.target.value)}
        />
      )}
    </div>
  );
}
```

### **مثال: استخدام AI**

```tsx
// src/components/ChatPanel.tsx
import { useState } from 'react';
import { useAI } from '../hooks/useAI';

function ChatPanel() {
  const [input, setInput] = useState('');
  const {
    messages,
    isLoading,
    currentPersonality,
    personalities,
    sendMessage,
    changePersonality,
  } = useAI();

  const handleSend = async () => {
    if (input.trim()) {
      await sendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="chat-panel">
      {/* اختيار الشخصية */}
      <select
        value={currentPersonality}
        onChange={(e) => changePersonality(e.target.value)}
      >
        {personalities.map(p => (
          <option key={p.id} value={p.id}>
            {p.emoji} {p.name}
          </option>
        ))}
      </select>

      {/* الرسائل */}
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.emoji && <span>{msg.emoji}</span>}
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      {/* الإدخال */}
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading}>
          {isLoading ? 'جاري الإرسال...' : 'إرسال'}
        </button>
      </div>
    </div>
  );
}
```

---

## 🧪 **الخطوة 6: الاختبار**

### **6.1 اختبار نظام الملفات:**

```typescript
// في Console أو Component
const testFileSystem = async () => {
  // فتح ملف
  const file = await window.electron.fs.openFile();
  console.log('Opened file:', file);

  // حفظ ملف
  const saved = await window.electron.fs.saveFile('/path/to/file.txt', 'Hello World');
  console.log('Saved:', saved);
};
```

### **6.2 اختبار AI:**

```typescript
// في Console أو Component
const testAI = async () => {
  // إرسال رسالة
  const response = await window.electron.ai.sendMessage(
    'اكتب دالة JavaScript لعكس نص',
    'coder',
    'claude-sonnet-4-20250514'
  );
  console.log('AI Response:', response);
};
```

---

## ⚠️ **الأخطاء الشائعة:**

### **1. `window.electron is undefined`**

**السبب:** preload.ts لم يُحمل صحيح

**الحل:**
```typescript
// في electron/main.ts
webPreferences: {
  preload: path.join(__dirname, 'preload.js'), // تأكد من المسار
  contextIsolation: true,
}
```

### **2. `API Key not found`**

**السبب:** مفتاح Claude API غير موجود

**الحل:**
```bash
# أضف المفتاح في .env
ANTHROPIC_API_KEY=your-key-here
```

### **3. `Cannot find module '@anthropic-ai/sdk'`**

**السبب:** المكتبة غير مثبتة

**الحل:**
```bash
npm install @anthropic-ai/sdk
```

### **4. `IPC handler not found`**

**السبب:** الـ handlers لم تُفعّل

**الحل:**
```typescript
// في main.ts
app.whenReady().then(() => {
  setupFileSystemHandlers(); // ← تأكد من هذا
  setupAIHandlers();         // ← وهذا
  createWindow();
});
```

---

## 📋 **Checklist:**

- [ ] تثبيت `@anthropic-ai/sdk`
- [ ] إضافة `file-system.ts`
- [ ] إضافة `ai.ts`
- [ ] استبدال `preload.ts`
- [ ] تحديث `main.ts`
- [ ] إضافة `useFileSystem.ts`
- [ ] إضافة `useAI.ts`
- [ ] إضافة `ANTHROPIC_API_KEY`
- [ ] اختبار فتح ملف
- [ ] اختبار حفظ ملف
- [ ] اختبار AI Chat
- [ ] اختبار الشخصيات الـ8

---

## 🎯 **الخطوات التالية:**

### **بعد الربط الناجح:**

1. ✅ **ربط TopBar Menu** - ربط الأزرار بالوظائف
2. ✅ **ربط Explorer** - فتح الملفات من الشجرة
3. ✅ **ربط Monaco Editor** - حفظ التغييرات
4. ✅ **تحسين AI Panel** - إضافة الميزات المتقدمة
5. ✅ **Keyboard Shortcuts** - ربط الاختصارات

---

## 🆘 **المساعدة:**

**إذا واجهت مشكلة:**

1. **تحقق من Console:**
```javascript
// في DevTools
console.log(window.electron); // يجب يطلع الـ APIs
```

2. **تحقق من الأخطاء:**
```bash
# في Terminal
npm run dev
# شوف الأخطاء
```

3. **اختبر الاتصال:**
```typescript
// في React Component
useEffect(() => {
  if (window.electron) {
    console.log('✅ Electron APIs loaded');
  } else {
    console.error('❌ Electron APIs not found');
  }
}, []);
```

---

**جاهز للبدء؟** 🚀
**ابدأ بالخطوة 1 وكمل خطوة بخطوة!**
