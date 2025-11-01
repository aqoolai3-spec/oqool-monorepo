// src/hooks/useFileSystem.ts
import { useState, useCallback } from 'react';

interface OpenedFile {
  path: string | null;
  name: string;
  content: string;
  isModified: boolean;
  isNew: boolean;
}

export function useFileSystem() {
  const [currentFile, setCurrentFile] = useState<OpenedFile | null>(null);
  const [openFiles, setOpenFiles] = useState<OpenedFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderFiles, setFolderFiles] = useState<any[]>([]);

  // ============================================
  // 1. فتح ملف
  // ============================================
  const openFile = useCallback(async () => {
    try {
      const result = await window.electron.fs.openFile();
      
      if (result) {
        const file: OpenedFile = {
          path: result.path,
          name: result.name,
          content: result.content,
          isModified: false,
          isNew: false,
        };

        setCurrentFile(file);
        
        // إضافة للملفات المفتوحة إذا لم يكن موجوداً
        setOpenFiles(prev => {
          const exists = prev.some(f => f.path === file.path);
          if (!exists) {
            return [...prev, file];
          }
          return prev;
        });

        return file;
      }
    } catch (error) {
      console.error('Error opening file:', error);
      return null;
    }
  }, []);

  // ============================================
  // 2. فتح مجلد
  // ============================================
  const openFolder = useCallback(async () => {
    try {
      const result = await window.electron.fs.openFolder();
      
      if (result) {
        setCurrentFolder(result.path);
        setFolderFiles(result.files);
        return result;
      }
    } catch (error) {
      console.error('Error opening folder:', error);
      return null;
    }
  }, []);

  // ============================================
  // 3. حفظ ملف
  // ============================================
  const saveFile = useCallback(async () => {
    if (!currentFile) return false;

    try {
      // إذا كان ملف جديد، استخدم Save As
      if (currentFile.isNew || !currentFile.path) {
        return await saveFileAs();
      }

      const result = await window.electron.fs.saveFile(
        currentFile.path,
        currentFile.content
      );

      if (result.success) {
        setCurrentFile(prev => prev ? { ...prev, isModified: false } : null);
        
        // تحديث في قائمة الملفات المفتوحة
        setOpenFiles(prev =>
          prev.map(f => f.path === currentFile.path ? { ...f, isModified: false } : f)
        );
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error saving file:', error);
      return false;
    }
  }, [currentFile]);

  // ============================================
  // 4. حفظ باسم
  // ============================================
  const saveFileAs = useCallback(async () => {
    if (!currentFile) return false;

    try {
      const result = await window.electron.fs.saveFileAs(
        currentFile.name,
        currentFile.content
      );

      if (result && result.success) {
        const updatedFile: OpenedFile = {
          path: result.path,
          name: result.name,
          content: currentFile.content,
          isModified: false,
          isNew: false,
        };

        setCurrentFile(updatedFile);
        
        // تحديث أو إضافة في قائمة الملفات
        setOpenFiles(prev => {
          const index = prev.findIndex(f => f.path === currentFile.path);
          if (index >= 0) {
            const newFiles = [...prev];
            newFiles[index] = updatedFile;
            return newFiles;
          }
          return [...prev, updatedFile];
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error saving file as:', error);
      return false;
    }
  }, [currentFile]);

  // ============================================
  // 5. ملف جديد
  // ============================================
  const newFile = useCallback(async () => {
    try {
      const result = await window.electron.fs.newFile();
      
      if (result) {
        const file: OpenedFile = {
          path: null,
          name: result.name,
          content: result.content,
          isModified: false,
          isNew: true,
        };

        setCurrentFile(file);
        setOpenFiles(prev => [...prev, file]);
        
        return file;
      }
    } catch (error) {
      console.error('Error creating new file:', error);
      return null;
    }
  }, []);

  // ============================================
  // 6. إغلاق ملف
  // ============================================
  const closeFile = useCallback((filePath: string | null) => {
    setOpenFiles(prev => prev.filter(f => f.path !== filePath));
    
    // إذا كان الملف المغلق هو الملف الحالي
    if (currentFile?.path === filePath) {
      // فتح الملف التالي أو null
      setOpenFiles(prev => {
        if (prev.length > 0) {
          setCurrentFile(prev[0]);
        } else {
          setCurrentFile(null);
        }
        return prev;
      });
    }
  }, [currentFile]);

  // ============================================
  // 7. تحديث محتوى الملف
  // ============================================
  const updateContent = useCallback((content: string) => {
    setCurrentFile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        content: content,
        isModified: true,
      };
    });

    // تحديث في قائمة الملفات
    if (currentFile) {
      setOpenFiles(prev =>
        prev.map(f =>
          f.path === currentFile.path
            ? { ...f, content: content, isModified: true }
            : f
        )
      );
    }
  }, [currentFile]);

  // ============================================
  // 8. التبديل بين الملفات
  // ============================================
  const switchToFile = useCallback((filePath: string | null) => {
    const file = openFiles.find(f => f.path === filePath);
    if (file) {
      setCurrentFile(file);
    }
  }, [openFiles]);

  // ============================================
  // 9. قراءة ملف من المسار
  // ============================================
  const readFile = useCallback(async (filePath: string) => {
    try {
      const result = await window.electron.fs.readFile(filePath);
      
      if (result.success) {
        return result.content;
      }
      
      return null;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }, []);

  // ============================================
  // 10. حذف ملف
  // ============================================
  const deleteFile = useCallback(async (filePath: string) => {
    try {
      const result = await window.electron.fs.deleteFile(filePath);
      
      if (result.success) {
        // إزالة من الملفات المفتوحة
        closeFile(filePath);
        
        // تحديث قائمة المجلد
        if (currentFolder) {
          const files = await window.electron.fs.readDirectory(currentFolder);
          setFolderFiles(files);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }, [currentFolder, closeFile]);

  return {
    // State
    currentFile,
    openFiles,
    currentFolder,
    folderFiles,
    
    // Actions
    openFile,
    openFolder,
    saveFile,
    saveFileAs,
    newFile,
    closeFile,
    updateContent,
    switchToFile,
    readFile,
    deleteFile,
  };
}
