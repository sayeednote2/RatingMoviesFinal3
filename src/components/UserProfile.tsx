import React, { useState } from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function UserProfile() {
  const { user, signIn, signOut } = useAuth();
  const [username, setUsername] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      signIn(username);
      setUsername('');
      toast.success('Welcome!');
    }
  };

  const handleSignOut = () => {
    signOut();
    toast.success('Signed out successfully!');
  };

  if (!user) {
    return (
      <form onSubmit={handleSignIn} className="flex flex-col sm:flex-row gap-2 w-full">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          className="flex-1 px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base bg-white text-gray-900"
          required
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition duration-200 text-sm sm:text-base w-full sm:w-auto"
        >
          <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Sign In</span>
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between w-full px-3 sm:px-4 py-2 bg-black/20 backdrop-blur-sm rounded-lg">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-100 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
        </div>
        <span className="font-medium text-sm sm:text-base text-white">{user.username}</span>
      </div>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-1.5 sm:gap-2 text-white/90 hover:text-white active:text-white/80 transition-colors duration-200 py-2 text-sm sm:text-base"
      >
        <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>Sign Out</span>
      </button>
    </div>
  );
}