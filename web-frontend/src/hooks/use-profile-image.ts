import { useEffect, useState } from "react";
import avatarDog from "@/assets/avatar-dog.jpg";
import { loadProfileImage } from "@/lib/profile-image";

export function useProfileImage(userId?: string | null) {
  const [profileImage, setProfileImage] = useState<string>(avatarDog);

  useEffect(() => {
    setProfileImage(loadProfileImage(userId)?.dataUrl ?? avatarDog);
  }, [userId]);

  useEffect(() => {
    if (!userId || typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== `lawra_profile_image:${userId}`) {
        return;
      }

      const record = loadProfileImage(userId);
      setProfileImage(record?.dataUrl ?? avatarDog);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [userId]);

  return profileImage;
}
