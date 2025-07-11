import { useState, useEffect } from 'react';
import { Board, Mill, ServicePartner } from '../types';
import { boardService, millService, servicePartnerService, initializeMasterData } from '../services/firebaseService';

export const useBoards = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = boardService.subscribe((boardsData) => {
      setBoards(boardsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addBoard = async (board: Omit<Board, 'id'>) => {
    try {
      await boardService.add(board);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add board');
      throw err;
    }
  };

  const updateBoard = async (id: string, updates: Partial<Board>) => {
    try {
      await boardService.update(id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update board');
      throw err;
    }
  };

  const deleteBoard = async (id: string) => {
    try {
      await boardService.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete board');
      throw err;
    }
  };

  return { boards, loading, error, addBoard, updateBoard, deleteBoard };
};

export const useMills = () => {
  const [mills, setMills] = useState<Mill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMills = async () => {
      try {
        const millsData = await millService.getAll();
        setMills(millsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch mills');
      } finally {
        setLoading(false);
      }
    };

    fetchMills();
  }, []);

  return { mills, loading, error };
};

export const useServicePartners = () => {
  const [servicePartners, setServicePartners] = useState<ServicePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServicePartners = async () => {
      try {
        const partnersData = await servicePartnerService.getAll();
        setServicePartners(partnersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch service partners');
      } finally {
        setLoading(false);
      }
    };

    fetchServicePartners();
  }, []);

  return { servicePartners, loading, error };
};

export const useInitializeData = () => {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeMasterData();
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize master data:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  return { initialized, loading };
};