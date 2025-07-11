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
    // Initialize Mills
    this.mills = [
      {
        id: '1',
        name: 'Mill 1 - Production Unit A',
        location: 'Industrial Area, Sector 1',
        contactPerson: 'Rajesh Kumar',
        phone: '+91-9876543210',
        email: 'rajesh@mill1.com'
      },
      {
        id: '2',
        name: 'Mill 2 - Production Unit B',
        location: 'Industrial Area, Sector 2',
        contactPerson: 'Suresh Patel',
        phone: '+91-9876543211',
        email: 'suresh@mill2.com'
      },
      {
        id: '3',
        name: 'Mill 3 - Production Unit C',
        location: 'Industrial Area, Sector 3',
        contactPerson: 'Amit Singh',
        phone: '+91-9876543212',
        email: 'amit@mill3.com'
      },
      {
        id: '4',
        name: 'Mill 4 - Quality Control',
        location: 'Industrial Area, Sector 4',
        contactPerson: 'Priya Sharma',
        phone: '+91-9876543213',
        email: 'priya@mill4.com'
      }
    ];

    // Initialize Service Partners
    this.servicePartners = [
      {
        id: '1',
        name: 'Super Electronics',
        contactPerson: 'Vikram Mehta',
        phone: '+91-9876543220',
        email: 'service@superelectronics.com',
        address: 'Electronics Hub, Phase 1, Gurgaon',
        rating: 4.5,
        avgRepairTime: 5,
        specialization: ['Power Supply', 'Control Boards', 'Display Units']
      },
      {
        id: '2',
        name: 'Sheltronics',
        contactPerson: 'Ravi Gupta',
        phone: '+91-9876543221',
        email: 'support@sheltronics.com',
        address: 'Tech Park, Sector 18, Noida',
        rating: 4.2,
        avgRepairTime: 6,
        specialization: ['Sensor Boards', 'Communication Modules']
      },
      {
        id: '3',
        name: 'TechFix Solutions',
        contactPerson: 'Anita Verma',
        phone: '+91-9876543222',
        email: 'repairs@techfixsolutions.com',
        address: 'Industrial Complex, Faridabad',
        rating: 4.0,
        avgRepairTime: 7,
        specialization: ['Motor Controllers', 'Safety Systems']
      },
      {
        id: '4',
        name: 'ElectroServ India',
        contactPerson: 'Manoj Agarwal',
        phone: '+91-9876543223',
        email: 'service@electroserv.in',
        address: 'Electronic City, Bangalore',
        rating: 4.3,
        avgRepairTime: 5,
        specialization: ['All Types', 'Emergency Repairs']
      }
    ];

    // Initialize Users
    this.users = [
      {
        id: '1',
        email: 'admin@smw.com',
        name: 'System Administrator',
        role: 'Admin',
        status: 'Active',
        lastLogin: new Date(),
        createdAt: new Date('2024-01-01')
      },
      {
        id: '2',
        email: 'mill1@smw.com',
        name: 'Rajesh Kumar',
        role: 'Mill Supervisor',
        status: 'Active',
        mill: 'Mill 1 - Production Unit A',
        lastLogin: new Date(),
        createdAt: new Date('2024-01-15')
      },
      {
        id: '3',
        email: 'service@superelectronics.com',
        name: 'Vikram Mehta',
        role: 'Service Partner',
        status: 'Active',
        servicePartner: 'Super Electronics',
        lastLogin: new Date(),
        createdAt: new Date('2024-02-01')
      }
    ];

    // Initialize Boards
    const currentDate = new Date();
    this.boards = [
      {
        id: '1',
        boardId: 'SMW-B-001',
        currentStatus: 'In Use',
        currentLocation: 'Mill 1 - Production Unit A',
        millAssigned: 'Mill 1 - Production Unit A',
        warrantyStatus: 'Under Service Warranty',
        warrantyExpiry: new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate()),
        purchaseDate: new Date(currentDate.getFullYear() - 1, 0, 15),
        serviceHistory: [],
        createdAt: currentDate,
        updatedAt: currentDate
      },
      {
        id: '2',
        boardId: 'SMW-B-002',
        currentStatus: 'Sent for Service',
        currentLocation: 'Super Electronics',
        millAssigned: 'Mill 2 - Production Unit B',
        warrantyStatus: 'Under Service Warranty',
        warrantyExpiry: new Date(currentDate.getFullYear() + 1, currentDate.getMonth() + 2, currentDate.getDate()),
        purchaseDate: new Date(currentDate.getFullYear() - 1, 1, 20),
        serviceHistory: [],
        substituteBoard: 'SMW-S-001',
        createdAt: currentDate,
        updatedAt: new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        id: '3',
        boardId: 'SMW-B-003',
        currentStatus: 'In Repair',
        currentLocation: 'Sheltronics',
        millAssigned: 'Mill 3 - Production Unit C',
        warrantyStatus: 'Under Replacement Warranty',
        warrantyExpiry: new Date(currentDate.getFullYear() + 2, currentDate.getMonth(), currentDate.getDate()),
        purchaseDate: new Date(currentDate.getFullYear() - 1, 2, 10),
        serviceHistory: [],
        substituteBoard: 'SMW-S-002',
        createdAt: currentDate,
        updatedAt: new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        id: '4',
        boardId: 'SMW-B-004',
        currentStatus: 'Repaired',
        currentLocation: 'TechFix Solutions',
        millAssigned: 'Mill 1 - Production Unit A',
        warrantyStatus: 'Under Service Warranty',
        warrantyExpiry: new Date(currentDate.getFullYear() + 1, currentDate.getMonth() + 6, currentDate.getDate()),
        purchaseDate: new Date(currentDate.getFullYear() - 1, 3, 5),
        serviceHistory: [],
        substituteBoard: 'SMW-S-003',
        createdAt: currentDate,
        updatedAt: new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        id: '5',
        boardId: 'SMW-B-005',
        currentStatus: 'In Use',
        currentLocation: 'Mill 4 - Quality Control',
        millAssigned: 'Mill 4 - Quality Control',
        warrantyStatus: 'Out of Warranty',
        warrantyExpiry: new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate()),
        purchaseDate: new Date(currentDate.getFullYear() - 3, 4, 12),
        serviceHistory: [],
        createdAt: currentDate,
        updatedAt: currentDate
      },
      // Substitute Boards
      {
        id: '6',
        boardId: 'SMW-S-001',
        currentStatus: 'In Use',
        currentLocation: 'Mill 2 - Production Unit B',
        millAssigned: 'Mill 2 - Production Unit B',
        warrantyStatus: 'Under Service Warranty',
        warrantyExpiry: new Date(currentDate.getFullYear() + 1, currentDate.getMonth() + 8, currentDate.getDate()),
        purchaseDate: new Date(currentDate.getFullYear() - 1, 5, 1),
        serviceHistory: [],
        createdAt: currentDate,
        updatedAt: currentDate
      },
      {
        id: '7',
        boardId: 'SMW-S-002',
        currentStatus: 'In Use',
        currentLocation: 'Mill 3 - Production Unit C',
        millAssigned: 'Mill 3 - Production Unit C',
        warrantyStatus: 'Under Service Warranty',
        warrantyExpiry: new Date(currentDate.getFullYear() + 1, currentDate.getMonth() + 9, currentDate.getDate()),
        purchaseDate: new Date(currentDate.getFullYear() - 1, 6, 15),
        serviceHistory: [],
        createdAt: currentDate,
        updatedAt: currentDate
      },
      {
        id: '8',
        boardId: 'SMW-S-003',
        currentStatus: 'In Use',
        currentLocation: 'Mill 1 - Production Unit A',
        millAssigned: 'Mill 1 - Production Unit A',
        warrantyStatus: 'Under Service Warranty',
        warrantyExpiry: new Date(currentDate.getFullYear() + 1, currentDate.getMonth() + 10, currentDate.getDate()),
        purchaseDate: new Date(currentDate.getFullYear() - 1, 7, 20),
        serviceHistory: [],
        createdAt: currentDate,
        updatedAt: currentDate
      },
      {
        id: '9',
        boardId: 'SMW-S-004',
        currentStatus: 'In Use',
        currentLocation: 'Available Pool',
        millAssigned: 'Available Pool',
        warrantyStatus: 'Under Service Warranty',
        warrantyExpiry: new Date(currentDate.getFullYear() + 1, currentDate.getMonth() + 11, currentDate.getDate()),
        purchaseDate: new Date(currentDate.getFullYear() - 1, 8, 25),
        serviceHistory: [],
        createdAt: currentDate,
        updatedAt: currentDate
      }
    ];
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
    // Simple authentication - in production, use proper password hashing
    if (email === 'admin@smw.com' && password === 'admin123') {
      return this.users.find(user => user.email === email) || null;
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
}

export const dataService = new DataService();