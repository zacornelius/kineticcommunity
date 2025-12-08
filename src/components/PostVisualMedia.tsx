import { cn } from '@/lib/cn';
import { VisualMediaType } from '@prisma/client';
import { useMemo, useRef } from 'react';
import { mergeProps, useFocusRing, usePress } from 'react-aria';

export function PostVisualMedia({
  type,
  url,
  onClick,
  height,
  colSpan,
}: {
  type: VisualMediaType;
  url: string;
  onClick: () => void;
  height: string;
  colSpan: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { pressProps, isPressed } = usePress({
    onPress: onClick,
  });
  const { focusProps, isFocusVisible } = useFocusRing();
  const style = useMemo(() => ({ height }), [height]);
  
  // Stop event propagation when interacting with video controls
  // This prevents the modal from opening when clicking play/pause/volume etc.
  const handleVideoInteraction = (e: React.MouseEvent<HTMLVideoElement>) => {
    e.stopPropagation();
  };

  return (
    <div
      {...mergeProps(type === 'PHOTO' ? pressProps : {}, focusProps)}
      role={type === 'PHOTO' ? 'button' : undefined}
      tabIndex={type === 'PHOTO' ? 0 : undefined}
      className={cn(
        'group relative focus:outline-none',
        type === 'PHOTO' && 'cursor-pointer',
        colSpan === 1 ? 'col-span-1' : 'col-span-2',
        isFocusVisible && 'border-4 border-violet-500',
      )}
      style={style}>
      {type === 'PHOTO' ? (
        <img src={url} alt="" className={cn('h-full w-full object-cover', isPressed && 'brightness-75')} />
      ) : (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          controls
          playsInline
          onClick={handleVideoInteraction}
          onDoubleClick={onClick}
          title="Double-click to open in fullscreen modal">
          <source src={url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}
