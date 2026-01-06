import { Collection, Contribution, Member } from '@/types';
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface CollectionsContextType {
  collections: Collection[];
  addCollection: (collection: Omit<Collection, 'id'>) => void;
  updateCollection: (id: string, collection: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  addMember: (collectionId: string, member: Omit<Member, 'id'>) => void;
  addContribution: (collectionId: string, contribution: Omit<Contribution, 'id'>) => void;
  getCollection: (id: string) => Collection | undefined;
  getCollectionStats: (id: string) => {
    totalContributions: number;
    totalMembers: number;
    avgContribution: number;
  } | null;
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined);

export const CollectionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [collections, setCollections] = useState<Collection[]>([]);

  const addCollection = (collection: Omit<Collection, 'id'>) => {
    const newCollection: Collection = {
      ...collection,
      id: Date.now().toString(),
    };
    setCollections([...collections, newCollection]);
  };

  const updateCollection = (id: string, updates: Partial<Collection>) => {
    setCollections(
      collections.map((col) => (col.id === id ? { ...col, ...updates } : col))
    );
  };

  const deleteCollection = (id: string) => {
    setCollections(collections.filter((col) => col.id !== id));
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
        addCollection,
        updateCollection,
        deleteCollection,
        addMember,
        addContribution,
        getCollection,
        getCollectionStats,
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
