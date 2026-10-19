export function writeToLocalStorage(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}
