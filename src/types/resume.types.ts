export interface ParsedResume {
  personalInfo: PersonalInfo;
  summary?: string;
  experience: WorkExperience[];
  education: Education[];
  skills: Skills;
  certifications?: Certification[];
  languages?: Language[];
  projects?: Project[];
  achievements?: string[];
}

export interface PersonalInfo {
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  location?: string;
  description: string[];
  achievements?: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  achievements?: string[];
}

export interface Skills {
  technical: string[];
  soft: string[];
  tools?: string[];
  frameworks?: string[];
  languages?: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  date?: string;
  expiryDate?: string;
  credentialId?: string;
}

export interface Language {
  name: string;
  proficiency: 'Basic' | 'Intermediate' | 'Advanced' | 'Native';
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  githubUrl?: string;
  startDate?: string;
  endDate?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
}

export type CustomParsingStructure = Record<string, any>;

export interface ParseResumeRequest {
  customStructure?: CustomParsingStructure;
}
