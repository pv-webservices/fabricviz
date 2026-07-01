export function exportCustomersToCSV(customers: any[]) {
  // Columns: Name, Email, Mobile, Company, City, Status, Sessions, Last Active, Tags, Created
  const headers = [
    'Name', 
    'Email', 
    'Mobile', 
    'Company', 
    'City', 
    'Status', 
    'Sessions', 
    'Last Active', 
    'Tags', 
    'Created'
  ];

  const escapeCSV = (str: string | number | null | undefined) => {
    if (str === null || str === undefined) return '""';
    const stringVal = String(str);
    if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  };

  const rows = customers.map(c => {
    return [
      c.full_name,
      c.email,
      `${c.country_code || ''} ${c.mobile || ''}`.trim(),
      c.company || '',
      c.city || '',
      c.is_active ? 'Active' : 'Inactive',
      c.session_count || 0,
      c.last_active_at ? new Date(c.last_active_at).toLocaleString() : '',
      (c.tags || []).join('; '),
      c.created_at ? new Date(c.created_at).toLocaleDateString() : ''
    ].map(escapeCSV).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
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
