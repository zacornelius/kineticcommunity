'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from '@/svg_components';
import { AdminUserList } from './AdminUserList';
import { AdminUserContent } from './AdminUserContent';

export function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setSelectedUserId(null);
  };

  return (
    <div className="px-4 pt-4">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 stroke-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search users by username, name, or email..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-accent transition-colors">
            Search
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Users</h2>
          <AdminUserList searchQuery={searchQuery} onUserSelect={setSelectedUserId} selectedUserId={selectedUserId} />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">User Content</h2>
          {selectedUserId ? (
            <AdminUserContent userId={selectedUserId} />
          ) : (
            <div className="text-muted-foreground">Select a user to view their content</div>
          )}
        </div>
      </div>
    </div>
  );
}

