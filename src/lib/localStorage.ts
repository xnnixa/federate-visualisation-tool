export function setLocalStorage(key: string, value: unknown) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving to localStorage', error);
    }
}

export function getLocalStorage(key: string) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : undefined;
    } catch (error) {
        console.error('Error reading from localStorage', error);
    }
}