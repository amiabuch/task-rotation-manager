// src/pages/Notifications.jsx
import { useState, useEffect } from 'react';
import { useKindeAuth } from '../auth/KindeAuth';
import { useAppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import { supabase } from '../supabase/client';

export default function Notifications() {
  const { user } = useKindeAuth();
  const { tasks, fetchTasks, fetchUsers } = useAppContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    fetchTasks();
    fetchUsers();
  }, [fetchTasks, fetchUsers]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      // Update the notifications locally
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const dismissNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
      
      // Remove the notification from the local state
      setNotifications(notifications.filter(notification => notification.id !== notificationId));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTaskName = (taskId) => {
    const task = tasks?.find(t => t.id === taskId);
    return task ? task.name : 'Unknown Task';
  };

  const handleMarkAllRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notification => !notification.read);
      if (unreadNotifications.length === 0) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (error) throw error;
      
      // Update all notifications locally
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const countUnread = () => {
    return notifications.filter(notification => !notification.read).length;
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-gray-500">Stay updated on your tasks and assignments</p>
          </div>
          
          {countUnread() > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="text-blue-600 hover:text-blue-800"
            >
              Mark all as read
            </button>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading notifications...</div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-4 ${!notification.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">
                        {formatTime(notification.created_at)}
                      </p>
                      <p className={`mb-1 ${!notification.read ? 'font-medium' : ''}`}>
                        {notification.message}
                      </p>
                      <p className="text-sm text-gray-600">
                        Task: {getTaskName(notification.task_id)}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="bg-gray-100 rounded-full p-4 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-1">No notifications</h3>
                <p className="text-gray-500">You're all caught up! Check back later for updates.</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">About Notifications</h2>
          <p className="text-gray-600 mb-3">
            You'll receive notifications for:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>Upcoming tasks that are assigned to you</li>
            <li>When a task has been rotated to you</li>
            <li>Reminders when tasks are due soon</li>
            <li>Updates to tasks you're involved with</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}