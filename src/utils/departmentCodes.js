export const DEPARTMENT_CODES = {
  'ACCT': 'Accounting',
  'AIML': 'Artificial Intelligence and Machine Learning',
  'BLAW': 'Business Law',
  'DECS': 'Decision Sciences',
  'ENTR': 'Entrepreneurship',
  'FINC': 'Finance',
  'HCAK': 'Healthcare at Kellogg',
  'INTL': 'International Business',
  'LDEV': 'Leadership Development',
  'MBAI': 'Kellogg/McCormick MBAi Program',
  'MECN': 'Managerial Economics',
  'MECS': 'Managerial Economics & Strategy',
  'MKTG': 'Marketing',
  'MORS': 'Management and Organizations',
  'OPNS': 'Operations',
  'PACT': 'Public Action and the Social Compact',
  'REAL': 'Real Estate',
  'SSIM': 'Sustainability and Social Impact',
  'STRT': 'Strategy'
};

export const getDepartmentName = (code) => {
  return DEPARTMENT_CODES[code] || code;
}; 
