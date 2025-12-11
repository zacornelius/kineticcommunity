'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import Button from './ui/Button';
import { useState } from 'react';

export function PushNotificationSettings() {
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe } = usePushNotifications();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isSupported) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-2 text-lg font-semibold">Push Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Push notifications are not supported in your browser. Please use a modern browser like Chrome, Safari (iOS
          16.4+), or Edge.
        </p>
      </div>
    );
  }

  const handleToggle = async () => {
    setIsProcessing(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-2 text-lg font-semibold">Push Notifications</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Get notified when someone likes your posts, comments on your content, or follows you.
      </p>

      {permission === 'denied' && (
        <p className="mb-4 text-sm text-destructive">
          Notifications are blocked. Please enable them in your browser settings.
        </p>
      )}

      <Button
        onPress={handleToggle}
        isDisabled={isLoading || isProcessing || permission === 'denied'}
        loading={isLoading || isProcessing}>
        {isSubscribed ? 'Disable Push Notifications' : 'Enable Push Notifications'}
      </Button>

      {isSubscribed && <p className="mt-2 text-xs text-muted-foreground">✓ Push notifications are enabled</p>}
    </div>
  );
}
