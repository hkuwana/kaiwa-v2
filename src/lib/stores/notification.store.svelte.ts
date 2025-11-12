// 🌟 Notification Store
// Manages toast notifications with auto-dismiss and type variants
// Uses DaisyUI toast for styling and animations

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
	label: string;
	callback: () => void;
}

export interface Toast {
	id: string;
	message: string;
	type: NotificationType;
	duration?: number; // in ms, undefined = no auto-dismiss
	action?: ToastAction; // Single action (default)
	actions?: ToastAction[]; // Multiple actions (toolbar style)
	isToolbar?: boolean; // Display as toolbar with multiple buttons
}

let toastIdCounter = 0;

/**
 * NotificationStore - Manages toast notifications
 * Usage:
 *   notificationStore.success('Operation completed!')
 *   notificationStore.error('Something went wrong', 5000)
 *   notificationStore.addToast({ message: 'Custom...', type: 'info' })
 */
export class NotificationStore {
	// List of active toasts
	toasts = $state<Toast[]>([]);

	/**
	 * Add a toast notification
	 */
	addToast(toast: Omit<Toast, 'id'>): string {
		const id = `toast-${++toastIdCounter}`;
		const newToast: Toast = {
			...toast,
			id,
			duration: toast.duration ?? 3000 // Default 3s auto-dismiss
		};

		this.toasts.push(newToast);

		// Auto-dismiss if duration is set
		if (newToast.duration && newToast.duration > 0) {
			setTimeout(() => {
				this.removeToast(id);
			}, newToast.duration);
		}

		return id;
	}

	/**
	 * Remove a toast by ID
	 */
	removeToast(id: string): void {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	/**
	 * Success notification (green, auto-dismisses)
	 */
	success(message: string, duration = 3000): string {
		return this.addToast({
			message,
			type: 'success',
			duration
		});
	}

	/**
	 * Error notification (red, stays longer)
	 */
	error(message: string, duration = 5000): string {
		return this.addToast({
			message,
			type: 'error',
			duration
		});
	}

	/**
	 * Warning notification (yellow, auto-dismisses)
	 */
	warning(message: string, duration = 4000): string {
		return this.addToast({
			message,
			type: 'warning',
			duration
		});
	}

	/**
	 * Info notification (blue, auto-dismisses)
	 */
	info(message: string, duration = 3000): string {
		return this.addToast({
			message,
			type: 'info',
			duration
		});
	}

	/**
	 * Feedback toolbar notification (multiple action buttons)
	 * Perfect for confirmation dialogs or multi-action feedback
	 */
	toolbar(message: string, actions: ToastAction[], duration = 0): string {
		return this.addToast({
			message,
			type: 'info',
			duration,
			actions,
			isToolbar: true
		});
	}

	/**
	 * Clear all toasts
	 */
	clearAll(): void {
		this.toasts = [];
	}
}

// Export singleton instance
export const notificationStore = new NotificationStore();
