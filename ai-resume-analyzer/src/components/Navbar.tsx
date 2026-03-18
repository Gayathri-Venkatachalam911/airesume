import { Link } from 'react-router-dom';
import { User } from '../types';
import { LogOut, User as UserIcon, Briefcase } from 'lucide-react';

interface Props {
  user: User | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: Props) {
  return (
    <nav className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
            <Briefcase className="text-white w-6 h-6" />
          </div>
          <span className="font-montserrat font-black text-xl tracking-tight text-zinc-900">RESUME.AI</span>
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-zinc-600">
                <UserIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{user.name} ({user.role})</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors">Login</Link>
              <Link to="/signup" className="px-4 py-2 bg-zinc-900 text-white rounded-full text-sm font-semibold hover:bg-zinc-800 transition-colors">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
