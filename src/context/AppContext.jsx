// src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useKindeAuth } from '../auth/KindeAuth';
import { supabase } from '../supabase/client';

const AppContext = createContext();

export function AppContextProvider({ children }) {
  const { user, isAuthenticated } = useKindeAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadData();
    }
  }, [isAuthenticated, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load tasks the user is involved with
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          task_rotation!inner(*)
        `)
        .eq('task_rotation.user_id', user.id);
      
      if (tasksError) throw tasksError;
      
      // Load all users associated with these tasks
      const taskIds = tasksData.map(task => task.id);
      const { data: usersInTasks, error: usersError } = await supabase
        .from('task_rotation')
        .select(`
          user_id,
          users:user_id(id, name, email, avatar_url)
        `)
        .in('task_id', taskIds);
      
      if (usersError) throw usersError;
      
      // Create unique user list
      const uniqueUsers = [...new Map(usersInTasks.map(item => 
        [item.user_id, item.users]
      )).values()];
      
      // Load task assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('task_assignments')
        .select('*')
        .in('task_id', taskIds);
      
      if (assignmentsError) throw assignmentsError;
      
      // Load notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (notificationsError) throw notificationsError;
      
      // Process and combine the data
      const processedTasks = tasksData.map(task => {
        const taskRotation = task.task_rotation.sort((a, b) => a.position - b.position);
        const taskAssignments = assignments.filter(a => a.task_id === task.id);
        const currentAssignment = taskAssignments.find(a => !a.completed);
        
        return {
          ...task,
          rotation: taskRotation.map(r => r.user_id),
          currentAssignee: currentAssignment ? currentAssignment.user_id : null,
          nextDue: currentAssignment ? currentAssignment.due_date : null,
          notificationSent: currentAssignment ? currentAssignment.notification_sent : false
        };
      });
      
      setTasks(processedTasks);
      setUsers(uniqueUsers);
      setNotifications(notificationsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to mark a task as complete
  const completeTask = async (taskId) => {
    try {
      // Get the current task
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');
      
      // Find current assignment
      const { data: currentAssignment, error: assignmentError } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('task_id', taskId)
        .eq('completed', false)
        .single();
      
      if (assignmentError) throw assignmentError;
      
      // Mark current assignment as complete
      await supabase
        .from('task_assignments')
        .update({ completed: true })
        .eq('id', currentAssignment.id);
      
      // Find who's next in the rotation
      const currentIndex = task.rotation.indexOf(currentAssignment.user_id);
      const nextIndex = (currentIndex + 1) % task.rotation.length;
      const nextUserId = task.rotation[nextIndex];
      
      // Calculate next due date
      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + task.cycle_interval);
      
      // Create new assignment
      const { error: newAssignmentError } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskId,
          user_id: nextUserId,
          due_date: nextDueDate.toISOString()
        })
        .select()
        .single();
      
      if (newAssignmentError) throw newAssignmentError;
      
      // Get next user's email to notify them
      const { data: nextUser, error: nextUserError } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', nextUserId)
        .single();
        
      if (nextUserError) throw nextUserError;
      
      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: nextUserId,
          task_id: taskId,
          message: `You're up next for "${task.title}"`
        });
      
      // Send email notification
      await fetch('/api/sendNotification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: nextUserId,
          taskId: taskId,
          message: `You're up next for "${task.title}"`,
          email: nextUser.email
        })
      });
      
      // Refresh data
      await loadData();
      
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  };

  // Function to create a new task
  const createTask = async (taskData) => {
    try {
      // Create the task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          cycle_interval: taskData.cycleInterval,
          notify_day: taskData.notifyDay,
          created_by: user.id
        })
        .select()
        .single();
      
      if (taskError) throw taskError;
      
      // Add task rotation entries
      const rotationEntries = taskData.rotation.map((userId, idx) => ({
        task_id: task.id,
        user_id: userId,
        position: idx
      }));
      
      const { error: rotationError } = await supabase
        .from('task_rotation')
        .insert(rotationEntries);
      
      if (rotationError) throw rotationError;
      
      // Create first assignment
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + parseInt(taskData.cycleInterval));
      
      const { error: assignmentError } = await supabase
        .from('task_assignments')
        .insert({
          task_id: task.id,
          user_id: taskData.rotation[0],
          due_date: dueDate.toISOString()
        });
      
      if (assignmentError) throw assignmentError;
      
      // Refresh data
      await loadData();
      
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  // Function to get tasks assigned to a user
  const getUserTasks = (userId) => {
    return tasks.filter(task => task.currentAssignee === userId);
  };

  // Function to get notifications for a user
  const getUserNotifications = (userId) => {
    return notifications.filter(notification => notification.user_id === userId);
  };

  // Function to mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      tasks,
      users,
      notifications,
      loading,
      error,
      completeTask,
      createTask,
      getUserTasks,
      getUserNotifications,
      markNotificationAsRead,
      refreshData: loadData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}