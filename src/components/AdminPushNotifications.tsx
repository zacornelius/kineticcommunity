'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Button from './ui/Button';
import { Textarea } from './ui/Textarea';
import { TextInput } from './ui/TextInput';
import { useDialogs } from '@/hooks/useDialogs';

export function AdminPushNotifications() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const { alert, confirm } = useDialogs();

  // Send push notification mutation
  const sendPushMutation = useMutation({
    mutationFn: async (data: { title: string; body: string; url?: string }) => {
      const res = await fetch('/api/admin/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send push notification');
      }
      return res.json();
    },
    onSuccess: (data) => {
      alert({
        title: 'Success',
        message: data.message,
      });
      setTitle('');
      setBody('');
      setUrl('');
    },
    onError: (error: Error) => {
      alert({
        title: 'Error',
        message: error.message,
      });
    },
  });

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      alert({
        title: 'Validation Error',
        message: 'Title and body are required',
      });
      return;
    }

    confirm({
      title: 'Confirm Send',
      message: 'Are you sure you want to send this push notification to all users?',
      onConfirm: () => {
        sendPushMutation.mutate({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || undefined,
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-2xl font-bold">Send Push Notification</h2>

        <div className="space-y-4">
          <div>
            <TextInput label="Title *" value={title} onChange={setTitle} placeholder="Notification title" />
          </div>

          <div>
            <Textarea label="Message *" value={body} onChange={setBody} placeholder="Notification message" />
          </div>

          <div>
            <TextInput label="URL (optional)" value={url} onChange={setUrl} placeholder="/feed or /posts/123" />
          </div>

          <div className="flex gap-2">
            <Button
              onPress={handleSend}
              loading={sendPushMutation.isPending}
              isDisabled={!title.trim() || !body.trim()}>
              Send to All Users
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
