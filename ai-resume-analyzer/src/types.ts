export type Role = 'SEEKER' | 'RECRUITER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Job {
  id: number;
  recruiter_id: number;
  title: string;
  description: string;
  skills: string;
}

export interface Application {
  id: number;
  job_id: number;
  user_id: number;
  status: 'SELECTED' | 'REJECTED' | 'PENDING';
  ats_score: number;
  match_percentage: number;
  analysis_result: string;
  applicant_name?: string;
  job_title?: string;
}
