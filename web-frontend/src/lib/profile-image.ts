const PROFILE_IMAGE_STORAGE_PREFIX = "lawra_profile_image";
const PROFILE_IMAGE_SEQUENCE_KEY = "lawra_profile_image_sequence";

export type ProfileImageRecord = {
  dataUrl: string;
  label: string;
  originalName: string;
  updatedAt: string;
};

function isBrowserStorageAvailable() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getStorageKey(userId: string) {
  return `${PROFILE_IMAGE_STORAGE_PREFIX}:${userId}`;
}

function readSequence() {
  if (!isBrowserStorageAvailable()) {
    return 1;
  }

  const rawValue = window.localStorage.getItem(PROFILE_IMAGE_SEQUENCE_KEY);
  const parsedValue = rawValue ? Number(rawValue) : 1;
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

function writeSequence(nextValue: number) {
  if (!isBrowserStorageAvailable()) {
    return;
  }

  window.localStorage.setItem(PROFILE_IMAGE_SEQUENCE_KEY, String(nextValue));
}

export function createProfileImageLabel(fullName?: string) {
  const fallbackName = fullName?.trim() || "profile";
  const normalizedName = fallbackName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  const sequence = readSequence();
  writeSequence(sequence + 1);

  return `${normalizedName || "profile"} - ${String(sequence).padStart(3, "0")}`;
}

export function loadProfileImage(userId?: string | null): ProfileImageRecord | null {
  if (!userId || !isBrowserStorageAvailable()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(getStorageKey(userId));
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as ProfileImageRecord;
  } catch (error) {
    console.error("Failed to parse profile image record", error);
    return null;
  }
}

export function saveProfileImage(userId: string, record: ProfileImageRecord) {
  if (!isBrowserStorageAvailable()) {
    return;
  }

  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(record));
}

export function removeProfileImage(userId: string) {
  if (!isBrowserStorageAvailable()) {
    return;
  }

  window.localStorage.removeItem(getStorageKey(userId));
}
