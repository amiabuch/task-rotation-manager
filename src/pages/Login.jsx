// src/pages/Login.jsx
import { useKindeAuth } from '../auth/KindeAuth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login, isAuthenticated, isLoading } = useKindeAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Task Rotation Manager</h1>
        <p className="text-center text-gray-600 mb-8">
          Collaborate with your team, family, or roommates to manage shared responsibilities.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => login()}
            className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign in with Google
          </button>
          
          <div className="text-sm text-center text-gray-500">
            Powered by Kinde Authentication
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="text-lg font-medium mb-4">Features:</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>Automatically rotate tasks between users</li>
            <li>Get email reminders before tasks are due</li>
            <li>Track who's responsible for what and when</li>
            <li>Perfect for roommates, families, or teams</li>
          </ul>
        </div>
      </div>
    </div>
  );
}