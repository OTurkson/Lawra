import { useProfileImage } from "@/hooks/use-profile-image";

type ProfileAvatarProps = {
  userId?: string | null;
  alt?: string;
  className?: string;
};

const ProfileAvatar = ({ userId, alt = "Profile", className = "w-full h-full object-cover" }: ProfileAvatarProps) => {
  const profileImage = useProfileImage(userId);

  return <img src={profileImage} alt={alt} className={className} />;
};

export default ProfileAvatar;
