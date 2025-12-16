'use client';

import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import Button from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Shows a prompt to enable push notifications when the PWA is installed
 * Only shows once per session and only if notifications aren't already enabled
 */
export function PushNotificationPrompt() {
  const { isSupported, isSubscribed, permission, subscribe } = usePushNotifications();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Don't show if not supported or already subscribed
    if (!isSupported || isSubscribed || permission === 'denied') {
      return;
    }

    // Check if we've already shown the prompt this session
    const hasShownPrompt = sessionStorage.getItem('push-prompt-shown');
    if (hasShownPrompt) {
      return;
    }

    // Check if this is a PWA (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
        sessionStorage.setItem('push-prompt-shown', 'true');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isSupported, isSubscribed, permission]);

  const handleEnable = async () => {
    setIsProcessing(true);
    try {
      await subscribe();
      setShowPrompt(false);
    } catch (error) {
      console.error('Error enabling push notifications:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Prompt Card */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <svg
                  className="h-8 w-8 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
            </div>

            <h2 className="mb-2 text-center text-xl font-bold">Stay Connected</h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Enable push notifications to get notified when someone likes your posts, comments on your content, or
              follows you.
            </p>

            <div className="flex gap-3">
              <Button mode="secondary" onPress={handleDismiss} className="flex-1">
                Not Now
              </Button>
              <Button onPress={handleEnable} loading={isProcessing} className="flex-1">
                Enable
              </Button>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

