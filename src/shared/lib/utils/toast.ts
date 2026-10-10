type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

class Toast {
  private createToastElement(message: string, type: ToastType): HTMLDivElement {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Add styling
    const styles = {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '9999',
      animation: 'slideIn 0.3s ease-out',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    };

    const typeStyles: Record<ToastType, { backgroundColor: string }> = {
      success: { backgroundColor: '#10b981' },
      error: { backgroundColor: '#ef4444' },
      info: { backgroundColor: '#3b82f6' },
      warning: { backgroundColor: '#f59e0b' },
    };

    Object.assign(toast.style, styles, typeStyles[type]);

    return toast;
  }

  private show(message: string, type: ToastType, options?: ToastOptions) {
    const duration = options?.duration ?? 3000;
    const toast = this.createToastElement(message, type);

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, duration);
  }

  success(message: string, options?: ToastOptions) {
    this.show(message, 'success', options);
  }

  error(message: string, options?: ToastOptions) {
    this.show(message, 'error', options);
  }

  info(message: string, options?: ToastOptions) {
    this.show(message, 'info', options);
  }

  warning(message: string, options?: ToastOptions) {
    this.show(message, 'warning', options);
  }
}

// Add CSS animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    .fade-out {
      animation: fadeOut 0.5s ease-in forwards;
    }
    @keyframes fadeOut {
      from {
        opacity: 1;
        transform: translateX(-50%);
      }
      to {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
      }
    }
  `;
  document.head.appendChild(style);
}

export const toast = new Toast();

// Export individual functions for direct use
export function showToast(message: string, type: ToastType = 'info', duration: number = 3000) {
  const toastElement = document.createElement('div');
  toastElement.className = 'toast';
  toastElement.classList.add(`toast-${type}`);
  toastElement.textContent = message;

  // Apply base styles
  Object.assign(toastElement.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 20px',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '9999',
    animation: 'slideIn 0.3s ease-out',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  });

  // Apply type-specific styles
  const typeStyles: Record<ToastType, { backgroundColor: string }> = {
    success: { backgroundColor: '#10b981' },
    error: { backgroundColor: '#ef4444' },
    info: { backgroundColor: '#3b82f6' },
    warning: { backgroundColor: '#f59e0b' },
  };

  Object.assign(toastElement.style, typeStyles[type]);

  document.body.appendChild(toastElement);

  // Auto-remove with fade-out animation
  setTimeout(() => {
    toastElement.classList.add('fade-out');
    setTimeout(() => {
      toastElement.remove();
    }, 500);
  }, duration - 500);
}

export function showSuccessToast(message: string, duration: number = 3000) {
  showToast(message, 'success', duration);
}

export function showErrorToast(message: string, duration: number = 5000) {
  showToast(message, 'error', duration);
}

export function showWarningToast(message: string, duration: number = 4000) {
  showToast(message, 'warning', duration);
}
