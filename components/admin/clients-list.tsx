'use client'

import React, { useState } from 'react';
import type { User, Booking } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, ChevronUp, UserCircle, 
  MessageSquare, Phone, History, Send, Mail
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface ClientsListProps {
  users: User[];
  bookings: (Booking & { users: { email: string } })[];
}

export function ClientsList({ users, bookings }: ClientsListProps) {
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getClientStats = (clientId: string) => {
    const clientBookings = bookings.filter(b => b.user_id === clientId);
    const sorted = [...clientBookings].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return {
      total: clientBookings.length,
      // Updated status tracking based on your requirements
      completed: clientBookings.filter(b => b.status?.toLowerCase() === 'completed').length,
      canceled: clientBookings.filter(b => b.status?.toLowerCase() === 'canceled').length,
      rejected: clientBookings.filter(b => b.status?.toLowerCase() === 'rejected').length,
      latest: sorted[0] || null
    };
  };

  // Search by Email or Telegram Username
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.telegram_username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24">
      <div className="px-1 space-y-4">
        <Input 
          placeholder="Search by email or telegram name..." 
          className="bg-white border-slate-200 rounded-xl h-12 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <h2 className="text-lg font-bold text-slate-800">
          Registered Clients <span className="text-slate-400 font-normal">({users.length})</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredUsers.map((user) => {
          const stats = getClientStats(user.id);
          const isExpanded = expandedClientId === user.id;
          // Pulling latest phone number from their most recent booking
          const clientMobile = stats.latest?.mobile || '';

          return (
            <Card key={user.id} className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
              <CardContent className="p-0">
                <div 
                  className="p-4 flex items-center gap-4 bg-slate-50/50 cursor-pointer"
                  onClick={() => setExpandedClientId(isExpanded ? null : user.id)}
                >
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 overflow-hidden border border-emerald-200">
                    {user.telegram_photo_url ? (
                      <img src={user.telegram_photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate text-sm">
                      {user.telegram_username ? `@${user.telegram_username}` : user.email}
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      ID: {user.telegram_id || 'No Telegram Linked'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px]">
                      {stats.total} Bookings
                    </Badge>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t bg-white p-5 space-y-5 animate-in fade-in slide-in-from-top-2">
                    {/* User Info Grid */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-3">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Account Details</p>
                        
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <Mail size={14} className="text-slate-400" />
                          <span>Email: <span className="font-medium text-slate-900">{user.email}</span></span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <Send size={14} className="text-slate-400" />
                          <span>Telegram ID: <span className="font-medium text-slate-900">{user.telegram_id || 'N/A'}</span></span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          <span>Phone: <span className="font-medium text-slate-900">{clientMobile || 'Not provided'}</span></span>
                        </div>
                      </div>

                      {/* Status Breakdown Section */}
                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">Booking History Summary</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                            <p className="text-[10px] text-emerald-600 font-bold">Completed</p>
                            <p className="text-lg font-black text-emerald-700">{stats.completed}</p>
                          </div>
                          <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                            <p className="text-[10px] text-red-600 font-bold">Rejected</p>
                            <p className="text-lg font-black text-red-700">{stats.rejected}</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <p className="text-[10px] text-slate-500 font-bold">Canceled</p>
                            <p className="text-lg font-black text-slate-600">{stats.canceled}</p>
                          </div>
                        </div>
                      </div>

                      {stats.latest && (
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 bg-slate-50 p-2 rounded-md">
                          <History size={14} /> 
                          <span>Latest: {stats.latest.service} on {stats.latest.date}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 h-10 text-xs gap-2 border-slate-200" asChild disabled={!clientMobile}>
                        <a href={`sms:${clientMobile}`}><MessageSquare size={14} /> SMS</a>
                      </Button>
                      <Button className="flex-1 h-10 text-xs bg-slate-900 text-white gap-2" asChild disabled={!clientMobile}>
                        <a href={`tel:${clientMobile}`}><Phone size={14} /> Call</a>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
