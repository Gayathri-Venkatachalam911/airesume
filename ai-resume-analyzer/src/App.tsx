import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import SeekerDashboard from './components/SeekerDashboard';
import RecruiterDashboard from './components/RecruiterDashboard';
import Navbar from './components/Navbar';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (user: User, token: string) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Router>
      <div className="min-h-screen bg-zinc-50 font-sans">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={!user ? <Auth type="login" onAuth={handleLogin} /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <Auth type="signup" onAuth={handleLogin} /> : <Navigate to="/" />} />
            <Route path="/" element={
              user ? (
                user.role === 'SEEKER' ? <SeekerDashboard /> : <RecruiterDashboard />
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="max-w-4xl text-center">
                    <h1 className="motivational-quote text-zinc-900 mb-8">
                      "Choose a job you love, and you will never have to work a day in your life."
                    </h1>
                    <p className="text-xl text-zinc-600 mb-12">
                      AI-powered resume analysis to help you find your dream job or the perfect candidate.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <a href="/signup" className="px-8 py-3 bg-zinc-900 text-white rounded-full font-semibold hover:bg-zinc-800 transition-colors">Get Started</a>
                      <a href="/login" className="px-8 py-3 border border-zinc-200 text-zinc-900 rounded-full font-semibold hover:bg-zinc-100 transition-colors">Login</a>
                    </div>
                  </div>
                </div>
              )
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
