/**
 * 存储工具类
 * 自动检测并使用 AndroidFileStorage（如果可用），否则降级到 localStorage
 */

// 声明 AndroidFileStorage 接口类型
interface AndroidFileStorageInterface {
  writeFile: (key: string, data: string) => string;
  readFile: (key: string) => string;
  deleteFile: (key: string) => string;
  fileExists: (key: string) => string;
  listFiles: () => string;
  getFileSize: (key: string) => string;
  getStorageInfo: () => string;
}

// 声明全局类型（用于直接访问和 window 访问）
declare global {
  interface Window {
    AndroidFileStorage?: AndroidFileStorageInterface;
  }
  // 直接访问 AndroidFileStorage（通过 addJavascriptInterface 挂载到全局作用域）
  const AndroidFileStorage: AndroidFileStorageInterface | undefined;
}

export interface StorageInfo {
  type: 'android' | 'localStorage';
  totalSize: number;
  fileCount: number;
  directory?: string;
  hasLimit: boolean;
  limitSize?: number;
}

class Storage {
  private useNative: boolean;
  private storageKey = 'chat_ai_chats';

  constructor() {
    // 检测 AndroidFileStorage 是否可用
    // 检查两种方式：直接访问和通过 window 访问
    if (typeof window !== 'undefined') {
      // 在浏览器环境中检查
      this.useNative = 
        (typeof (window as any).AndroidFileStorage !== 'undefined' && (window as any).AndroidFileStorage !== null) ||
        (typeof (globalThis as any).AndroidFileStorage !== 'undefined' && (globalThis as any).AndroidFileStorage !== null);
    } else {
      this.useNative = false;
    }
    
    if (this.useNative) {
      console.log('✅ 使用 AndroidFileStorage 存储（无大小限制）');
    } else {
      console.log('⚠️ AndroidFileStorage 不可用，使用 localStorage（5MB 限制）');
    }
  }

  /**
   * 写入数据
   */
  async write(key: string, data: string): Promise<{ success: boolean; size?: number; error?: string }> {
    if (this.useNative && typeof window !== 'undefined') {
      try {
        // 尝试获取 AndroidFileStorage（可能通过直接访问或 window 访问）
        const storage = (window as any).AndroidFileStorage || (globalThis as any).AndroidFileStorage;
        
        if (!storage) {
          throw new Error('AndroidFileStorage not found');
        }
        
        const result = storage.writeFile(key, data);
        const response = JSON.parse(result);
        
        if (response.success) {
          return { success: true, size: response.size };
        } else {
          return { success: false, error: response.message };
        }
      } catch (error) {
        console.error('AndroidFileStorage write error:', error);
        // 降级到 localStorage
        this.useNative = false;
        return this.writeLocalStorage(key, data);
      }
    } else {
      return this.writeLocalStorage(key, data);
    }
  }

  /**
   * 读取数据
   */
  async read(key: string): Promise<string | null> {
    if (this.useNative && typeof window !== 'undefined') {
      try {
        const storage = (window as any).AndroidFileStorage || (globalThis as any).AndroidFileStorage;
        
        if (!storage) {
          throw new Error('AndroidFileStorage not found');
        }
        
        const result = storage.readFile(key);
        const response = JSON.parse(result);
        
        if (response.success) {
          return response.data || null;
        } else {
          // 文件不存在不算错误
          if (response.message && response.message.includes('不存在')) {
            return null;
          }
          console.error('AndroidFileStorage read error:', response.message);
          return null;
        }
      } catch (error) {
        console.error('AndroidFileStorage read error:', error);
        // 降级到 localStorage
        this.useNative = false;
        return this.readLocalStorage(key);
      }
    } else {
      return this.readLocalStorage(key);
    }
  }

  /**
   * 删除数据
   */
  async delete(key: string): Promise<boolean> {
    if (this.useNative && typeof window !== 'undefined') {
      try {
        const storage = (window as any).AndroidFileStorage || (globalThis as any).AndroidFileStorage;
        
        if (!storage) {
          throw new Error('AndroidFileStorage not found');
        }
        
        const result = storage.deleteFile(key);
        const response = JSON.parse(result);
        return response.success;
      } catch (error) {
        console.error('AndroidFileStorage delete error:', error);
        // 降级到 localStorage
        this.useNative = false;
        return this.deleteLocalStorage(key);
      }
    } else {
      return this.deleteLocalStorage(key);
    }
  }

  /**
   * 检查数据是否存在
   */
  async exists(key: string): Promise<boolean> {
    if (this.useNative && typeof window !== 'undefined') {
      try {
        const storage = (window as any).AndroidFileStorage || (globalThis as any).AndroidFileStorage;
        
        if (!storage) {
          throw new Error('AndroidFileStorage not found');
        }
        
        const result = storage.fileExists(key);
        const response = JSON.parse(result);
        return response.exists;
      } catch (error) {
        console.error('AndroidFileStorage exists error:', error);
        return this.existsLocalStorage(key);
      }
    } else {
      return this.existsLocalStorage(key);
    }
  }

  /**
   * 获取存储信息
   */
  async getStorageInfo(): Promise<StorageInfo> {
    if (this.useNative && typeof window !== 'undefined') {
      try {
        const storage = (window as any).AndroidFileStorage || (globalThis as any).AndroidFileStorage;
        
        if (!storage) {
          throw new Error('AndroidFileStorage not found');
        }
        
        const result = storage.getStorageInfo();
        const response = JSON.parse(result);
        
        return {
          type: 'android',
          totalSize: response.totalSize || 0,
          fileCount: response.fileCount || 0,
          directory: response.directory,
          hasLimit: false,
        };
      } catch (error) {
        console.error('AndroidFileStorage getStorageInfo error:', error);
        return this.getLocalStorageInfo();
      }
    } else {
      return this.getLocalStorageInfo();
    }
  }

  /**
   * 获取当前使用的存储类型
   */
  getStorageType(): 'android' | 'localStorage' {
    return this.useNative ? 'android' : 'localStorage';
  }

  // ========== localStorage 方法 ==========

  private writeLocalStorage(key: string, data: string): { success: boolean; size?: number; error?: string } {
    try {
      localStorage.setItem(key, data);
      return { success: true, size: new Blob([data]).size };
    } catch (e: any) {
      // localStorage 可能因为空间不足而失败
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        return { success: false, error: '存储空间不足（localStorage 限制约 5MB）' };
      }
      return { success: false, error: e.message || '写入失败' };
    }
  }

  private readLocalStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('localStorage read error:', e);
      return null;
    }
  }

  private deleteLocalStorage(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('localStorage delete error:', e);
      return false;
    }
  }

  private existsLocalStorage(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch (e) {
      return false;
    }
  }

  private getLocalStorageInfo(): StorageInfo {
    try {
      let totalSize = 0;
      let fileCount = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            // 估算大小：键名 + 值的长度（UTF-16，每个字符2字节）
            totalSize += (key.length + value.length) * 2;
            fileCount++;
          }
        }
      }

      return {
        type: 'localStorage',
        totalSize,
        fileCount,
        hasLimit: true,
        limitSize: 5 * 1024 * 1024, // 5MB
      };
    } catch (e) {
      return {
        type: 'localStorage',
        totalSize: 0,
        fileCount: 0,
        hasLimit: true,
        limitSize: 5 * 1024 * 1024,
      };
    }
  }
}

// 导出单例
export const storage = new Storage();

// 导出便捷方法
export const saveChats = async (chats: any[]) => {
  const data = JSON.stringify(chats);
  return await storage.write('chat_ai_chats', data);
};

export const loadChats = async (): Promise<any[] | null> => {
  const data = await storage.read('chat_ai_chats');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse chats', e);
    return null;
  }
};

