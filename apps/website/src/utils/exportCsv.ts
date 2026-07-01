import { Customer } from '@/types/customer';

export function exportCustomersToCSV(customers: Customer[]): void {
  // Columns: Access Code, Customer Name, Company, City, Email, Mobile, Country Code, Status, Notes, Tags, Total Credits, Used Credits, Remaining Credits, Session Count, Last Active, Created Date
  const headers = [
    'Access Code',
    'Customer Name', 
    'Company', 
    'City', 
    'Email', 
    'Mobile', 
    'Country Code',
    'Status', 
    'Notes',
    'Tags', 
    'Total Credits',
    'Used Credits',
    'Remaining Credits',
    'Session Count', 
    'Last Active', 
    'Created Date'
  ];

  const escapeCSV = (str: string | number | null | undefined) => {
    if (str === null || str === undefined) return '""';
    const stringVal = String(str);
    if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  const rows = customers.map(c => {
    return [
      c.access_code || '',
      c.full_name,
      c.company || '',
      c.city || '',
      c.email,
      c.mobile || '',
      c.country_code || '',
      c.is_active ? 'Active' : 'Inactive',
      c.notes || '',
      (c.tags || []).join(';'),
      c.credits?.total_credits || 0,
      c.credits?.used_credits || 0,
      c.credits?.remaining_credits || 0,
      c.session_count || 0,
      formatDate(c.last_active_at),
      formatDate(c.created_at)
    ].map(escapeCSV).join(',');
  });

  const BOM = '\uFEFF';
  const csvContent = BOM + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `customers-${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
