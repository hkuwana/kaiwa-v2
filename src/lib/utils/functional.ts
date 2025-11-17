/**
 * Functional Programming Utilities for Event-Driven Architecture
 *
 * Core Principles:
 * 1. Pure Functions - No side effects, predictable outputs
 * 2. Immutability - Never mutate data
 * 3. Function Composition - Build complex from simple
 * 4. Higher-Order Functions - Functions as first-class citizens
 * 5. Error Handling - Use Result/Either types for safe operations
 */

// ============================================================================
// Result Type for Safe Error Handling
// ============================================================================

export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * Create a successful result
 * @param data - The data to include in the result
 * @returns A successful result with the provided data
 */
export const Ok = <T>(data: T): Result<T, never> => ({ success: true, data });

/**
 * Create a failed result
 * @param error - The error to include in the result
 * @returns A failed result with the provided error
 */
export const Err = <E>(error: E): Result<never, E> => ({ success: false, error });

// Result utilities

export const mapResult = <T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> =>
	result.success ? Ok(fn(result.data)) : result;

export const flatMapResult = <T, U, E>(
	result: Result<T, E>,
	fn: (data: T) => Result<U, E>
): Result<U, E> => (result.success ? fn(result.data) : result);

export const withDefault =
	<T>(defaultValue: T) =>
	(result: Result<T, unknown>): T =>
		result.success ? result.data : defaultValue;

// ============================================================================
// Event System Functional Utilities
// ============================================================================

export type EventHandler<T = unknown> = (payload: T) => void;
export type EventPredicate<T = unknown> = (payload: T) => boolean;
export type EventTransformer<T, U> = (payload: T) => U;

/**
 * Pure function to create event payload
 */
export const createEventPayload = <T>(
	type: string,
	data: T,
	metadata: Record<string, unknown> = {}
) => ({
	type,
	payload: data,
	timestamp: Date.now(),
	metadata: { ...metadata }
});

/**
 * Higher-order function to create event handlers with error boundaries
 */
export const safeEventHandler =
	<T>(handler: EventHandler<T>, onError?: (error: Error) => void): EventHandler<T> =>
	(payload: T) => {
		try {
			handler(payload);
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			if (onError) {
				onError(err);
			} else {
				console.error('Event handler error:', err);
			}
		}
	};

/**
 * Function composition for event handlers
 */
export const composeEventHandlers =
	<T>(...handlers: EventHandler<T>[]): EventHandler<T> =>
	(payload: T) => {
		handlers.forEach((handler) => handler(payload));
	};

/**
 * Conditional event handler - only execute if predicate is true
 */
export const conditionalEventHandler =
	<T>(predicate: EventPredicate<T>, handler: EventHandler<T>): EventHandler<T> =>
	(payload: T) => {
		if (predicate(payload)) {
			handler(payload);
		}
	};

/**
 * Transform event payload before handling
 */
export const transformEventHandler =
	<T, U>(transformer: EventTransformer<T, U>, handler: EventHandler<U>): EventHandler<T> =>
	(payload: T) => {
		const transformed = transformer(payload);
		handler(transformed);
	};

// ============================================================================
// State Management Functional Utilities
// ============================================================================

/**
 * Pure state updater - returns new state without mutation
 */
export type StateUpdater<T> = (currentState: T) => T;

/**
 * Immutable state update utility
 */
export const updateState = <T>(currentState: T, updater: StateUpdater<T>): T => {
	// Deep clone to ensure immutability
	const cloned = structuredClone(currentState);
	return updater(cloned);
};

/**
 * Compose multiple state updaters
 */
export const composeStateUpdaters =
	<T>(...updaters: StateUpdater<T>[]): StateUpdater<T> =>
	(state: T) =>
		updaters.reduce((acc, updater) => updater(acc), state);

/**
 * Conditional state updater
 */
export const conditionalStateUpdate =
	<T>(condition: (state: T) => boolean, updater: StateUpdater<T>): StateUpdater<T> =>
	(state: T) =>
		condition(state) ? updater(state) : state;

// ============================================================================
// Service Communication Functional Utilities
// ============================================================================

/**
 * Higher-order function for service method decoration
 */
export const withServiceLogging =
	<TArgs extends unknown[], TReturn>(
		serviceName: string,
		methodName: string,
		fn: (...args: TArgs) => TReturn
	) =>
	(...args: TArgs): TReturn => {
		console.debug(`[${serviceName}] ${methodName}:`, { args });
		const result = fn(...args);
		console.debug(`[${serviceName}] ${methodName} result:`, result);
		return result;
	};

/**
 * Pure function for async service calls with error handling
 */
export const safeAsyncServiceCall = async <T>(
	operation: () => Promise<T>,
	context: string
): Promise<Result<T, Error>> => {
	try {
		const data = await operation();
		return Ok(data);
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		console.error(`${context} failed:`, err);
		return Err(err);
	}
};

// ============================================================================
// Data Transformation Functional Utilities
// ============================================================================

/**
 * Pure function to transform arrays without mutation
 */
export const transformArray = <T, U>(
	array: readonly T[],
	transformer: (item: T, index: number) => U
): U[] => array.map(transformer);

/**
 * Pure function to filter arrays with predicate
 */
export const filterArray = <T>(
	array: readonly T[],
	predicate: (item: T, index: number) => boolean
): T[] => array.filter(predicate);

/**
 * Pure function to reduce arrays
 */
export const reduceArray = <T, U>(
	array: readonly T[],
	reducer: (acc: U, item: T, index: number) => U,
	initialValue: U
): U => array.reduce(reducer, initialValue);

/**
 * Pipe function for data transformation
 */
export const pipe =
	<T>(...fns: Array<(arg: T) => T>) =>
	(value: T): T =>
		fns.reduce((acc, fn) => fn(acc), value);

/**
 * Compose function (right to left)
 */
export const compose =
	<T>(...fns: Array<(arg: T) => T>) =>
	(value: T): T =>
		fns.reduceRight((acc, fn) => fn(acc), value);

// ============================================================================
// Event-Driven Service Communication
// ============================================================================

/**
 * Pure function to create cross-feature service requests
 */
export const createServiceRequest = <T>(targetFeature: string, action: string, payload: T) =>
	createEventPayload(`${targetFeature.toUpperCase()}_REQUEST`, {
		action,
		payload,
		requestId: crypto.randomUUID()
	});

/**
 * Pure function to create service responses
 */
export const createServiceResponse = <T>(
	sourceFeature: string,
	requestId: string,
	result: Result<T, Error>
) =>
	createEventPayload(`${sourceFeature.toUpperCase()}_RESPONSE`, {
		requestId,
		result
	});

/**
 * Higher-order function to create request-response handlers
 */
export const createRequestResponseHandler =
	<TRequest, TResponse>(handler: (request: TRequest) => Promise<Result<TResponse, Error>>) =>
	async (event: { payload: { requestId: string; payload: TRequest } }) => {
		const { requestId, payload } = event.payload;
		const result = await handler(payload);
		return { requestId, result };
	};

export default {
	// Result types
	Ok,
	Err,
	mapResult,
	flatMapResult,
	withDefault,

	// Event utilities
	createEventPayload,
	safeEventHandler,
	composeEventHandlers,
	conditionalEventHandler,
	transformEventHandler,

	// State utilities
	updateState,
	composeStateUpdaters,
	conditionalStateUpdate,

	// Service utilities
	withServiceLogging,
	safeAsyncServiceCall,

	// Data transformation
	transformArray,
	filterArray,
	reduceArray,
	pipe,
	compose,

	// Service communication
	createServiceRequest,
	createServiceResponse,
	createRequestResponseHandler
};
