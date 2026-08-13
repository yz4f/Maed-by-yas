export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

type ToastListener = (toast: ToastItem) => void;

class ToastManager {
  private listeners: ToastListener[] = [];
  private recentMessages: Map<string, number> = new Map();

  subscribe(listener: ToastListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  show(options: ToastOptions | string) {
    const opts: ToastOptions = typeof options === 'string' ? { message: options, type: 'success' } : options;
    const message = opts.message;
    const type = opts.type || 'success';
    const duration = opts.duration || 3500;
    const now = Date.now();
    const lastTime = this.recentMessages.get(message);
    
    // Prevent double clicking / duplicate toast within 1.5 seconds
    if (lastTime && now - lastTime < 1500) {
      return;
    }
    
    this.recentMessages.set(message, now);

    const toastItem: ToastItem = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
      duration
    };

    this.listeners.forEach((listener) => listener(toastItem));
  }

  success(message: string, duration?: number) {
    this.show({ message, type: 'success', duration });
  }

  error(message: string, duration?: number) {
    this.show({ message, type: 'error', duration });
  }

  warning(message: string, duration?: number) {
    this.show({ message, type: 'warning', duration });
  }

  info(message: string, duration?: number) {
    this.show({ message, type: 'info', duration });
  }
}

export const toast = new ToastManager();

export const showToast = (options: ToastOptions | string) => {
  toast.show(options);
};
