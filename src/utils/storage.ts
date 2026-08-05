import { AppData } from '../types';
import { INITIAL_APP_DATA } from '../data/initialData';
import { initialEventsData } from '../data/sampleEvents';

const STORAGE_KEY = 'luhacovice_ministranti_app_v1';

/**
 * Loads data from localStorage or falls back to default initial data
 */
export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const dataWithEvents = { ...INITIAL_APP_DATA, eventsData: initialEventsData };
      saveAppData(dataWithEvents);
      return dataWithEvents;
    }
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed || !parsed.masses || !parsed.ministrants || !parsed.config) {
      console.warn('Invalid storage payload, reinitializing with default data');
      const dataWithEvents = { ...INITIAL_APP_DATA, eventsData: initialEventsData };
      saveAppData(dataWithEvents);
      return dataWithEvents;
    }

    // Ensure forms and formResponses are initialized
    if (!Array.isArray(parsed.forms)) {
      parsed.forms = INITIAL_APP_DATA.forms || [];
    }
    if (!Array.isArray(parsed.formResponses)) {
      parsed.formResponses = INITIAL_APP_DATA.formResponses || [];
    }
    if (!parsed.eventsData || !Array.isArray(parsed.eventsData.events)) {
      parsed.eventsData = initialEventsData;
    }

    // Deduplicate any mass IDs to avoid key collisions
    const seenIds = new Set<string>();
    parsed.masses = parsed.masses.map((m, idx) => {
      let id = m.id;
      if (!id || seenIds.has(id)) {
        id = `mass-fix-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
      }
      seenIds.add(id);
      return { ...m, id };
    });

    return parsed;
  } catch (err) {
    console.error('Failed to read from localStorage:', err);
    return INITIAL_APP_DATA;
  }
}

/**
 * Saves app data to localStorage
 */
export function saveAppData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
    return false;
  }
}

/**
 * Resets local data to default template
 */
export function resetToDefaultData(): AppData {
  saveAppData(INITIAL_APP_DATA);
  return INITIAL_APP_DATA;
}

/**
 * Downloads a backup JSON file of the current state
 */
export function exportBackupJSON(data: AppData) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ministranti-luhacovice-zaloha-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses an imported JSON file and updates app data if valid
 */
export function importBackupJSON(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as AppData;
        if (parsed && Array.isArray(parsed.masses) && Array.isArray(parsed.ministrants) && parsed.config) {
          saveAppData(parsed);
          resolve(parsed);
        } else {
          reject(new Error('Soubor neobsahuje platná data rozpisu ministrantů.'));
        }
      } catch (err) {
        reject(new Error('Chyba při čtení JSON souboru.'));
      }
    };
    reader.onerror = () => reject(new Error('Nepodařilo se načíst soubor.'));
    reader.readAsText(file);
  });
}
