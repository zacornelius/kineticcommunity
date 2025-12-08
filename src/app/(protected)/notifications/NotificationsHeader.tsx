'use client';

import { Key, useCallback, useMemo } from 'react';
import { DropdownMenuButton } from '@/components/ui/DropdownMenuButton';
import { Section, Item } from 'react-stately';
import { useNotificationsCountQuery } from '@/hooks/queries/useNotificationsCountQuery';
import { useNotificationsReadStatusMutations } from '@/hooks/mutations/useNotificationsReadStatusMutations';

export function NotificationsHeader() {
  const { data: notificationCount } = useNotificationsCountQuery();
  const { markAllAsReadMutation } = useNotificationsReadStatusMutations();

  const markAllAsRead = useCallback(
    (key: Key) => {
      if (key === 'mark-all') {
        markAllAsReadMutation.mutate();
      }
    },
    [markAllAsReadMutation],
  );

  const disabledKeys = useMemo(() => {
    if (notificationCount === undefined || notificationCount === 0) {
      return ['mark-all'];
    }
    return [];
  }, [notificationCount]);

  return (
    <DropdownMenuButton
      key="notifications-option"
      label="Notifications option"
      onAction={markAllAsRead}
      disabledKeys={disabledKeys}>
      <Section>
        <Item key="mark-all">Mark all as read</Item>
      </Section>
    </DropdownMenuButton>
  );
}

