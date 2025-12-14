'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { AnnouncementForm } from './AnnouncementForm';

interface AdminUser {
  id: string;
  username: string | null;
  email: string | null;
  name: string | null;
  isAdmin: boolean;
}

const MASTER_ADMIN_EMAIL = 'zacornelius@gmail.com'; // Master admin that cannot be removed

export function AdminPanel({ userId }: { userId: string }) {
  const [selectedTab, setSelectedTab] = useState<'admins' | 'alert' | 'email' | 'post'>('admins');
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Fetch all admin users
  const { data: adminData, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/make-admin');
      if (!res.ok) throw new Error('Failed to fetch admin users');
      return (await res.json()) as { adminUsers: AdminUser[] };
    },
  });

  // Add/Remove admin mutation
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      const res = await fetch('/api/admin/make-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isAdmin }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update admin status');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast({ title: 'Admin status updated', type: 'success' });
    },
    onError: (error: Error) => {
      showToast({ title: error.message, type: 'error' });
    },
  });

  const handleRemoveAdmin = (user: AdminUser) => {
    if (user.email === MASTER_ADMIN_EMAIL) {
      showToast({ title: 'Cannot remove master admin', type: 'error' });
      return;
    }
    toggleAdminMutation.mutate({ userId: user.id, isAdmin: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Manage site administration</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setSelectedTab('admins')}
          className={`pb-2 px-4 font-medium transition-colors ${
            selectedTab === 'admins'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}>
          Admins
        </button>
        <button
          onClick={() => setSelectedTab('alert')}
          className={`pb-2 px-4 font-medium transition-colors ${
            selectedTab === 'alert'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}>
          Alert
        </button>
        <button
          onClick={() => setSelectedTab('email')}
          className={`pb-2 px-4 font-medium transition-colors ${
            selectedTab === 'email'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}>
          Email
        </button>
        <button
          onClick={() => setSelectedTab('post')}
          className={`pb-2 px-4 font-medium transition-colors ${
            selectedTab === 'post'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}>
          Post
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'admins' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Admin Users</h2>
            <Button onClick={() => {/* TODO: Add user search modal */}}>
              Add Admin
            </Button>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-2">
              {adminData?.adminUsers.map((user) => {
                const isMasterAdmin = user.email === MASTER_ADMIN_EMAIL;
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {user.name || user.username || 'Unknown User'}
                        {isMasterAdmin && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            MASTER ADMIN
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    {!isMasterAdmin && (
                      <Button
                        variant="destructive"
                        onClick={() => handleRemoveAdmin(user)}
                        disabled={toggleAdminMutation.isPending}>
                        Remove Admin
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'alert' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Create Site Alert</h2>
          <p className="text-muted-foreground">Coming soon: Create and manage site-wide alerts</p>
        </div>
      )}

      {selectedTab === 'email' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Send Group Email</h2>
          <p className="text-muted-foreground">Coming soon: Send emails to all followers</p>
        </div>
      )}

      {selectedTab === 'post' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Create Announcement</h2>
          <p className="text-muted-foreground mb-4">Create announcements that appear on the Home page</p>
          <AnnouncementForm />
        </div>
      )}
    </div>
  );
}

