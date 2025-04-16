// api/sendNotification.js
// This would be a serverless function (e.g., Vercel, Netlify, Supabase Edge Functions)
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Email transporter - use the same import.meta.env approach for consistency
const transporter = nodemailer.createTransport({
  host: import.meta.env.VITE_EMAIL_HOST,
  port: import.meta.env.VITE_EMAIL_PORT,
  secure: true,
  auth: {
    user: import.meta.env.VITE_EMAIL_USER,
    pass: import.meta.env.VITE_EMAIL_PASSWORD
  }
});

export default async (req, res) => {
  try {
    // Check if this is a scheduled function or direct call
    if (req.body.scheduled) {
      // Process all tasks that need notifications
      const now = new Date();
      
      // Find task assignments near due date that haven't been notified
      const { data: tasksToNotify, error } = await supabase
        .from('task_assignments')
        .select(`
          *,
          tasks:task_id (title, cycle_interval, notify_day),
          users:user_id (email, name)
        `)
        .eq('notification_sent', false)
        .eq('completed', false);
      
      if (error) throw error;
      
      // For each task that needs notification
      for (const assignment of tasksToNotify) {
        const dueDate = new Date(assignment.due_date);
        const daysDifference = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        
        // Check if we should send notification now
        const daysBeforeDue = assignment.tasks.cycle_interval - assignment.tasks.notify_day;
        
        if (daysDifference <= daysBeforeDue) {
          // Send email notification
          await transporter.sendMail({
            from: `"Task Manager" <${import.meta.env.VITE_EMAIL_USER}>`,
            to: assignment.users.email,
            subject: `Reminder: ${assignment.tasks.title} due in ${daysDifference} days`,
            html: `
              <h2>Task Reminder</h2>
              <p>Hello ${assignment.users.name},</p>
              <p>This is a reminder that you need to complete the following task:</p>
              <h3>${assignment.tasks.title}</h3>
              <p>Due in ${daysDifference} days on ${dueDate.toLocaleDateString()}</p>
              <p>Please mark this task as complete when you've finished it.</p>
              <p>Thank you!</p>
            `
          });
          
          // Update notification status
          await supabase
            .from('task_assignments')
            .update({ notification_sent: true })
            .eq('id', assignment.id);
            
          // Create notification in database
          await supabase.from('notifications').insert({
            user_id: assignment.user_id,
            task_id: assignment.task_id,
            message: `Reminder: "${assignment.tasks.title}" is due in ${daysDifference} days!`
          });
        }
      }
      
      res.status(200).json({ success: true, message: 'Notifications processed' });
    } else {
      // Handle direct notification requests
      const { userId, taskId, message, email } = req.body;
      
      if (!userId || !taskId || !message || !email) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }
      
      // Send email notification directly
      await transporter.sendMail({
        from: `"Task Manager" <${import.meta.env.VITE_EMAIL_USER}>`,
        to: email,
        subject: 'Task Notification',
        html: `
          <h2>Task Notification</h2>
          <p>${message}</p>
          <p>Please check your task manager for more details.</p>
        `
      });
      
      res.status(200).json({ success: true, message: 'Notification sent' });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};