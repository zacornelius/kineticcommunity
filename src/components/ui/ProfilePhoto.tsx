import Link from 'next/link';
import { FallbackProfilePhoto } from './FallbackProfilePhoto';

export function ProfilePhoto({
  name,
  photoUrl,
  username,
  fallbackAvatarClassName,
  disableLink,
}: {
  name: string;
  username: string;
  photoUrl?: string | null;
  fallbackAvatarClassName?: string;
  disableLink?: boolean;
}) {
  const content = photoUrl ? (
    <img
      src={photoUrl}
      alt={`${name}'s avatar`}
      className="h-full w-full cursor-pointer rounded-full bg-muted object-cover"
    />
  ) : (
    <FallbackProfilePhoto name={name} className={fallbackAvatarClassName} />
  );

  if (disableLink) {
    return <div className="h-full w-full">{content}</div>;
  }

  return <Link href={`/${username}`}>{content}</Link>;
}
