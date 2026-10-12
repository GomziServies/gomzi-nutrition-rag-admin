import React from 'react';
var currencyFormatter = require('currency-formatter')

interface CurrencyFormatterProps {
  amount: any;
}

const formatCurrency = (amount: any): string => {
  if (amount >= 10000000) {
    return '₹' + (amount / 10000000).toFixed(1) + ' Cr';
  } else if (amount >= 100000) {
    return '₹' + (amount / 100000).toFixed(1) + ' L';
  } else {
    return currencyFormatter.format(amount, { code: 'INR' })
  }
};

const CurrencyFormatter: React.FC<CurrencyFormatterProps> = ({ amount }) => {
  return <span>{formatCurrency(amount)}</span>;
};

export default CurrencyFormatter;
