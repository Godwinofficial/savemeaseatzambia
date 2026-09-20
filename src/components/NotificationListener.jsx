import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useUserRole } from '../utils/useUserRole';
import { toast } from 'sonner';

const NotificationListener = () => {
  const { user, role, loading } = useUserRole();
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    // Request permission for native notifications
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setPermissionGranted(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            setPermissionGranted(true);
          }
        });
      }
    }
  }, []);

  useEffect(() => {
    if (loading || !user) return;

    const channel = supabase
      .channel('public:weddings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'weddings' },
        (payload) => {
          handleRealtimeEvent(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role, loading, permissionGranted]);

  const showNotification = (title, body) => {
    // Show in-app toast notification
    toast(title, {
      description: body,
      duration: 5000,
      position: 'top-right',
    });

    // Show OS-level notification if permitted
    if (permissionGranted && 'Notification' in window) {
      new Notification(title, {
        body: body,
        icon: '/vite.svg' // You can replace this with your app's logo
      });
    }
  };

  const handleRealtimeEvent = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (role === 'super_admin') {
      // Super admins care about NEW events that need approval
      if (eventType === 'INSERT' && newRecord.status === 'pending') {
        showNotification(
          'New Event Submitted',
          `A new event "${newRecord.groom_name || 'Event'}" requires your approval.`
        );
      }
    } else if (role === 'user') {
      // Regular users care about UPDATES to their own events
      if (
        eventType === 'UPDATE' &&
        newRecord.user_id === user.id &&
        newRecord.status !== oldRecord.status
      ) {
        if (newRecord.status === 'approved') {
          showNotification(
            'Event Approved!',
            `Your event "${newRecord.groom_name || 'Event'}" has been approved and is now live!`
          );
        } else if (newRecord.status === 'rejected') {
          showNotification(
            'Event Update',
            `Your event "${newRecord.groom_name || 'Event'}" requires changes.`
          );
        }
      }
    }
  };

  return null; // This component doesn't render anything visible directly
};

export default NotificationListener;
