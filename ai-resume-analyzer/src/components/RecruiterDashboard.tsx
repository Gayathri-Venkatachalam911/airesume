import React, { useState, useEffect } from 'react';
import { Job, Application } from '../types';
import { Plus, Trash2, Users, Briefcase, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showPostJob, setShowPostJob] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', description: '', skills: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  const fetchJobs = async () => {
    const res = await fetch('/api/jobs', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setJobs(data);
  };

  const fetchApplications = async () => {
    const res = await fetch('/api/applications', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setApplications(data);
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newJob),
      });
      if (res.ok) {
        setNewJob({ title: '', description: '', skills: '' });
        setShowPostJob(false);
        fetchJobs();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    await fetch(`/api/jobs/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchJobs();
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    await fetch(`/api/applications/${id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status }),
    });
    fetchApplications();
  };

  return (
    <div className="space-y-12">
      <div className="bg-zinc-900 text-white p-12 rounded-3xl relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-montserrat font-black mb-4 uppercase tracking-tight">Recruiter Dashboard</h2>
            <p className="text-zinc-400 text-lg max-w-2xl">
              Manage your job postings and find the best talent using our AI-powered candidate analysis.
            </p>
          </div>
          <button
            onClick={() => setShowPostJob(true)}
            className="px-8 py-4 bg-white text-zinc-900 rounded-2xl font-bold hover:bg-zinc-100 transition-all flex items-center gap-2 shadow-xl"
          >
            <Plus className="w-5 h-5" /> Post New Job
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20" />
      </div>

      {showPostJob && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-montserrat font-black text-zinc-900 mb-8 uppercase tracking-tight">Post New Job</h3>
            <form onSubmit={handlePostJob} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-600">Job Title</label>
                <input
                  type="text"
                  required
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                  placeholder="Senior Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-600">Keywords / Required Skills (comma separated)</label>
                <input
                  type="text"
                  required
                  value={newJob.skills}
                  onChange={(e) => setNewJob({ ...newJob, skills: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                  placeholder="React, Node.js, TypeScript, SQL"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-600">Job Description</label>
                <textarea
                  required
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all h-32 resize-none"
                  placeholder="Describe the role and responsibilities..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
                >
                  {loading ? 'Posting...' : 'Post Job'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPostJob(false)}
                  className="flex-1 py-4 border border-zinc-200 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-2xl font-montserrat font-black text-zinc-900 flex items-center gap-2 uppercase tracking-tight">
            <Briefcase className="w-6 h-6" /> Your Jobs
          </h3>
          <div className="grid gap-4">
            {jobs.map(job => (
              <div key={job.id} className="p-6 bg-white border border-zinc-200 rounded-3xl hover:border-zinc-900 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-bold text-zinc-900">{job.title}</h4>
                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-zinc-500 font-bold uppercase mb-4">{job.skills}</p>
                <p className="text-sm text-zinc-600 line-clamp-2 leading-relaxed">{job.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-2xl font-montserrat font-black text-zinc-900 flex items-center gap-2 uppercase tracking-tight">
            <Users className="w-6 h-6" /> Candidate Applications
          </h3>
          <div className="grid gap-4">
            {applications.map(app => (
              <div key={app.id} className="p-8 bg-white border border-zinc-200 rounded-3xl shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-xl font-bold text-zinc-900">{app.applicant_name}</h4>
                    <p className="text-zinc-500 text-sm font-medium">Applied for: <span className="text-zinc-900 font-bold">{app.job_title}</span></p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    app.status === 'SELECTED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    app.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                    'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {app.status === 'SELECTED' ? <CheckCircle className="w-3 h-3" /> : 
                     app.status === 'REJECTED' ? <XCircle className="w-3 h-3" /> : 
                     <Clock className="w-3 h-3" />}
                    {app.status}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-xs text-zinc-500 font-bold uppercase mb-1">ATS Score</p>
                    <p className="text-2xl font-black text-zinc-900">{app.ats_score}%</p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Match Rate</p>
                    <p className="text-2xl font-black text-zinc-900">{app.match_percentage}%</p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Resume</p>
                    <button className="flex items-center gap-2 text-zinc-900 font-bold hover:text-zinc-600 transition-colors">
                      <FileText className="w-4 h-4" /> View PDF
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleStatusUpdate(app.id, 'SELECTED')}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Select Candidate
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
                    className="flex-1 py-3 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Reject Candidate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
