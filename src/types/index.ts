export interface Board {
  id: string;
  boardId: string;
  currentStatus: 'In Use' | 'Sent for Service' | 'In Repair' | 'Repaired' | 'Replaced' | 'Returned';
  currentLocation: string;
  millAssigned: string;
  warrantyStatus: 'Under Service Warranty' | 'Under Replacement Warranty' | 'Out of Warranty';
  warrantyExpiry: Date;
  purchaseDate: Date;
  serviceHistory: ServiceRecord[];
  substituteBoard?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceRecord {
  id: string;
  boardId: string;
  serviceDate: Date;
  issueReported: string;
  servicePartner: string;
  actionTaken: string;
  timeTaken: number; // in days
  cost?: number;
  status: 'Completed' | 'In Progress' | 'Cancelled';
  priority: 'High' | 'Medium' | 'Low';
  substituteBoard?: string;
}

export interface Mill {
  id: string;
  name: string;
  location: string;
  contactPerson: string;
  phone: string;
  email?: string;
}

export interface ServicePartner {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  rating: number;
  avgRepairTime: number;
  specialization?: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Mill Supervisor' | 'Service Partner' | 'Viewer';
  status: 'Active' | 'Inactive';
  mill?: string;
  servicePartner?: string;
  lastLogin?: Date;
  createdAt: Date;
}

export interface ServiceRequest {
  id: string;
  boardId: string;
  millName: string;
  issueReported: string;
  servicePartner: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'High' | 'Medium' | 'Low';
  dateRequested: Date;
  expectedCompletion: Date;
  actualCompletion?: Date;
  substituteBoard?: string;
  cost?: number;
  notes?: string;
  createdBy: string;
  updatedAt: Date;
}

export interface DashboardStats {
  totalBoards: number;
  activeBoards: number;
  inService: number;
  inRepair: number;
  repaired: number;
  substituteActive: number;
  overdueReturns: number;
  warrantyExpiring: number;
}