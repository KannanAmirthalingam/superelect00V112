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
  serviceDate: Date;
  issueReported: string;
  servicePartner: string;
  actionTaken: string;
  timeTaken: number; // in days
  cost?: number;
  status: 'Completed' | 'In Progress' | 'Cancelled';
}

export interface Mill {
  id: string;
  name: string;
  location: string;
  contactPerson: string;
  phone: string;
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
}