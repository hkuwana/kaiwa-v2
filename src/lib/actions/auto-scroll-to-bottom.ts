interface AutoScrollOptions {
	enabled?: boolean;
	behavior?: ScrollBehavior;
	delayMs?: number;
	trigger?: unknown;
	offset?: number;
}

type ResolvedOptions = Required<Omit<AutoScrollOptions, 'trigger'>> & { trigger?: unknown };

const defaultOptions: Required<Omit<AutoScrollOptions, 'trigger'>> = {
	enabled: true,
	behavior: 'smooth',
	delayMs: 0,
	offset: 0
};

function resolveOptions(options: AutoScrollOptions): ResolvedOptions {
	return {
		enabled: options.enabled ?? defaultOptions.enabled,
		behavior: options.behavior ?? defaultOptions.behavior,
		delayMs: options.delayMs ?? defaultOptions.delayMs,
		offset: options.offset ?? defaultOptions.offset,
		trigger: options.trigger
	};
}

export function autoScrollToBottom(node: HTMLElement, options: AutoScrollOptions = {}) {
	let current: ResolvedOptions = resolveOptions(options);
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	function clearTimer() {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = undefined;
		}
	}

	function scroll() {
		clearTimer();

		if (!current.enabled) {
			return;
		}

		const performScroll = () => {
			const targetTop = node.scrollHeight - (current.offset ?? 0);
			node.scrollTo({
				top: targetTop,
				behavior: current.behavior
			});
		};

		if (current.delayMs > 0) {
			timeoutId = setTimeout(performScroll, current.delayMs);
		} else {
			performScroll();
		}
	}

	scroll();

	return {
		update(newOptions: AutoScrollOptions = {}) {
			const next = resolveOptions(newOptions);

			const needsScroll =
				next.enabled !== current.enabled ||
				next.delayMs !== current.delayMs ||
				next.behavior !== current.behavior ||
				next.offset !== current.offset ||
				next.trigger !== current.trigger;

			current = next;

			if (needsScroll) {
				scroll();
			}
		},
		destroy() {
			clearTimer();
		}
	};
}
