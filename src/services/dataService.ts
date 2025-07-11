import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Board, Mill, ServicePartner, ServiceRecord, ServiceRequest, User } from '../types';

// Collection names
const COLLECTIONS = {
  BOARDS: 'boards',
  MILLS: 'mills',
  SERVICE_PARTNERS: 'servicePartners',
  SERVICE_RECORDS: 'serviceRecords',
  SERVICE_REQUESTS: 'serviceRequests',
  USERS: 'users'
};

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};

// Helper function to convert Date to Firestore timestamp
const convertToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Helper function to prepare data for Firestore (convert dates to timestamps)
const prepareForFirestore = (data: any): any => {
  const prepared = { ...data };
  
  // Convert Date objects to Firestore Timestamps
  Object.keys(prepared).forEach(key => {
    if (prepared[key] instanceof Date) {
      prepared[key] = convertToTimestamp(prepared[key]);
    }
    // Handle nested objects (like serviceHistory)
    if (Array.isArray(prepared[key])) {
      prepared[key] = prepared[key].map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          return prepareForFirestore(item);
        }
        return item;
      });
    }
  });
  
  return prepared;
};

// Helper function to convert Firestore data back to our types
const convertFromFirestore = (doc: any): any => {
  const data = { ...doc.data(), id: doc.id };
  
  // Convert Firestore timestamps back to Date objects
  Object.keys(data).forEach(key => {
    if (data[key] && typeof data[key] === 'object' && data[key].toDate) {
      data[key] = convertTimestamp(data[key]);
    }
    // Handle nested objects (like serviceHistory)
    if (Array.isArray(data[key])) {
      data[key] = data[key].map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(nestedKey => {
            if (item[nestedKey] && typeof item[nestedKey] === 'object' && item[nestedKey].toDate) {
              item[nestedKey] = convertTimestamp(item[nestedKey]);
            }
          });
        }
        return item;
      });
    }
  });
  
  return data;
};

class DataService {
  private boards: Board[] = [];
  private mills: Mill[] = [];
  private servicePartners: ServicePartner[] = [];
  private serviceRecords: ServiceRecord[] = [];
  private serviceRequests: ServiceRequest[] = [];
  private users: User[] = [];

  // Listeners for real-time updates
  private unsubscribeBoards?: () => void;
  private unsubscribeMills?: () => void;
  private unsubscribeServicePartners?: () => void;
  private unsubscribeUsers?: () => void;

  constructor() {
    this.initializeListeners();
  }

  private initializeListeners() {
    // Set up real-time listeners for all collections
    this.unsubscribeBoards = onSnapshot(
      collection(db, COLLECTIONS.BOARDS),
      (snapshot) => {
        this.boards = snapshot.docs.map(doc => convertFromFirestore(doc) as Board);
      },
      (error) => console.error('Error listening to boards:', error)
    );

    this.unsubscribeMills = onSnapshot(
      collection(db, COLLECTIONS.MILLS),
      (snapshot) => {
        this.mills = snapshot.docs.map(doc => convertFromFirestore(doc) as Mill);
      },
      (error) => console.error('Error listening to mills:', error)
    );

    this.unsubscribeServicePartners = onSnapshot(
      collection(db, COLLECTIONS.SERVICE_PARTNERS),
      (snapshot) => {
        this.servicePartners = snapshot.docs.map(doc => convertFromFirestore(doc) as ServicePartner);
      },
      (error) => console.error('Error listening to service partners:', error)
    );

    this.unsubscribeUsers = onSnapshot(
      collection(db, COLLECTIONS.USERS),
      (snapshot) => {
        this.users = snapshot.docs.map(doc => convertFromFirestore(doc) as User);
      },
      (error) => console.error('Error listening to users:', error)
    );
  }

  // Cleanup listeners
  destroy() {
    if (this.unsubscribeBoards) this.unsubscribeBoards();
    if (this.unsubscribeMills) this.unsubscribeMills();
    if (this.unsubscribeServicePartners) this.unsubscribeServicePartners();
    if (this.unsubscribeUsers) this.unsubscribeUsers();
  }

  // Board operations
  getBoards(): Board[] {
    return [...this.boards];
  }

  getBoardById(id: string): Board | undefined {
    return this.boards.find(board => board.id === id);
  }

  async addBoard(board: Omit<Board, 'id'>): Promise<Board> {
    try {
      const boardData = prepareForFirestore(board);
      const docRef = await addDoc(collection(db, COLLECTIONS.BOARDS), boardData);
      const newBoard: Board = { ...board, id: docRef.id };
      return newBoard;
    } catch (error) {
      console.error('Error adding board:', error);
      throw error;
    }
  }

  async updateBoard(id: string, updates: Partial<Board>): Promise<Board | null> {
    try {
      const boardRef = doc(db, COLLECTIONS.BOARDS, id);
      const updateData = prepareForFirestore(updates);
      await updateDoc(boardRef, updateData);
      
      const updatedBoard = this.boards.find(board => board.id === id);
      return updatedBoard ? { ...updatedBoard, ...updates } : null;
    } catch (error) {
      console.error('Error updating board:', error);
      throw error;
    }
  }

  async deleteBoard(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.BOARDS, id));
      return true;
    } catch (error) {
      console.error('Error deleting board:', error);
      return false;
    }
  }

  // Mill operations
  getMills(): Mill[] {
    return [...this.mills];
  }

  async addMill(mill: Omit<Mill, 'id'>): Promise<Mill> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.MILLS), mill);
      const newMill: Mill = { ...mill, id: docRef.id };
      return newMill;
    } catch (error) {
      console.error('Error adding mill:', error);
      throw error;
    }
  }

  async updateMill(id: string, updates: Partial<Mill>): Promise<Mill | null> {
    try {
      const millRef = doc(db, COLLECTIONS.MILLS, id);
      await updateDoc(millRef, updates);
      
      const updatedMill = this.mills.find(mill => mill.id === id);
      return updatedMill ? { ...updatedMill, ...updates } : null;
    } catch (error) {
      console.error('Error updating mill:', error);
      throw error;
    }
  }

  async deleteMill(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.MILLS, id));
      return true;
    } catch (error) {
      console.error('Error deleting mill:', error);
      return false;
    }
  }

  // Service Partner operations
  getServicePartners(): ServicePartner[] {
    return [...this.servicePartners];
  }

  async addServicePartner(partner: Omit<ServicePartner, 'id'>): Promise<ServicePartner> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.SERVICE_PARTNERS), partner);
      const newPartner: ServicePartner = { ...partner, id: docRef.id };
      return newPartner;
    } catch (error) {
      console.error('Error adding service partner:', error);
      throw error;
    }
  }

  async updateServicePartner(id: string, updates: Partial<ServicePartner>): Promise<ServicePartner | null> {
    try {
      const partnerRef = doc(db, COLLECTIONS.SERVICE_PARTNERS, id);
      await updateDoc(partnerRef, updates);
      
      const updatedPartner = this.servicePartners.find(partner => partner.id === id);
      return updatedPartner ? { ...updatedPartner, ...updates } : null;
    } catch (error) {
      console.error('Error updating service partner:', error);
      throw error;
    }
  }

  async deleteServicePartner(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.SERVICE_PARTNERS, id));
      return true;
    } catch (error) {
      console.error('Error deleting service partner:', error);
      return false;
    }
  }

  // Service Request operations
  getServiceRequests(): ServiceRequest[] {
    return [...this.serviceRequests];
  }

  async addServiceRequest(request: Omit<ServiceRequest, 'id'>): Promise<ServiceRequest> {
    try {
      const requestData = prepareForFirestore(request);
      const docRef = await addDoc(collection(db, COLLECTIONS.SERVICE_REQUESTS), requestData);
      const newRequest: ServiceRequest = { ...request, id: docRef.id };
      return newRequest;
    } catch (error) {
      console.error('Error adding service request:', error);
      throw error;
    }
  }

  async updateServiceRequest(id: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest | null> {
    try {
      const requestRef = doc(db, COLLECTIONS.SERVICE_REQUESTS, id);
      const updateData = prepareForFirestore(updates);
      await updateDoc(requestRef, updateData);
      
      const updatedRequest = this.serviceRequests.find(request => request.id === id);
      return updatedRequest ? { ...updatedRequest, ...updates } : null;
    } catch (error) {
      console.error('Error updating service request:', error);
      throw error;
    }
  }

  // User operations
  getUsers(): User[] {
    return [...this.users];
  }

  async addUser(user: Omit<User, 'id'>): Promise<User> {
    try {
      const userData = prepareForFirestore(user);
      const docRef = await addDoc(collection(db, COLLECTIONS.USERS), userData);
      const newUser: User = { ...user, id: docRef.id };
      return newUser;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, id);
      const updateData = prepareForFirestore(updates);
      await updateDoc(userRef, updateData);
      
      const updatedUser = this.users.find(user => user.id === id);
      return updatedUser ? { ...updatedUser, ...updates } : null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, id));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Authentication
  authenticateUser(email: string, password: string): User | null {
    // Find user by email
    const user = this.users.find(u => u.email === email);
    if (!user) return null;
    
    // In production, use proper password hashing and validation
    // For now, we'll check against a simple pattern or allow any password for existing users
    if (user.status === 'Active') {
      // Update last login
      this.updateUser(user.id, { lastLogin: new Date() });
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
  async createInitialAdminUser(): Promise<User> {
    if (this.users.length === 0) {
      const adminUser: Omit<User, 'id'> = {
        email: 'admin@smw.com',
        name: 'System Administrator',
        role: 'Admin',
        status: 'Active',
        createdAt: new Date()
      };
      return await this.addUser(adminUser);
    }
    return this.users[0];
  }

  // Batch operations for better performance
  async batchAddBoards(boards: Omit<Board, 'id'>[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      boards.forEach(board => {
        const boardRef = doc(collection(db, COLLECTIONS.BOARDS));
        const boardData = prepareForFirestore(board);
        batch.set(boardRef, boardData);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error batch adding boards:', error);
      throw error;
    }
  }

  // Export data for backup
  async exportAllData() {
    try {
      return {
        boards: this.boards,
        mills: this.mills,
        servicePartners: this.servicePartners,
        users: this.users,
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }
}

export const dataService = new DataService();

// Cleanup on app unmount
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    dataService.destroy();
  });
}