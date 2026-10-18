import React from 'react';
import currencyFormatter from 'currency-formatter';

interface CurrencyFormatterProps {
  amount: any;
}

const formatCurrency = (amount: any): string => {
  if (amount >= 10000000) {
    return '₹' + (amount / 10000000).toFixed(1) + ' Cr';
  } else if (amount >= 100000) {
    return '₹' + (amount / 100000).toFixed(1) + ' L';
  } else {
    const formatter: any = (currencyFormatter as any)?.format ? currencyFormatter : (currencyFormatter as any)?.default;
    if (formatter && typeof formatter.format === 'function') {
      return formatter.format(amount, { code: 'INR' });
    }
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(amount) || 0);
  }
};

const CurrencyFormatter: React.FC<CurrencyFormatterProps> = ({ amount }) => {
  return <span>{formatCurrency(amount)}</span>;
};

export default CurrencyFormatter;
