import React, { useState, useEffect } from 'react';
import { Job, Application } from '../types';
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle, Briefcase } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export default function SeekerDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);

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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !file) return;

    setUploading(true);
    setError('');
    setSuccess(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      // 1. Extract Text from Backend
      const extractRes = await fetch('/api/resume/extract', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });

      const extractData = await extractRes.json();
      if (!extractRes.ok) {
        throw new Error(extractData.error || 'Text extraction failed. Please try another file format.');
      }

      const resumeText = extractData.text;

      // 2. Call Gemini AI from Frontend
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

      const prompt = `
        Analyze the following resume text against the job description and required keywords/skills.
        Job Title: ${selectedJob.title}
        Job Description: ${selectedJob.description}
        Required Keywords/Skills: ${selectedJob.skills}

        Resume Text:
        ${resumeText}

        Please perform a deep analysis:
        1. Extract relevant skills from the resume.
        2. Match them against the "Required Keywords/Skills" provided by the recruiter.
        3. Calculate an ATS Score (0-100) based on how well the resume matches the job requirements.
        4. Calculate a Match Percentage (0-100) specifically for the required keywords.
        5. Identify any missing keywords/skills from the required list.
        6. Provide constructive suggestions for improvement.

        Return the result in JSON format only:
        {
          "ats_score": number,
          "match_percentage": number,
          "missing_skills": string[],
          "suggestions": string,
          "status": "SELECTED" | "REJECTED"
        }
        (Status should be "SELECTED" if ats_score >= 70, otherwise "REJECTED")
      `;

      const aiResult = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      const responseText = aiResult.text || "";
      let analysis;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not parse AI response");
        }
      } catch (e) {
        console.error("AI Response parsing error:", e, responseText);
        throw new Error("Failed to analyze resume. Please try again.");
      }

      // 3. Save Application to Backend
      const saveRes = await fetch('/api/applications/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          jobId: selectedJob.id,
          status: analysis.status,
          ats_score: analysis.ats_score,
          match_percentage: analysis.match_percentage,
          analysis_result: analysis
        }),
      });

      if (!saveRes.ok) throw new Error('Failed to save application');

      setSuccess(analysis);
      fetchApplications();
      setFile(null);
      setSelectedJob(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="bg-zinc-900 text-white p-12 rounded-3xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-montserrat font-black mb-4 uppercase tracking-tight">Your Career Journey</h2>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Upload your resume and let our AI analyze your fit for the latest job openings. 
            Get instant feedback on your ATS score and skill matches.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h3 className="text-2xl font-montserrat font-black text-zinc-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
              <CustomBriefcaseIcon className="w-6 h-6" /> Available Jobs
            </h3>
            <div className="grid gap-4">
              {jobs.map(job => (
                <div key={job.id} className="p-6 bg-white border border-zinc-200 rounded-3xl hover:border-zinc-900 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-zinc-900 group-hover:text-zinc-800">{job.title}</h4>
                      <p className="text-zinc-500 text-sm mt-1">{job.skills}</p>
                    </div>
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="px-6 py-2 bg-zinc-900 text-white rounded-full text-sm font-bold hover:bg-zinc-800 transition-colors"
                    >
                      Apply Now
                    </button>
                  </div>
                  <p className="text-zinc-600 line-clamp-2 text-sm leading-relaxed">{job.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-montserrat font-black text-zinc-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Clock className="w-6 h-6" /> Your Applications
            </h3>
            <div className="grid gap-4">
              {applications.map(app => (
                <div key={app.id} className="p-6 bg-white border border-zinc-200 rounded-3xl">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-zinc-900">{app.job_title}</h4>
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
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <p className="text-xs text-zinc-500 font-bold uppercase mb-1">ATS Score</p>
                      <p className="text-2xl font-black text-zinc-900">{app.ats_score}%</p>
                    </div>
                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Match Rate</p>
                      <p className="text-2xl font-black text-zinc-900">{app.match_percentage}%</p>
                    </div>
                  </div>
                  {app.status === 'SELECTED' && (
                    <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-bold text-center uppercase tracking-tight">
                      HEY! YOU'RE SELECTED
                    </div>
                  )}
                  {app.status === 'REJECTED' && (
                    <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100 font-bold text-center uppercase tracking-tight">
                      TRY AGAIN
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="sticky top-24">
            <div className="p-8 bg-white border border-zinc-200 rounded-3xl shadow-sm">
              <h3 className="text-xl font-montserrat font-black text-zinc-900 mb-6 uppercase tracking-tight">Upload Resume</h3>
              
              {selectedJob ? (
                <form onSubmit={handleUpload} className="space-y-6">
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 mb-4">
                    <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Applying for</p>
                    <p className="font-bold text-zinc-900">{selectedJob.title}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-600">Resume (PDF or DOCX)</label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label
                        htmlFor="resume-upload"
                        className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-200 rounded-2xl cursor-pointer hover:border-zinc-900 hover:bg-zinc-50 transition-all"
                      >
                        <Upload className="w-8 h-8 text-zinc-400 mb-2 group-hover:text-zinc-900" />
                        <span className="text-sm font-medium text-zinc-600 group-hover:text-zinc-900">
                          {file ? file.name : 'Click to select file'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploading || !file}
                    className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Analyzing...' : 'Analyze & Apply'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedJob(null)}
                    className="w-full py-2 text-zinc-500 text-sm font-semibold hover:text-zinc-900 transition-colors"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="text-center py-12 text-zinc-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-medium">Select a job from the list to start your application.</p>
                </div>
              )}
            </div>

            {success && (
              <div className="mt-8 p-8 bg-zinc-900 text-white rounded-3xl shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h4 className="text-xl font-montserrat font-black mb-4 uppercase tracking-tight">Analysis Result</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm font-bold uppercase">ATS Score</span>
                    <span className="text-2xl font-black">{success.ats_score}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm font-bold uppercase">Match Rate</span>
                    <span className="text-2xl font-black">{success.match_percentage}%</span>
                  </div>
                  <div className="pt-4 border-t border-zinc-800">
                    <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Missing Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {success.missing_skills.map((skill: string) => (
                        <span key={skill} className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-medium">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-800">
                    <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Suggestions</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{success.suggestions}</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function CustomBriefcaseIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
