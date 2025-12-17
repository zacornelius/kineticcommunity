'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { CreatePostSortItem } from '@/components/CreatePostSortItem';
import { v4 as uuid } from 'uuid';

interface VisualMediaFile {
  file: File;
  id: string;
  src: string;
}

export function AnnouncementForm() {
  const [content, setContent] = useState('');
  const [visualMedia, setVisualMedia] = useState<VisualMediaFile[]>([]);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const createMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('content', content);
      visualMedia.forEach(({ file }) => {
        formData.append('files', file);
      });

      const res = await fetch('/api/announcements', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to create announcement');
      return res.json();
    },
    onSuccess: () => {
      showToast({ title: 'Announcement created!', type: 'success' });
      setContent('');
      setVisualMedia([]);
      visualMedia.forEach(({ src }) => URL.revokeObjectURL(src));
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: () => {
      showToast({ title: 'Failed to create announcement', type: 'error' });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newMedia = files.map((file) => ({
      file,
      id: uuid(),
      src: URL.createObjectURL(file),
    }));
    setVisualMedia((prev) => [...prev, ...newMedia]);
  };

  const handleRemoveMedia = (id: string) => {
    setVisualMedia((prev) => {
      const mediaToRemove = prev.find((m) => m.id === id);
      if (mediaToRemove) URL.revokeObjectURL(mediaToRemove.src);
      return prev.filter((m) => m.id !== id);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && visualMedia.length === 0) return;
    createMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your announcement..."
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-4 py-2 outline-none focus:ring-2 focus:ring-primary resize-none"
          maxLength={500}
        />
        <p className="mt-1 text-sm text-muted-foreground">
          {content.length}/500 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Media</label>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
          id="media-upload"
        />
        <label
          htmlFor="media-upload"
          className="inline-block px-4 py-2 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted transition-colors">
          Add Photos/Videos
        </label>

        {visualMedia.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {visualMedia.map((media) => (
              <CreatePostSortItem
                key={media.id}
                type={media.file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO'}
                url={media.src}
                mimeType={media.file.type}
                onRemove={() => handleRemoveMedia(media.id)}
              />
            ))}
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={(!content.trim() && visualMedia.length === 0) || createMutation.isPending}
        loading={createMutation.isPending}>
        Create Announcement
      </Button>
    </form>
  );
}

