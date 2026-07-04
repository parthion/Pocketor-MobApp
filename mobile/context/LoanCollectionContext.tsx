import { loanCollectionService } from '@/service/loan-collection.service';
import type { Area, Customer, Line } from '@/types/collection.types';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface LoanCollectionContextType {
  // Lines
  lines: Line[];
  addLine: (line: Line) => Promise<Line | undefined>;
  updateLine: (id: string, line: Partial<Line>) => Promise<void>;
  deleteLine: (id: string) => Promise<void>;
  refreshLines: () => Promise<void>;
  
  // Areas
  areas: Area[];
  addArea: (area: Area) => Promise<Area | undefined>;
  updateArea: (id: string, area: Partial<Area>) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;
  refreshAreas: () => Promise<void>;
  
  // Customers
  customers: Customer[];
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  refreshCustomers: () => Promise<void>;
  
  // Loans
  loans: any[];
  addLoan: (loan: any) => Promise<void>;
  updateLoan: (id: string, loan: any) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  refreshLoans: () => Promise<void>;

  // Payments
  payments: any[];
  recordPayment: (payment: any) => Promise<any>;
  refreshPayments: () => Promise<void>;

  // Loading states
  isLoading: boolean;
}

const LoanCollectionContext = createContext<LoanCollectionContextType | undefined>(undefined);

export function LoanCollectionProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [lines, setLines] = useState<Line[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all data when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      console.log('User logged in, refreshing collections...');
      loadAllData();
    } else {
      // Clear data when user logs out
      console.log('User logged out, clearing collections...');
      setLines([]);
      setAreas([]);
      setCustomers([]);
      setLoans([]);
    }
  }, [isLoggedIn]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        refreshLines(),
        refreshAreas(),
        refreshCustomers(),
        refreshLoans(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== LINE OPERATIONS =====
  const refreshLines = async () => {
    try {
      console.log('Fetching lines from API...');
      const response = await loanCollectionService.getLines();
      console.log('Lines API response:', response);
      if (response.success && response.data) {
        console.log('Setting lines:', response.data);
        setLines(response.data);
      }
    } catch (error) {
      console.error('Error refreshing lines:', error);
      // Fallback to empty array on error
      setLines([]);
    }
  };

  const addLine = async (line: Line) => {
    try {
      console.log('Creating line:', line);
      const response = await loanCollectionService.createLine(line);
      console.log('Create line response:', response);
      if (response.success && response.data) {
        setLines((prev) => [...prev, response.data!]);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create line');
      }
    } catch (error) {
      console.error('Error adding line:', error);
      throw error;
    }
  };

  const updateLine = async (id: string, updatedLine: Partial<Line>) => {
    try {
      const response = await loanCollectionService.updateLine(id, updatedLine);
      if (response.success) {
        setLines((prev) =>
          prev.map((line) => (line.id === id ? { ...line, ...updatedLine } : line))
        );
      } else {
        throw new Error(response.message || 'Failed to update line');
      }
    } catch (error) {
      console.error('Error updating line:', error);
      throw error;
    }
  };

  const deleteLine = async (id: string) => {
    try {
      await loanCollectionService.deleteLine(id);
      setLines((prev) => prev.filter((line) => line.id !== id));
    } catch (error) {
      console.error('Error deleting line:', error);
      throw error;
    }
  };

  // ===== AREA OPERATIONS =====
  const refreshAreas = async () => {
    try {
      console.log('Fetching areas from API...');
      const response = await loanCollectionService.getAreas();
      console.log('Areas API response:', response);
      if (response.success && response.data) {
        console.log('Setting areas:', response.data);
        setAreas(response.data);
      } else {
        console.warn('Areas API returned no data or failed:', response);
        setAreas([]);
      }
    } catch (error) {
      console.error('Error refreshing areas:', error);
      setAreas([]);
    }
  };

  const addArea = async (area: Area) => {
    try {
      const response = await loanCollectionService.createArea(area);
      if (response.success && response.data) {
        setAreas((prev) => [...prev, response.data!]);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create area');
      }
    } catch (error) {
      console.error('Error adding area:', error);
      throw error;
    }
  };

  const updateArea = async (id: string, updatedArea: Partial<Area>) => {
    try {
      const response = await loanCollectionService.updateArea(id, updatedArea);
      if (response.success) {
        setAreas((prev) =>
          prev.map((area) => (area.id === id ? { ...area, ...updatedArea } : area))
        );
      } else {
        throw new Error(response.message || 'Failed to update area');
      }
    } catch (error) {
      console.error('Error updating area:', error);
      throw error;
    }
  };

  const deleteArea = async (id: string) => {
    try {
      await loanCollectionService.deleteArea(id);
      setAreas((prev) => prev.filter((area) => area.id !== id));
    } catch (error) {
      console.error('Error deleting area:', error);
      throw error;
    }
  };

  // ===== CUSTOMER OPERATIONS =====
  const refreshCustomers = async () => {
    try {
      const response = await loanCollectionService.getCustomers();
      if (response.success && response.data) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Error refreshing customers:', error);
      setCustomers([]);
    }
  };

  const addCustomer = async (customer: Customer) => {
    try {
      const response = await loanCollectionService.createCustomer(customer);
      if (response.success && response.data) {
        setCustomers((prev) => [...prev, response.data!]);
      } else {
        throw new Error(response.message || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (id: string, updatedCustomer: Partial<Customer>) => {
    try {
      const response = await loanCollectionService.updateCustomer(id, updatedCustomer);
      if (response.success) {
        setCustomers((prev) =>
          prev.map((customer) => (customer.id === id ? { ...customer, ...updatedCustomer } : customer))
        );
      } else {
        throw new Error(response.message || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await loanCollectionService.deleteCustomer(id);
      setCustomers((prev) => prev.filter((customer) => customer.id !== id));
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  };

  // ===== LOAN OPERATIONS =====
  const refreshLoans = async () => {
    try {
      const response = await loanCollectionService.getLoans();
      if (response.success && response.data) {
        setLoans(response.data);
      }
    } catch (error) {
      console.error('Error refreshing loans:', error);
      setLoans([]);
    }
  };

  const addLoan = async (loan: any) => {
    try {
      const response = await loanCollectionService.createLoan(loan);
      if (response.success && response.data) {
        setLoans((prev) => [...prev, response.data!]);
      } else {
        throw new Error(response.message || 'Failed to create loan');
      }
    } catch (error) {
      console.error('Error adding loan:', error);
      throw error;
    }
  };

  const updateLoan = async (id: string, updatedLoan: any) => {
    try {
      const response = await loanCollectionService.updateLoan(id, updatedLoan);
      if (response.success) {
        setLoans((prev) =>
          prev.map((loan) => (loan.id === id ? { ...loan, ...updatedLoan } : loan))
        );
      } else {
        throw new Error(response.message || 'Failed to update loan');
      }
    } catch (error) {
      console.error('Error updating loan:', error);
      throw error;
    }
  };

  const deleteLoan = async (id: string) => {
    try {
      await loanCollectionService.deleteLoan(id);
      setLoans((prev) => prev.filter((loan) => loan.id !== id));
    } catch (error) {
      console.error('Error deleting loan:', error);
      throw error;
    }
  };

  // ===== PAYMENT OPERATIONS =====
  const refreshPayments = async () => {
    try {
      // Only load payments if there are loans to load for
      if (loans.length === 0) {
        setPayments([]);
        return;
      }
      // Load payments for all loans in parallel (batched, not sequential)
      const results = await Promise.all(
        loans.map(loan =>
          loanCollectionService.getPaymentsByLoan(loan.id)
            .then(res => (res.success && res.data ? res.data : []))
            .catch(() => [])
        )
      );
      setPayments(results.flat());
    } catch (error) {
      console.error('Error refreshing payments:', error);
    }
  };

  const recordPayment = async (paymentData: any) => {
    try {
      const response = await loanCollectionService.recordPayment(paymentData);
      if (response.success && response.data) {
        setPayments((prev) => [response.data, ...prev]);
        // Update loan balance locally
        setLoans((prev) => prev.map((l) =>
          l.id === paymentData.loanId
            ? { ...l, paidAmount: (l.paidAmount || 0) + paymentData.amount, balanceAmount: (l.balanceAmount || 0) - paymentData.amount }
            : l
        ));
        return response.data;
      }
      throw new Error(response.message || 'Failed to record payment');
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  };

  return (
    <LoanCollectionContext.Provider
      value={{
        lines,
        addLine,
        updateLine,
        deleteLine,
        refreshLines,
        areas,
        addArea,
        updateArea,
        deleteArea,
        refreshAreas,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        refreshCustomers,
        loans,
        addLoan,
        updateLoan,
        deleteLoan,
        refreshLoans,
        payments,
        recordPayment,
        refreshPayments,
        isLoading,
      }}
    >
      {children}
    </LoanCollectionContext.Provider>
  );
}

export function useLoanCollection() {
  const context = useContext(LoanCollectionContext);
  if (context === undefined) {
    throw new Error('useLoanCollection must be used within a LoanCollectionProvider');
  }
  return context;
}
