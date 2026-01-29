import { User } from "@prisma/client";
import { AvatarProps } from "@radix-ui/react-avatar";

import { Avatar, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps extends AvatarProps {
  user: Pick<User, "image" | "name" | "email">;
}

function getAvatarUrl(image: string | null, name: string | null, email: string | null): string {
  if (!image) {
    return `https://api.dicebear.com/9.x/initials/svg?seed=${name || email}`;
  }
  // Proxy linux.do avatars to avoid CORS issues
  if (image.startsWith("https://linux.do/") || image.startsWith("https://cdn.linux.do/")) {
    return `/api/proxy/avatar?url=${encodeURIComponent(image)}`;
  }
  return image;
}

export function UserAvatar({ user, ...props }: UserAvatarProps) {
  return (
    <Avatar {...props}>
      <AvatarImage
        alt="Picture"
        src={getAvatarUrl(user.image, user.name, user.email)}
        referrerPolicy="no-referrer"
      />
    </Avatar>
  );
}
