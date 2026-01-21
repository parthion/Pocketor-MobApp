export type LineType = 
  | 'Daily' 
  | 'Weekly' 
  | 'Monthly' 
  | 'Monthly(Interest)' 
  | 'Enterprise' 
  | 'Auto Finance' 
  | 'Gold Loan';

export type DayOfWeek = 
  | 'Sunday' 
  | 'Monday' 
  | 'Tuesday' 
  | 'Wednesday' 
  | 'Thursday' 
  | 'Friday' 
  | 'Saturday';

export interface Line {
  id: string;
  lineName: string;
  lineType: LineType;
  day?: DayOfWeek; // For Weekly type
  interestPerHundred: number;
  billAmountPerHundred: number;
  noOfInstalls: number;
  badLoanDays: number;
  closeLoanManually: boolean;
  enablePenalty: boolean;
  keepPaidCustomerInCompletedTab: boolean;
  upiQRCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Area {
  id: string;
  name: string;
  lineId: string;
  createdAt: Date;
}

export interface Collection {
  id: string;
  date: Date;
  lineId: string;
  areaId: string;
  status: 'pending' | 'completed' | 'submitted';
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  areaId: string;
  lineId: string;
  status: 'active' | 'completed' | 'defaulted';
  createdAt: Date;
}

export interface Loan {
  id: string;
  customerId: string;
  lineId: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  installmentAmount: number;
  noOfInstallments: number;
  paidInstallments: number;
  remainingAmount: number;
  startDate: Date;
  dueDate: Date;
  status: 'active' | 'completed' | 'overdue' | 'defaulted';
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  loanId: string;
  customerId: string;
  amount: number;
  paymentDate: Date;
  collectionDate: Date;
  paymentMethod: 'cash' | 'upi' | 'bank' | 'other';
  receiptNumber?: string;
  notes?: string;
  createdAt: Date;
}
