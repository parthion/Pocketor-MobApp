import * as CollectionsService from '@/service/collections.service';
import { Collection, Contribution, Member } from '@/types';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface CollectionsContextType {
  collections: Collection[];
  loading: boolean;
  error: string | null;
  addCollection: (collection: Omit<Collection, 'id'>) => Promise<{ success: boolean; message: string; id?: string }>;
  updateCollection: (id: string, collection: Partial<Collection>) => Promise<{ success: boolean; message: string }>;
  deleteCollection: (id: string) => Promise<{ success: boolean; message: string }>;
  addMember: (collectionId: string, member: Omit<Member, 'id'>) => void;
  addContribution: (collectionId: string, contribution: Omit<Contribution, 'id'>) => void;
  getCollection: (id: string) => Collection | undefined;
  fetchCollectionById: (id: string) => Promise<Collection | null>;
  getCollectionStats: (id: string) => {
    totalContributions: number;
    totalMembers: number;
    avgContribution: number;
  } | null;
  refreshCollections: () => Promise<void>;
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined);

export const CollectionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn } = useAuth();

  // Fetch collections when user logs in or on mount
  useEffect(() => {
    if (isLoggedIn) {
      console.log('User logged in, refreshing collections...');
      refreshCollections();
    } else {
      setCollections([]);
    }
  }, [isLoggedIn]);

  const refreshCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await CollectionsService.getAllCollections(1, 100);
      if (response.success && response.data) {
        // Map service types to app types
        const mappedCollections: Collection[] = response.data.data.map((col: any) => ({
          id: col.id,
          name: col.name,
          description: col.description,
          totalAmount: parseFloat(col.totalAmount) || 0,
          interestRate: parseFloat(col.interestRate) || 0,
          interestType: 'simple' as const, // default value
          frequency: col.frequency as any,
          members: col.members || [],
          contributions: col.contributions || [],
          createdDate: col.startDate || col.createdAt,
          createdAt: col.createdAt,
          status: col.status === 'inactive' ? 'paused' : col.status,
        }));
        setCollections(mappedCollections);
      } else {
        setError(response.message || 'Failed to load collections');
        // Keep existing collections on error
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const addCollection = async (collection: Omit<Collection, 'id'>): Promise<{ success: boolean; message: string; id?: string }> => {
    try {
      // Call the API to create collection
      const response = await CollectionsService.createCollection({
        name: collection.name,
        description: collection.description,
        frequency: collection.frequency,
        interestRate: collection.interestRate,
        startDate: collection.createdDate,
        totalAmount: collection.totalAmount || 1000, // Include totalAmount, default to 1000
      });

      if (response.success && response.data) {
        // Add to local state immediately for better UX
        const newCollection: Collection = {
          ...collection,
          id: response.data.id,
        };
        setCollections([...collections, newCollection]);
        
        // Optionally refresh from server to ensure sync
        // await refreshCollections();
        
        return {
          success: true,
          message: 'Collection created successfully',
          id: response.data.id,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to create collection',
        };
      }
    } catch (err) {
      console.error('Error creating collection:', err);
      return {
        success: false,
        message: 'Failed to create collection',
      };
    }
  };

  const updateCollection = async (id: string, updates: Partial<Collection>): Promise<{ success: boolean; message: string }> => {
    try {
      // Map app types to service types
      const serviceUpdates: any = {
        ...updates,
        status: updates.status === 'paused' ? 'inactive' : updates.status,
      };
      
      const response = await CollectionsService.updateCollection(id, serviceUpdates);
      
      if (response.success) {
        // Update local state
        setCollections(
          collections.map((col) => (col.id === id ? { ...col, ...updates } : col))
        );
        
        return {
          success: true,
          message: 'Collection updated successfully',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to update collection',
        };
      }
    } catch (err) {
      console.error('Error updating collection:', err);
      return {
        success: false,
        message: 'Failed to update collection',
      };
    }
  };

  const deleteCollection = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await CollectionsService.deleteCollection(id);
      
      if (response.success) {
        // Remove from local state
        setCollections(collections.filter((col) => col.id !== id));
        
        return {
          success: true,
          message: 'Collection deleted successfully',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to delete collection',
        };
      }
    } catch (err) {
      console.error('Error deleting collection:', err);
      return {
        success: false,
        message: 'Failed to delete collection',
      };
    }
  };

  const addMember = (collectionId: string, member: Omit<Member, 'id'>) => {
    const newMember: Member = {
      ...member,
      id: Date.now().toString(),
    };

    setCollections(
      collections.map((col) =>
        col.id === collectionId
          ? { ...col, members: [...col.members, newMember] }
          : col
      )
    );
  };

  const addContribution = (collectionId: string, contribution: Omit<Contribution, 'id'>) => {
    const newContribution: Contribution = {
      ...contribution,
      id: Date.now().toString(),
    };

    setCollections(
      collections.map((col) => {
        if (col.id === collectionId) {
          return {
            ...col,
            contributions: [...col.contributions, newContribution],
            totalAmount: col.totalAmount + contribution.amount,
          };
        }
        return col;
      })
    );
  };

  const getCollection = (id: string): Collection | undefined => {
    return collections.find((col) => col.id === id);
  };

  const fetchCollectionById = async (id: string): Promise<Collection | null> => {
    try {
      const response = await CollectionsService.getCollectionById(id);
      
      if (response.success && response.data) {
        // Map service types to app types
        const col: any = response.data;
        const mappedCollection: Collection = {
          id: col.id,
          name: col.name,
          description: col.description,
          totalAmount: parseFloat(col.totalAmount) || 0,
          interestRate: parseFloat(col.interestRate) || 0,
          interestType: 'simple' as const, // default value
          frequency: col.frequency as any,
          members: (col.members || []).map((m: any) => ({
            ...m,
            id: m.id,
            name: m.name,
            email: m.email,
            phone: m.phone,
            joinedDate: m.joinedDate,
          })),
          contributions: (col.contributions || []).map((c: any) => ({
            ...c,
            id: c.id,
            memberId: c.memberId,
            amount: parseFloat(c.amount) || 0,
            date: c.date || c.contributionDate,
            frequency: c.frequency || col.frequency,
          })),
          createdDate: col.startDate || col.createdAt,
          createdAt: col.createdAt,
          status: col.status === 'inactive' ? 'paused' : col.status,
        };
        
        // Update local state with fetched data
        setCollections(prev => {
          const exists = prev.find(c => c.id === id);
          if (exists) {
            return prev.map(c => c.id === id ? mappedCollection : c);
          } else {
            return [...prev, mappedCollection];
          }
        });
        
        return mappedCollection;
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching collection by ID:', err);
      return null;
    }
  };

  const getCollectionStats = (id: string) => {
    const collection = getCollection(id);
    if (!collection) return null;

    return {
      totalContributions: collection.totalAmount,
      totalMembers: collection.members.length,
      avgContribution:
        collection.contributions.length > 0
          ? collection.totalAmount / collection.contributions.length
          : 0,
    };
  };

  return (
    <CollectionsContext.Provider
      value={{
        collections,
        loading,
        error,
        addCollection,
        updateCollection,
        deleteCollection,
        addMember,
        addContribution,
        getCollection,
        fetchCollectionById,
        getCollectionStats,
        refreshCollections,
      }}
    >
      {children}
    </CollectionsContext.Provider>
  );
};

export const useCollections = () => {
  const context = useContext(CollectionsContext);
  if (!context) {
    throw new Error('useCollections must be used within CollectionsProvider');
  }
  return context;
};
