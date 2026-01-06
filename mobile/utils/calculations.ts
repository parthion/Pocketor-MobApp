import { FrequencyType, InterestType } from '@/types';

/**
 * Calculate simple interest
 * Formula: SI = (P × R × T) / 100
 * P = Principal, R = Rate per annum, T = Time in years
 */
export const calculateSimpleInterest = (
  principal: number,
  ratePerAnnum: number,
  timeInMonths: number
): number => {
  const timeInYears = timeInMonths / 12;
  return (principal * ratePerAnnum * timeInYears) / 100;
};

/**
 * Calculate compound interest
 * Formula: A = P(1 + r/n)^(nt)
 * P = Principal, r = Annual rate, n = Compounding frequency, t = Time in years
 */
export const calculateCompoundInterest = (
  principal: number,
  ratePerAnnum: number,
  timeInMonths: number,
  frequency: FrequencyType
): { interest: number; amount: number } => {
  const timeInYears = timeInMonths / 12;
  
  let n = 1; // compounding frequency per year
  if (frequency === 'weekly') {
    n = 52;
  } else if (frequency === 'monthly') {
    n = 12;
  } else {
    n = 1; // custom treated as annual
  }

  const rate = ratePerAnnum / 100;
  const amount = principal * Math.pow(1 + rate / n, n * timeInYears);
  const interest = amount - principal;

  return {
    interest: Math.round(interest * 100) / 100,
    amount: Math.round(amount * 100) / 100,
  };
};

/**
 * Calculate interest based on type (simple or compound)
 */
export const calculateInterest = (
  principal: number,
  ratePerAnnum: number,
  timeInMonths: number,
  interestType: InterestType,
  frequency: FrequencyType
): { interest: number; total: number } => {
  if (interestType === 'simple') {
    const interest = calculateSimpleInterest(principal, ratePerAnnum, timeInMonths);
    return {
      interest: Math.round(interest * 100) / 100,
      total: Math.round((principal + interest) * 100) / 100,
    };
  } else {
    const { interest, amount } = calculateCompoundInterest(
      principal,
      ratePerAnnum,
      timeInMonths,
      frequency
    );
    return {
      interest,
      total: amount,
    };
  }
};

/**
 * Get time in months between two dates
 */
export const getMonthsBetweenDates = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  
  return Math.max(1, months);
};

/**
 * Format currency with symbol
 */
export const formatCurrency = (amount: number, symbol = '₹'): string => {
  return `${symbol} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

/**
 * Get frequency display text
 */
export const getFrequencyText = (frequency: FrequencyType): string => {
  const frequencyMap: Record<FrequencyType, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    custom: 'Custom',
  };
  return frequencyMap[frequency];
};

/**
 * Calculate next contribution due date
 */
export const getNextContributionDate = (lastDate: string, frequency: FrequencyType): string => {
  const last = new Date(lastDate);
  const next = new Date(last);

  if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else {
    next.setDate(next.getDate() + 30);
  }

  return next.toISOString().split('T')[0];
};
