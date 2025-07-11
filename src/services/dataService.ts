import { Board, Mill, ServicePartner, ServiceRecord, ServiceRequest, User } from '../types';

// Mock data storage - In production, this would connect to a real database
class DataService {
  private boards: Board[] = [];
  private mills: Mill[] = [];
  private servicePartners: ServicePartner[] = [];
  private serviceRecords: ServiceRecord[] = [];
  private serviceRequests: ServiceRequest[] = [];
  private users: User[] = [];

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize with empty arrays - no dummy data
    this.mills = [];
    this.servicePartners = [];
    this.users = [];
    this.boards = [];
    this.serviceRecords = [];
    this.serviceRequests = [];
  }

  // Board operations
  getBoards(): Board[] {
    return [...this.boards];
  }

  getBoardById(id: string): Board | undefined {
    return this.boards.find(board => board.id === id);
  }

  addBoard(board: Omit<Board, 'id'>): Board {
    const newBoard: Board = {
      ...board,
      id: Date.now().toString(),
    };
    this.boards.push(newBoard);
    return newBoard;
  }

  updateBoard(id: string, updates: Partial<Board>): Board | null {
    const index = this.boards.findIndex(board => board.id === id);
    if (index === -1) return null;
    
    this.boards[index] = { ...this.boards[index], ...updates, updatedAt: new Date() };
    return this.boards[index];
  }

  deleteBoard(id: string): boolean {
    const index = this.boards.findIndex(board => board.id === id);
    if (index === -1) return false;
    
    this.boards.splice(index, 1);
    return true;
  }

  // Mill operations
  getMills(): Mill[] {
    return [...this.mills];
  }

  addMill(mill: Omit<Mill, 'id'>): Mill {
    const newMill: Mill = {
      ...mill,
      id: Date.now().toString(),
    };
    this.mills.push(newMill);
    return newMill;
  }

  updateMill(id: string, updates: Partial<Mill>): Mill | null {
    const index = this.mills.findIndex(mill => mill.id === id);
    if (index === -1) return null;
    
    this.mills[index] = { ...this.mills[index], ...updates };
    return this.mills[index];
  }

  deleteMill(id: string): boolean {
    const index = this.mills.findIndex(mill => mill.id === id);
    if (index === -1) return false;
    
    this.mills.splice(index, 1);
    return true;
  }

  // Service Partner operations
  getServicePartners(): ServicePartner[] {
    return [...this.servicePartners];
  }

  addServicePartner(partner: Omit<ServicePartner, 'id'>): ServicePartner {
    const newPartner: ServicePartner = {
      ...partner,
      id: Date.now().toString(),
    };
    this.servicePartners.push(newPartner);
    return newPartner;
  }

  updateServicePartner(id: string, updates: Partial<ServicePartner>): ServicePartner | null {
    const index = this.servicePartners.findIndex(partner => partner.id === id);
    if (index === -1) return null;
    
    this.servicePartners[index] = { ...this.servicePartners[index], ...updates };
    return this.servicePartners[index];
  }

  deleteServicePartner(id: string): boolean {
    const index = this.servicePartners.findIndex(partner => partner.id === id);
    if (index === -1) return false;
    
    this.servicePartners.splice(index, 1);
    return true;
  }

  // Service Request operations
  getServiceRequests(): ServiceRequest[] {
    return [...this.serviceRequests];
  }

  addServiceRequest(request: Omit<ServiceRequest, 'id'>): ServiceRequest {
    const newRequest: ServiceRequest = {
      ...request,
      id: Date.now().toString(),
    };
    this.serviceRequests.push(newRequest);
    return newRequest;
  }

  updateServiceRequest(id: string, updates: Partial<ServiceRequest>): ServiceRequest | null {
    const index = this.serviceRequests.findIndex(request => request.id === id);
    if (index === -1) return null;
    
    this.serviceRequests[index] = { ...this.serviceRequests[index], ...updates, updatedAt: new Date() };
    return this.serviceRequests[index];
  }

  // User operations
  getUsers(): User[] {
    return [...this.users];
  }

  addUser(user: Omit<User, 'id'>): User {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return null;
    
    this.users[index] = { ...this.users[index], ...updates };
    return this.users[index];
  }

  deleteUser(id: string): boolean {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return false;
    
    this.users.splice(index, 1);
    return true;
  }

  // Authentication
  authenticateUser(email: string, password: string): User | null {
    // Find user by email and validate password
    const user = this.users.find(u => u.email === email);
    if (!user) return null;
    
    // In production, use proper password hashing and validation
    // For now, we'll check against a simple pattern or allow any password for existing users
    if (user.status === 'Active') {
      // Update last login
      user.lastLogin = new Date();
      return user;
    }
    
    return null;
  }

  // Dashboard statistics
  getDashboardStats() {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    return {
      totalBoards: this.boards.length,
      activeBoards: this.boards.filter(b => b.currentStatus === 'In Use').length,
      inService: this.boards.filter(b => b.currentStatus === 'Sent for Service').length,
      inRepair: this.boards.filter(b => b.currentStatus === 'In Repair').length,
      repaired: this.boards.filter(b => b.currentStatus === 'Repaired').length,
      substituteActive: this.boards.filter(b => b.substituteBoard).length,
      overdueReturns: this.boards.filter(b => 
        (b.currentStatus === 'Sent for Service' || b.currentStatus === 'In Repair') && 
        b.updatedAt < fourteenDaysAgo
      ).length,
      warrantyExpiring: this.boards.filter(b => 
        b.warrantyExpiry <= thirtyDaysFromNow && b.warrantyExpiry > now
      ).length
    };
  }

  // Helper method to create initial admin user if no users exist
  createInitialAdminUser(): User {
    if (this.users.length === 0) {
      const adminUser: User = {
        id: '1',
        email: 'admin@smw.com',
        name: 'System Administrator',
        role: 'Admin',
        status: 'Active',
        createdAt: new Date()
      };
      this.users.push(adminUser);
      return adminUser;
    }
    return this.users[0];
  }
}

export const dataService = new DataService();