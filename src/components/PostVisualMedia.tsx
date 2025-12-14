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
  mimeType,
  thumbnailUrl,
  processingStatus,
}: {
  type: VisualMediaType;
  url: string;
  onClick: () => void;
  height: string;
  colSpan: number;
  mimeType?: string | null;
  thumbnailUrl?: string | null;
  processingStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | null;
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
      ) : processingStatus === 'PROCESSING' || processingStatus === 'PENDING' ? (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <div className="text-center">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-sm text-muted-foreground">Processing video...</p>
          </div>
        </div>
      ) : processingStatus === 'FAILED' ? (
        <div className="flex h-full w-full items-center justify-center bg-destructive/10">
          <p className="text-sm text-destructive">Video processing failed</p>
        </div>
      ) : (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          controls
          playsInline
          poster={thumbnailUrl ? `${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/${thumbnailUrl}` : undefined}
          onClick={handleVideoInteraction}
          onDoubleClick={onClick}
          title="Double-click to open in fullscreen modal">
          <source src={url} type={mimeType || 'video/mp4'} />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}
