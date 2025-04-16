// src/pages/Tasks.jsx
import { useState, useEffect } from 'react';
import { useKindeAuth } from '../auth/KindeAuth';
import { useAppContext } from '../context/AppContext';
import Layout from '../components/Layout';

export default function Tasks() {
  const { user } = useKindeAuth();
  const { tasks, fetchTasks, createTask, updateTask, deleteTask, users, fetchUsers } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'weekly',
    assigned_to_id: '',
    next_due_date: '',
  });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [fetchTasks, fetchUsers]);

  const openModal = (task = null) => {
    if (task) {
      setCurrentTask(task);
      setFormData({
        name: task.name,
        description: task.description || '',
        frequency: task.frequency || 'weekly',
        assigned_to_id: task.assigned_to_id || '',
        next_due_date: task.next_due_date ? new Date(task.next_due_date).toISOString().split('T')[0] : '',
      });
    } else {
      setCurrentTask(null);
      setFormData({
        name: '',
        description: '',
        frequency: 'weekly',
        assigned_to_id: user?.id || '',
        next_due_date: new Date().toISOString().split('T')[0],
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTask(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (currentTask) {
        await updateTask(currentTask.id, formData);
      } else {
        await createTask({
          ...formData,
          created_by_id: user?.id,
        });
      }
      closeModal();
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleMarkComplete = async (task) => {
    try {
      const nextDueDate = new Date();
      
      // Calculate the next due date based on frequency
      switch (task.frequency) {
        case 'daily':
          nextDueDate.setDate(nextDueDate.getDate() + 1);
          break;
        case 'weekly':
          nextDueDate.setDate(nextDueDate.getDate() + 7);
          break;
        case 'biweekly':
          nextDueDate.setDate(nextDueDate.getDate() + 14);
          break;
        case 'monthly':
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          break;
        default:
          nextDueDate.setDate(nextDueDate.getDate() + 7);
      }
      
      await updateTask(task.id, {
        last_completed_date: new Date().toISOString(),
        next_due_date: nextDueDate.toISOString(),
        // Rotate assignment if needed
        // This is simplified, you might want more complex rotation logic
        // assigned_to_id: nextUserId
      });
      
      fetchTasks();
    } catch (error) {
      console.error('Error marking task complete:', error);
    }
  };

  const filteredTasks = tasks?.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'mine') return task.assigned_to_id === user?.id;
    if (filter === 'overdue') {
      return new Date(task.next_due_date) < new Date() && !task.last_completed_date;
    }
    return true;
  }).sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date));

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getUserName = (userId) => {
    const user = users?.find(u => u.id === userId);
    return user ? (user.name || user.email) : 'Unassigned';
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <button 
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create Task
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex space-x-4">
            <button 
              className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
              onClick={() => setFilter('all')}
            >
              All Tasks
            </button>
            <button 
              className={`px-4 py-2 rounded-md ${filter === 'mine' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
              onClick={() => setFilter('mine')}
            >
              My Tasks
            </button>
            <button 
              className={`px-4 py-2 rounded-md ${filter === 'overdue' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
              onClick={() => setFilter('overdue')}
            >
              Overdue
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredTasks && filteredTasks.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map(task => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{task.name}</div>
                      <div className="text-sm text-gray-500">{task.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getUserName(task.assigned_to_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(task.next_due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {task.frequency || 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        new Date(task.next_due_date) < new Date() 
                          ? 'bg-red-100 text-red-800' 
                          : task.last_completed_date ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {new Date(task.next_due_date) < new Date() 
                          ? 'Overdue' 
                          : task.last_completed_date ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleMarkComplete(task)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Complete
                      </button>
                      <button 
                        onClick={() => openModal(task)} 
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteTask(task.id)} 
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No tasks found. Create a new task to get started.
            </div>
          )}
        </div>
      </div>
      
      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {currentTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <select
                  name="assigned_to_id"
                  value={formData.assigned_to_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select User</option>
                  {users?.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Due Date
                </label>
                <input
                  type="date"
                  name="next_due_date"
                  value={formData.next_due_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {currentTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}