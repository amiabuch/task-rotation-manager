// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useKindeAuth } from '../auth/KindeAuth';
import { useAppContext } from '../context/AppContext';
import Layout from '../components/Layout';

export default function Dashboard() {
  const { user } = useKindeAuth();
  const { tasks, fetchTasks } = useAppContext();
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [statistics, setStatistics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    upcomingTasks: 0,
  });

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (tasks) {
      // Filter tasks due in the next 7 days
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      
      const upcoming = tasks
        .filter(task => {
          const dueDate = new Date(task.next_due_date);
          return dueDate >= now && dueDate <= nextWeek && task.assigned_to_id === user?.id;
        })
        .sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date));
      
      setUpcomingTasks(upcoming);
      
      // Calculate statistics
      setStatistics({
        totalTasks: tasks.length,
        completedTasks: tasks.filter(task => task.last_completed_date).length,
        upcomingTasks: upcoming.length,
      });
    }
  }, [tasks, user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        {user && (
          <div className="mb-8">
            <p className="text-lg">Welcome back, {user.given_name || user.email}!</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Tasks</h2>
            <p className="text-3xl font-bold">{statistics.totalTasks}</p>
            <p className="text-sm text-gray-500">Total tasks in the system</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Completed</h2>
            <p className="text-3xl font-bold">{statistics.completedTasks}</p>
            <p className="text-sm text-gray-500">Tasks completed so far</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Upcoming</h2>
            <p className="text-3xl font-bold">{statistics.upcomingTasks}</p>
            <p className="text-sm text-gray-500">Your tasks due this week</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Upcoming Tasks</h2>
          
          {upcomingTasks.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {upcomingTasks.map(task => (
                <div key={task.id} className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{task.name}</h3>
                      <p className="text-sm text-gray-500">{task.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Due: {formatDate(task.next_due_date)}</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                        new Date(task.next_due_date) - new Date() < 1000 * 60 * 60 * 24 * 2 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {new Date(task.next_due_date) - new Date() < 1000 * 60 * 60 * 24 * 2
                          ? 'Soon'
                          : 'Upcoming'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">You have no upcoming tasks this week.</p>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Tips</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Mark tasks as complete when you finish them</li>
            <li>Check the Tasks page to see all tasks in the system</li>
            <li>Use the Users page to add teammates</li>
            <li>Set up notifications to get reminders before tasks are due</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}