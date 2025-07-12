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
  writeBatch,
  getDoc,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Board, Mill, ServicePartner, ServiceRecord, ServiceRequest, User, DashboardStats } from '../types';

// Collection names
const COLLECTIONS = {
  BOARDS: 'boards',
  MILLS: 'mills',
  SERVICE_PARTNERS: 'servicePartners',
  SERVICE_RECORDS: 'serviceRecords',
  SERVICE_REQUESTS: 'serviceRequests',
  USERS: 'users'
} as const;

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return new Date();
};

// Helper function to convert Date to Firestore timestamp
const convertToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Helper function to prepare data for Firestore (convert dates to timestamps)
const prepareForFirestore = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const prepared = { ...data };
  
  // Convert Date objects to Firestore Timestamps
  Object.keys(prepared).forEach(key => {
    if (prepared[key] instanceof Date) {
      prepared[key] = convertToTimestamp(prepared[key]);
    }
    // Handle nested objects (like serviceHistory)
    else if (Array.isArray(prepared[key])) {
      prepared[key] = prepared[key].map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          return prepareForFirestore(item);
        }
        return item;
      });
    }
    // Handle nested objects
    else if (typeof prepared[key] === 'object' && prepared[key] !== null && !prepared[key].toDate) {
      prepared[key] = prepareForFirestore(prepared[key]);
    }
  });
  
  return prepared;
};

// Helper function to convert Firestore data back to our types
const convertFromFirestore = (doc: any): any => {
  if (!doc.exists()) return null;
  
  const data = { ...doc.data(), id: doc.id };
  
  // Convert Firestore timestamps back to Date objects
  Object.keys(data).forEach(key => {
    if (data[key] && typeof data[key] === 'object' && data[key].toDate) {
      data[key] = convertTimestamp(data[key]);
    }
    // Handle nested objects (like serviceHistory)
    else if (Array.isArray(data[key])) {
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
    // Handle nested objects
    else if (typeof data[key] === 'object' && data[key] !== null && !data[key].toDate) {
      Object.keys(data[key]).forEach(nestedKey => {
        if (data[key][nestedKey] && typeof data[key][nestedKey] === 'object' && data[key][nestedKey].toDate) {
          data[key][nestedKey] = convertTimestamp(data[key][nestedKey]);
        }
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
  private isInitialized = false;
  private connectionStatus = 'connecting';

  // Listeners for real-time updates
  private unsubscribeBoards?: () => void;
  private unsubscribeMills?: () => void;
  private unsubscribeServicePartners?: () => void;
  private unsubscribeUsers?: () => void;
  private unsubscribeServiceRequests?: () => void;

  constructor() {
    this.initializeListeners();
  }

  private async initializeListeners() {
    try {
      console.log('🔥 Initializing Firebase listeners...');
      
      // Test Firebase connection
      await this.testConnection();
      
      // Set up real-time listeners for all collections
      this.unsubscribeBoards = onSnapshot(
        collection(db, COLLECTIONS.BOARDS),
        (snapshot) => {
          console.log('📋 Boards updated:', snapshot.size, 'documents');
          this.boards = snapshot.docs.map(doc => convertFromFirestore(doc) as Board).filter(Boolean);
          this.connectionStatus = 'connected';
        },
        (error) => {
          console.error('❌ Error listening to boards:', error);
          this.connectionStatus = 'error';
        }
      );

      this.unsubscribeMills = onSnapshot(
        collection(db, COLLECTIONS.MILLS),
        (snapshot) => {
          console.log('🏭 Mills updated:', snapshot.size, 'documents');
          this.mills = snapshot.docs.map(doc => convertFromFirestore(doc) as Mill).filter(Boolean);
        },
        (error) => {
          console.error('❌ Error listening to mills:', error);
        }
      );

      this.unsubscribeServicePartners = onSnapshot(
        collection(db, COLLECTIONS.SERVICE_PARTNERS),
        (snapshot) => {
          console.log('🔧 Service Partners updated:', snapshot.size, 'documents');
          this.servicePartners = snapshot.docs.map(doc => convertFromFirestore(doc) as ServicePartner).filter(Boolean);
        },
        (error) => {
          console.error('❌ Error listening to service partners:', error);
        }
      );

      this.unsubscribeUsers = onSnapshot(
        collection(db, COLLECTIONS.USERS),
        (snapshot) => {
          console.log('👥 Users updated:', snapshot.size, 'documents');
          this.users = snapshot.docs.map(doc => convertFromFirestore(doc) as User).filter(Boolean);
        },
        (error) => {
          console.error('❌ Error listening to users:', error);
        }
      );

      this.unsubscribeServiceRequests = onSnapshot(
        collection(db, COLLECTIONS.SERVICE_REQUESTS),
        (snapshot) => {
          console.log('📝 Service Requests updated:', snapshot.size, 'documents');
          this.serviceRequests = snapshot.docs.map(doc => convertFromFirestore(doc) as ServiceRequest).filter(Boolean);
        },
        (error) => {
          console.error('❌ Error listening to service requests:', error);
        }
      );

      this.isInitialized = true;
      console.log('✅ Firebase listeners initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Firebase listeners:', error);
      this.connectionStatus = 'error';
    }
  }

  private async testConnection(): Promise<void> {
    try {
      console.log('🧪 Testing Firebase connection...');
      const testCollection = collection(db, 'test');
      await getDocs(query(testCollection));
      console.log('✅ Firebase connection successful');
      this.connectionStatus = 'connected';
    } catch (error) {
      console.error('❌ Firebase connection failed:', error);
      this.connectionStatus = 'error';
      throw error;
    }
  }

  // Connection status
  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  // Cleanup listeners
  destroy() {
    console.log('🧹 Cleaning up Firebase listeners...');
    if (this.unsubscribeBoards) this.unsubscribeBoards();
    if (this.unsubscribeMills) this.unsubscribeMills();
    if (this.unsubscribeServicePartners) this.unsubscribeServicePartners();
    if (this.unsubscribeUsers) this.unsubscribeUsers();
    if (this.unsubscribeServiceRequests) this.unsubscribeServiceRequests();
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
      console.log('➕ Adding new board:', board.boardId);
      const boardData = prepareForFirestore(board);
      const docRef = await addDoc(collection(db, COLLECTIONS.BOARDS), boardData);
      const newBoard: Board = { ...board, id: docRef.id };
      console.log('✅ Board added successfully:', docRef.id);
      return newBoard;
    } catch (error) {
      console.error('❌ Error adding board:', error);
      throw new Error(`Failed to add board: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateBoard(id: string, updates: Partial<Board>): Promise<Board | null> {
    try {
      console.log('📝 Updating board:', id);
      
      // Get the current board from local cache
      const currentBoard = this.boards.find(board => board.id === id);
      if (!currentBoard) {
        console.log('❌ Board not found in local cache:', id);
        return null;
      }
      
      const boardRef = doc(db, COLLECTIONS.BOARDS, id);
      const updateData = prepareForFirestore(updates);
      await updateDoc(boardRef, updateData);
      
      // Create the updated board object
      const updatedBoard = { ...currentBoard, ...updates };
      console.log('✅ Board updated successfully:', id);
      return updatedBoard;
    } catch (error) {
      console.error('❌ Error updating board:', error);
      throw new Error(`Failed to update board: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteBoard(id: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting board:', id);
      await deleteDoc(doc(db, COLLECTIONS.BOARDS, id));
      console.log('✅ Board deleted successfully:', id);
      return true;
    } catch (error) {
      console.error('❌ Error deleting board:', error);
      return false;
    }
  }

  // Mill operations
  getMills(): Mill[] {
    return [...this.mills];
  }

  async addMill(mill: Omit<Mill, 'id'>): Promise<Mill> {
    try {
      console.log('➕ Adding new mill:', mill.name);
      const docRef = await addDoc(collection(db, COLLECTIONS.MILLS), mill);
      const newMill: Mill = { ...mill, id: docRef.id };
      console.log('✅ Mill added successfully:', docRef.id);
      return newMill;
    } catch (error) {
      console.error('❌ Error adding mill:', error);
      throw new Error(`Failed to add mill: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateMill(id: string, updates: Partial<Mill>): Promise<Mill | null> {
    try {
      console.log('📝 Updating mill:', id);
      const millRef = doc(db, COLLECTIONS.MILLS, id);
      await updateDoc(millRef, updates);
      
      const updatedMill = this.mills.find(mill => mill.id === id);
      console.log('✅ Mill updated successfully:', id);
      return updatedMill ? { ...updatedMill, ...updates } : null;
    } catch (error) {
      console.error('❌ Error updating mill:', error);
      throw new Error(`Failed to update mill: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteMill(id: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting mill:', id);
      await deleteDoc(doc(db, COLLECTIONS.MILLS, id));
      console.log('✅ Mill deleted successfully:', id);
      return true;
    } catch (error) {
      console.error('❌ Error deleting mill:', error);
      return false;
    }
  }

  // Service Partner operations
  getServicePartners(): ServicePartner[] {
    return [...this.servicePartners];
  }

  async addServicePartner(partner: Omit<ServicePartner, 'id'>): Promise<ServicePartner> {
    try {
      console.log('➕ Adding new service partner:', partner.name);
      const docRef = await addDoc(collection(db, COLLECTIONS.SERVICE_PARTNERS), partner);
      const newPartner: ServicePartner = { ...partner, id: docRef.id };
      console.log('✅ Service partner added successfully:', docRef.id);
      return newPartner;
    } catch (error) {
      console.error('❌ Error adding service partner:', error);
      throw new Error(`Failed to add service partner: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateServicePartner(id: string, updates: Partial<ServicePartner>): Promise<ServicePartner | null> {
    try {
      console.log('📝 Updating service partner:', id);
      const partnerRef = doc(db, COLLECTIONS.SERVICE_PARTNERS, id);
      await updateDoc(partnerRef, updates);
      
      const updatedPartner = this.servicePartners.find(partner => partner.id === id);
      console.log('✅ Service partner updated successfully:', id);
      return updatedPartner ? { ...updatedPartner, ...updates } : null;
    } catch (error) {
      console.error('❌ Error updating service partner:', error);
      throw new Error(`Failed to update service partner: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteServicePartner(id: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting service partner:', id);
      await deleteDoc(doc(db, COLLECTIONS.SERVICE_PARTNERS, id));
      console.log('✅ Service partner deleted successfully:', id);
      return true;
    } catch (error) {
      console.error('❌ Error deleting service partner:', error);
      return false;
    }
  }

  // Service Request operations
  getServiceRequests(): ServiceRequest[] {
    return [...this.serviceRequests];
  }

  async addServiceRequest(request: Omit<ServiceRequest, 'id'>): Promise<ServiceRequest> {
    try {
      console.log('➕ Adding new service request for board:', request.boardId);
      const requestData = prepareForFirestore(request);
      const docRef = await addDoc(collection(db, COLLECTIONS.SERVICE_REQUESTS), requestData);
      const newRequest: ServiceRequest = { ...request, id: docRef.id };
      console.log('✅ Service request added successfully:', docRef.id);
      return newRequest;
    } catch (error) {
      console.error('❌ Error adding service request:', error);
      throw new Error(`Failed to add service request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateServiceRequest(id: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest | null> {
    try {
      console.log('📝 Updating service request:', id);
      const requestRef = doc(db, COLLECTIONS.SERVICE_REQUESTS, id);
      const updateData = prepareForFirestore(updates);
      await updateDoc(requestRef, updateData);
      
      const updatedRequest = this.serviceRequests.find(request => request.id === id);
      console.log('✅ Service request updated successfully:', id);
      return updatedRequest ? { ...updatedRequest, ...updates } : null;
    } catch (error) {
      console.error('❌ Error updating service request:', error);
      throw new Error(`Failed to update service request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // User operations
  getUsers(): User[] {
    return [...this.users];
  }

  async addUser(user: Omit<User, 'id'>): Promise<User> {
    try {
      console.log('➕ Adding new user:', user.email);
      const userData = prepareForFirestore(user);
      const docRef = await addDoc(collection(db, COLLECTIONS.USERS), userData);
      const newUser: User = { ...user, id: docRef.id };
      console.log('✅ User added successfully:', docRef.id);
      return newUser;
    } catch (error) {
      console.error('❌ Error adding user:', error);
      throw new Error(`Failed to add user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      console.log('📝 Updating user:', id);
      const userRef = doc(db, COLLECTIONS.USERS, id);
      const updateData = prepareForFirestore(updates);
      await updateDoc(userRef, updateData);
      
      const updatedUser = this.users.find(user => user.id === id);
      console.log('✅ User updated successfully:', id);
      return updatedUser ? { ...updatedUser, ...updates } : null;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting user:', id);
      await deleteDoc(doc(db, COLLECTIONS.USERS, id));
      console.log('✅ User deleted successfully:', id);
      return true;
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      return false;
    }
  }

  // Authentication
  async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      console.log('🔐 Authenticating user:', email);
      
      // Find user by email
      const user = this.users.find(u => u.email === email);
      if (!user) {
        console.log('❌ User not found:', email);
        return null;
      }
      
      if (user.status !== 'Active') {
        console.log('❌ User account is inactive:', email);
        return null;
      }
      
      // Update last login
      await this.updateUser(user.id, { lastLogin: new Date() });
      console.log('✅ User authenticated successfully:', email);
      return user;
      
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return null;
    }
  }

  // Dashboard statistics
  getDashboardStats(): DashboardStats {
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
    try {
      console.log('👑 Creating initial admin user...');
      
      if (this.users.length === 0) {
        const adminUser: Omit<User, 'id'> = {
          email: 'admin@smw.com',
          name: 'System Administrator',
          role: 'Admin',
          status: 'Active',
          createdAt: new Date()
        };
        const newUser = await this.addUser(adminUser);
        console.log('✅ Initial admin user created successfully');
        return newUser;
      }
      
      console.log('ℹ️ Admin user already exists');
      return this.users[0];
    } catch (error) {
      console.error('❌ Failed to create initial admin user:', error);
      throw error;
    }
  }

  // Batch operations for better performance
  async batchAddBoards(boards: Omit<Board, 'id'>[]): Promise<void> {
    try {
      console.log('📦 Batch adding boards:', boards.length);
      const batch = writeBatch(db);
      
      boards.forEach(board => {
        const boardRef = doc(collection(db, COLLECTIONS.BOARDS));
        const boardData = prepareForFirestore(board);
        batch.set(boardRef, boardData);
      });
      
      await batch.commit();
      console.log('✅ Batch add boards completed successfully');
    } catch (error) {
      console.error('❌ Error batch adding boards:', error);
      throw new Error(`Failed to batch add boards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Export data for backup
  async exportAllData() {
    try {
      console.log('📤 Exporting all data...');
      const exportData = {
        boards: this.boards,
        mills: this.mills,
        servicePartners: this.servicePartners,
        users: this.users.map(user => ({ ...user, password: undefined })), // Remove passwords from export
        serviceRequests: this.serviceRequests,
        exportDate: new Date().toISOString(),
        connectionStatus: this.connectionStatus
      };
      console.log('✅ Data export completed');
      return exportData;
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string; timestamp: Date }> {
    try {
      await this.testConnection();
      return {
        status: 'healthy',
        message: 'Firebase connection is working properly',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Firebase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
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