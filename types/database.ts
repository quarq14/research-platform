export interface Organization {
  id: string;
  name: string;
  owner: string;
  created_at: string;
}

export interface OrgMember {
  org_id: string;
  user_id: string;
  role: string;
}

export interface Project {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  status: string;
  created_by: string;
  created_at: string;
}

export interface Participant {
  id: string;
  project_id: string;
  code: string;
  contact_encrypted?: string;
  created_at: string;
}

export interface Consent {
  id: string;
  project_id: string;
  participant_id: string;
  version: string;
  consent_text?: string;
  consent_pdf_url?: string;
  signed_at?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface Survey {
  id: string;
  project_id: string;
  name: string;
  status: string;
}

export interface SurveyVersion {
  id: string;
  survey_id: string;
  version: number;
  json_def: any;
  created_at: string;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  version_id: string;
  participant_id: string;
  submitted_at: string;
  data: any;
  meta: any;
}

export interface Dataset {
  id: string;
  project_id: string;
  name: string;
  source?: string;
  storage_url?: string;
  schema?: any;
  created_at: string;
}

export interface Analysis {
  id: string;
  project_id: string;
  dataset_id?: string;
  type: string;
  spec?: any;
  status: string;
  result_json?: any;
  created_at: string;
  started_at?: string;
  finished_at?: string;
}

export interface Job {
  id: string;
  analysis_id: string;
  kind: string;
  payload?: any;
  status: string;
  logs?: string;
  created_at: string;
  finished_at?: string;
}

export interface Report {
  id: string;
  project_id: string;
  analysis_id?: string;
  format: string;
  storage_url?: string;
  created_at: string;
}

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: any;
  max_projects: number;
  max_surveys: number;
  max_responses: number;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  provider: string;
  provider_subscription_id?: string;
  created_at: string;
  expires_at?: string;
}
