function readFromLocalStorage(key: string): unknown | null {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : null;
}

export default readFromLocalStorage;
