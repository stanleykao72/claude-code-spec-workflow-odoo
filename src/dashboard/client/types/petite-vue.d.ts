/**
 * Type definitions for petite-vue
 * Based on petite-vue v0.4.1 usage patterns in the dashboard
 */

/**
 * Reactive application instance with component data and methods
 */
interface PetiteVueApp {
  mount(_selector: string): this;
}

/**
 * Component data object with reactive properties and methods
 */
interface PetiteVueComponentData {
  [key: string]: unknown;
}

/**
 * Global PetiteVue object available in browser
 */
declare const PetiteVue: {
  createApp: (_data: PetiteVueComponentData) => PetiteVueApp;
};

/**
 * Reactive property type helpers for petite-vue components
 */

/**
 * Type for reactive state properties that can be safely used in petite-vue templates
 * Excludes complex objects that may cause reactivity issues
 */
export type ReactiveProperty<T> = T extends Function 
  ? T 
  : T extends Map<unknown, unknown> | WeakMap<object, unknown> | Set<unknown> | WeakSet<object>
  ? never  // Maps and Sets should be stored outside reactive system
  : T extends Array<infer U>
    ? Array<ReactiveProperty<U>>  // Arrays are supported
    : T extends object
    ? { [K in keyof T]: ReactiveProperty<T[K]> }  // Plain objects are supported
  : T;  // Primitives are always supported

/**
 * Type assertion helper for reactive state
 * Use this when you need to ensure a property is reactive-safe
 */
export declare function asReactive<T>(value: T): ReactiveProperty<T>;

/**
 * Cache type for values that should be stored outside the reactive system
 * Use for Maps, complex computed values, or frequently changing data
 */
export interface NonReactiveCache<T = unknown> {
  readonly [key: string]: T;
}

/**
 * Helper for creating cache objects outside petite-vue's reactive system
 * Use this pattern for Maps, Sets, or other data that causes reactivity issues
 */
export declare function createCache<T>(): Map<string, T>;

/**
 * Type patterns for common dashboard reactive state
 */

/**
 * Reactive boolean state (commonly used for UI toggles)
 */
export type ReactiveBoolean = boolean;

/**
 * Reactive string state (commonly used for selections, themes, etc.)
 */
export type ReactiveString = string;

/**
 * Reactive array state (commonly used for lists)
 */
export type ReactiveArray<T> = Array<ReactiveProperty<T>>;

/**
 * Reactive record/object state (commonly used for key-value stores)
 */
export type ReactiveRecord<T> = Record<string, ReactiveProperty<T>>;

/**
 * Event handler type for template event listeners (@click, @change, etc.)
 */
export type EventHandler<E extends globalThis.Event = globalThis.Event> = (_event: E) => void | Promise<void>;

/**
 * Type assertion patterns for reactive state
 * 
 * Usage examples:
 * 
 * // ✅ Good - Simple reactive properties
 * const state = {
 *   theme: 'dark' as ReactiveString,
 *   projects: [] as ReactiveArray<Project>,
 *   expanded: {} as ReactiveRecord<boolean>
 * };
 * 
 * // ❌ Bad - Complex objects that cause reactivity issues
 * const state = {
 *   projectColors: new Map() // Store outside reactive system instead
 * };
 * 
 * // ✅ Good - Store complex objects outside reactive system
 * const projectColorCache = createCache<ColorScheme>();
 * const state = {
 *   // Access cache through methods, not reactive properties
 *   getProjectColor(path: string) {
 *     return projectColorCache.get(path) || defaultColor;
 *   }
 * };
 */

// Types are already exported above with individual export declarations