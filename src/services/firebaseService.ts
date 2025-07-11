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
import { db } from '../firebase';
import { Board, ServiceRecord, Mill, ServicePartner } from '../types';

// Collections
const BOARDS_COLLECTION = 'boards';
const MILLS_COLLECTION = 'mills';
const SERVICE_PARTNERS_COLLECTION = 'servicePartners';
const SERVICE_RECORDS_COLLECTION = 'serviceRecords';

// Board Operations
export const boardService = {
  // Get all boards
  getAll: async (): Promise<Board[]> => {
    const querySnapshot = await getDocs(collection(db, BOARDS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      purchaseDate: doc.data().purchaseDate?.toDate() || new Date(),
      warrantyExpiry: doc.data().warrantyExpiry?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Board[];
  },

  // Add new board
  add: async (board: Omit<Board, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, BOARDS_COLLECTION), {
      ...board,
      purchaseDate: Timestamp.fromDate(board.purchaseDate),
      warrantyExpiry: Timestamp.fromDate(board.warrantyExpiry),
      createdAt: Timestamp.fromDate(board.createdAt),
      updatedAt: Timestamp.fromDate(board.updatedAt),
    });
    return docRef.id;
  },

  // Update board
  update: async (id: string, updates: Partial<Board>): Promise<void> => {
    const docRef = doc(db, BOARDS_COLLECTION, id);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    };
    
    if (updates.purchaseDate) {
      updateData.purchaseDate = Timestamp.fromDate(updates.purchaseDate);
    }
    if (updates.warrantyExpiry) {
      updateData.warrantyExpiry = Timestamp.fromDate(updates.warrantyExpiry);
    }
    
    await updateDoc(docRef, updateData);
  },

  // Delete board
  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, BOARDS_COLLECTION, id));
  },

  // Listen to real-time updates
  subscribe: (callback: (boards: Board[]) => void) => {
    const q = query(collection(db, BOARDS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const boards = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        purchaseDate: doc.data().purchaseDate?.toDate() || new Date(),
        warrantyExpiry: doc.data().warrantyExpiry?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Board[];
      callback(boards);
    });
  }
};

// Mill Operations
export const millService = {
  getAll: async (): Promise<Mill[]> => {
    const querySnapshot = await getDocs(collection(db, MILLS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Mill[];
  },

  add: async (mill: Omit<Mill, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, MILLS_COLLECTION), mill);
    return docRef.id;
  },

  update: async (id: string, updates: Partial<Mill>): Promise<void> => {
    await updateDoc(doc(db, MILLS_COLLECTION, id), updates);
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, MILLS_COLLECTION, id));
  }
};

// Service Partner Operations
export const servicePartnerService = {
  getAll: async (): Promise<ServicePartner[]> => {
    const querySnapshot = await getDocs(collection(db, SERVICE_PARTNERS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ServicePartner[];
  },

  add: async (partner: Omit<ServicePartner, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, SERVICE_PARTNERS_COLLECTION), partner);
    return docRef.id;
  },

  update: async (id: string, updates: Partial<ServicePartner>): Promise<void> => {
    await updateDoc(doc(db, SERVICE_PARTNERS_COLLECTION, id), updates);
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, SERVICE_PARTNERS_COLLECTION, id));
  }
};

// Service Record Operations
export const serviceRecordService = {
  getByBoardId: async (boardId: string): Promise<ServiceRecord[]> => {
    const q = query(
      collection(db, SERVICE_RECORDS_COLLECTION),
      where('boardId', '==', boardId),
      orderBy('serviceDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      serviceDate: doc.data().serviceDate?.toDate() || new Date(),
    })) as ServiceRecord[];
  },

  add: async (record: Omit<ServiceRecord, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, SERVICE_RECORDS_COLLECTION), {
      ...record,
      serviceDate: Timestamp.fromDate(record.serviceDate),
    });
    return docRef.id;
  },

  update: async (id: string, updates: Partial<ServiceRecord>): Promise<void> => {
    const updateData = { ...updates };
    if (updates.serviceDate) {
      updateData.serviceDate = Timestamp.fromDate(updates.serviceDate);
    }
    await updateDoc(doc(db, SERVICE_RECORDS_COLLECTION, id), updateData);
  }
};

// Initialize Master Data
export const initializeMasterData = async (): Promise<void> => {
  const batch = writeBatch(db);

  // Check if data already exists
  const millsSnapshot = await getDocs(collection(db, MILLS_COLLECTION));
  if (millsSnapshot.empty) {
    // Add Mills
    const mills = [
      {
        name: 'Mill 1 - Production Unit A',
        location: 'Industrial Area, Sector 1',
        contactPerson: 'Rajesh Kumar',
        phone: '+91-9876543210'
      },
      {
        name: 'Mill 2 - Production Unit B',
        location: 'Industrial Area, Sector 2',
        contactPerson: 'Suresh Patel',
        phone: '+91-9876543211'
      },
      {
        name: 'Mill 3 - Production Unit C',
        location: 'Industrial Area, Sector 3',
        contactPerson: 'Amit Singh',
        phone: '+91-9876543212'
      },
      {
        name: 'Mill 4 - Quality Control',
        location: 'Industrial Area, Sector 4',
        contactPerson: 'Priya Sharma',
        phone: '+91-9876543213'
      }
    ];

    mills.forEach(mill => {
      const docRef = doc(collection(db, MILLS_COLLECTION));
      batch.set(docRef, mill);
    });
  }

  // Check if service partners exist
  const partnersSnapshot = await getDocs(collection(db, SERVICE_PARTNERS_COLLECTION));
  if (partnersSnapshot.empty) {
    // Add Service Partners
    const servicePartners = [
      {
        name: 'Super Electronics',
        contactPerson: 'Vikram Mehta',
        phone: '+91-9876543220',
        email: 'service@superelectronics.com',
        address: 'Electronics Hub, Phase 1, Gurgaon',
        rating: 4.5,
        avgRepairTime: 5
      },
      {
        name: 'Sheltronics',
        contactPerson: 'Ravi Gupta',
        phone: '+91-9876543221',
        email: 'support@sheltronics.com',
        address: 'Tech Park, Sector 18, Noida',
        rating: 4.2,
        avgRepairTime: 6
      },
      {
        name: 'TechFix Solutions',
        contactPerson: 'Anita Verma',
        phone: '+91-9876543222',
        email: 'repairs@techfixsolutions.com',
        address: 'Industrial Complex, Faridabad',
        rating: 4.0,
        avgRepairTime: 7
      },
      {
        name: 'ElectroServ India',
        contactPerson: 'Manoj Agarwal',
        phone: '+91-9876543223',
        email: 'service@electroserv.in',
        address: 'Electronic City, Bangalore',
        rating: 4.3,
        avgRepairTime: 5
      }
    ];

    servicePartners.forEach(partner => {
      const docRef = doc(collection(db, SERVICE_PARTNERS_COLLECTION));
      batch.set(docRef, partner);
    });
  }

  // Check if boards exist
  const boardsSnapshot = await getDocs(collection(db, BOARDS_COLLECTION));
  if (boardsSnapshot.empty) {
    // Add Sample Boards
    const currentDate = new Date();
    const boards = [
      {
        boardId: 'SMW-B-001',
        currentStatus: 'In Use' as const,
        currentLocation: 'Mill 1 - Production Unit A',
        millAssigned: 'Mill 1 - Production Unit A',
        warrantyStatus: 'Under Service Warranty' as const,
        warrantyExpiry: new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate()),
        purchaseDate: new Date(currentDate.getFullYear() - 1, 0, 15),
        serviceHistory: [],
        createdAt: currentDate,
        updatedAt: currentDate
      },
      {
        boardId: 'SMW-B-002',
        currentStatus: 'Sent for Service' as const,
        currentLocation: 'Super Electronics',
        millAssigned: 'Mill 2 - Production Unit B',
        warrantyStatus: 'Under Service Warranty' as const,
        warrantyExpiry: new Date(currentDate.getFullYear() + 1, currentDate.getMonth() + 2, currentDate.getDate()),
        purchaseDate: new Date(currentDate.getFullYear() - 1, 1, 20),
        serviceHistory: [],
        substituteBoard: 'SMW-S-001',
        createdAt: currentDate,
        updatedAt: currentDate
      },
      {
        boardId: 'SMW-B-003',
        currentStatus: 'In Repair' as const,
        currentLocation: 'Sheltronics',
        millAssigned: 'Mill 3 - Production Unit C',
        warrantyStatus: 'Under Replacement Warranty' as const,
        warrantyExpiry: new Date(currentDate.getFullYear() + 2, currentDate.getMonth(), currentDate.getDate()),
        purchaseDate: new Date(currentDate.getFullYear() - 1, 2, 10),
        serviceHistory: [],
        substituteBoard: 'SMW-S-002',
        createdAt: currentDate,
        updatedAt: currentDate
      },
      {
        boardId: 'SMW-B-004',
        currentStatus: 'Repaired' as const,
        currentLocation: 'TechFix Solutions',
        millAssigned: 'Mill 1 - Production Unit A',
        warrantyStatus: 'Under Service Warranty' as const,
        warrantyExpiry: new Date(currentDate.getFullYear() + 1, currentDate.getMonth() + 6, currentDate.getDate()),
        purchaseDate: new Date(currentDate.getFullYear() - 1, 3, 5),
        serviceHistory: [],
        substituteBoard: 'SMW-S-003',
        createdAt: currentDate,
        updatedAt: currentDate
      },
      {
        boardId: 'SMW-B-005',
        currentStatus: 'In Use' as const,
        currentLocation: 'Mill 4 - Quality Control',
        millAssigned: 'Mill 4 - Quality Control',
        warrantyStatus: 'Out of Warranty' as const,
        warrantyExpiry: new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate()),
        purchaseDate: new Date(currentDate.getFullYear() - 3, 4, 12),
        serviceHistory: [],
        createdAt: currentDate,
        updatedAt: currentDate
      },
      // Substitute Boards
      {
        boardId: 'SMW-S-001',
        currentStatus: 'In Use' as const,
        currentLocation: 'Mill 2 - Production Unit B',
        millAssigned: 'Mill 2 - Production Unit B',
        warrantyStatus: 'Under Service Warranty' as const,
        warrantyExpiry: new Date(currentDate.getFullYear() + 1, currentDate.getMonth() + 8, currentDate.getDate()),
        purchaseDate: new Date(currentDate.getFullYear() - 1, 5, 1),
        serviceHistory: [],
        createdAt: currentDate,
        updatedAt: currentDate
      },
      {
        boardId: 'SMW-S-002',
        currentStatus: 'In Use' as const,
        currentLocation: 'Mill 3 - Production Unit C',
        millAssigned: 'Mill 3 - Production Unit C',
        warrantyStatus: 'Under Service Warranty' as const,
        warrantyExpiry: new Date(currentDate.getFullYear() + 1, currentDate.getMonth() + 9, currentDate.getDate()),
        purchaseDate: new Date(currentDate.getFullYear() - 1, 6, 15),
        serviceHistory: [],
        createdAt: currentDate,
        updatedAt: currentDate
      },
      {
        boardId: 'SMW-S-003',
        currentStatus: 'In Use' as const,
        currentLocation: 'Mill 1 - Production Unit A',
        millAssigned: 'Mill 1 - Production Unit A',
        warrantyStatus: 'Under Service Warranty' as const,
        warrantyExpiry: new Date(currentDate.getFullYear() + 1, currentDate.getMonth() + 10, currentDate.getDate()),
        purchaseDate: new Date(currentDate.getFullYear() - 1, 7, 20),
        serviceHistory: [],
        createdAt: currentDate,
        updatedAt: currentDate
      }
    ];

    boards.forEach(board => {
      const docRef = doc(collection(db, BOARDS_COLLECTION));
      batch.set(docRef, {
        ...board,
        purchaseDate: Timestamp.fromDate(board.purchaseDate),
        warrantyExpiry: Timestamp.fromDate(board.warrantyExpiry),
        createdAt: Timestamp.fromDate(board.createdAt),
        updatedAt: Timestamp.fromDate(board.updatedAt),
      });
    });
  }

  await batch.commit();
};