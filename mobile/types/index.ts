export type FrequencyType = 'weekly' | 'monthly' | 'custom';
export type InterestType = 'simple' | 'compound';

export interface OTPCode {
  email?: string;
  phone?: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  attempts: number;
  verified: boolean;
}

export interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  joinedDate: string;
}

export interface Contribution {
  id: string;
  memberId: string;
  amount: number;
  date: string;
  frequency: FrequencyType;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  totalAmount: number;
  interestRate: number; // percentage
  interestType: InterestType;
  frequency: FrequencyType;
  members: Member[];
  contributions: Contribution[];
  createdDate: string;
  status: 'active' | 'completed' | 'paused';
}

export interface InterestCalculation {
  principal: number;
  rate: number;
  time: number;
  frequency: FrequencyType;
  interest: number;
  total: number;
}

export interface MemberSummary {
  memberId: string;
  memberName: string;
  totalContributed: number;
  lastContribution?: string;
  interestEarned: number;
  totalWithInterest: number;
}
