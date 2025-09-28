
export function safeMap<T, R>(
  array: T[] | null | undefined,
  callback: (item: T, index: number, array: T[]) => R
): R[] {
  if (!array || !Array.isArray(array)) return [];
  return array.map(callback);
}

export function safeFilter<T>(
  array: T[] | null | undefined,
  predicate: (item: T, index: number, array: T[]) => boolean
): T[] {
  if (!array || !Array.isArray(array)) return [];
  return array.filter(predicate);
}

export function safeForEach<T>(
  array: T[] | null | undefined,
  callback: (item: T, index: number, array: T[]) => void
): void {
  if (!array || !Array.isArray(array)) return;
  array.forEach(callback);
}

export function safeFind<T>(
  array: T[] | null | undefined,
  predicate: (item: T, index: number, array: T[]) => boolean
): T | undefined {
  if (!array || !Array.isArray(array)) return undefined;
  return array.find(predicate);
}

export function safeReduce<T, R>(
  array: T[] | null | undefined,
  callback: (accumulator: R, currentValue: T, currentIndex: number, array: T[]) => R,
  initialValue: R
): R {
  if (!array || !Array.isArray(array)) return initialValue;
  return array.reduce(callback, initialValue);
}

export function safeLength(array: any[] | null | undefined): number {
  if (!array || !Array.isArray(array)) return 0;
  return array.length;
}

export function safeSlice<T>(
  array: T[] | null | undefined,
  start?: number,
  end?: number
): T[] {
  if (!array || !Array.isArray(array)) return [];
  return array.slice(start, end);
}

export function safeAccess<T>(
  obj: Record<string, any> | null | undefined,
  path: string,
  defaultValue?: T
): T | undefined {
  if (!obj || typeof obj !== 'object') return defaultValue;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current?.[key] === undefined || current?.[key] === null) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current as T;
}

export function safeString(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return String(value);
}

export function safeNumber(value: any, defaultValue = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}