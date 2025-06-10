import React, { useEffect, useState } from 'react';
import axios from 'axios';

export function AdminInvoiceDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState('');
  const [failedEmails, setFailedEmails] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const invoicesPerPage = 10;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      fetchAllInvoices();
    }
  }, []);

  const fetchAllInvoices = async () => {
    try {
      const res = await axios.get('/api/invoices');
      setInvoices(res.data);
    } catch (err) {
      console.error('Error loading invoices:', err);
    }
  };

  const exportAllUnpaid = () => {
    const unpaid = filteredInvoices.filter(inv => inv.status === 'Unpaid');
    const csv = unpaid.map(inv => `${inv.clientId},${inv.description},${inv.amount},${inv.dueDate || 'N/A'}`).join('\n');
    const blob = new Blob([`Client ID,Description,Amount,Due Date\n${csv}`], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `filtered_unpaid_invoices.csv`;
    link.click();
  };

  const fetchFailedEmailAudit = async () => {
    try {
      const res = await axios.get('/api/audit?filter=email_failed');
      setFailedEmails(res.data);

      // Automatically send a summary email
      const summary = res.data.map(entry => `• ${entry.timestamp} - ${entry.key}: ${entry.note || entry.action}`).join('<br>');
      if (summary) {
        await axios.post('/api/notify', {
          to: ['admin@example.com'],
          subject: 'Daily Digest: Failed Invoice Notifications',
          body: `<h3>Failed Invoice Notification Summary</h3><p>${summary}</p>`,
          html: true
        });
      }
    } catch (error) {
      console.error('Failed to retrieve email failure logs:', error);
    }
  };

  const markAsPaid = async (id) => {
    try {
      const res = await axios.put(`/api/invoices/${id}/pay`);
      await axios.post('/api/audit', {
        action: 'invoice_paid',
        user: 'staff',
        role: 'staff',
        key: res.data.description,
        timestamp: new Date().toISOString()
      });
      try {
        await axios.post('/api/notify', {
          to: ['admin@example.com', 'billing@example.com'],
          subject: 'Invoice Marked as Paid',
          body: `
            <h3>Invoice Paid Notification</h3>
            <p>The following invoice has been marked as <strong>PAID</strong>:</p>
            <ul>
              <li><strong>Client ID:</strong> ${res.data.clientId}</li>
              <li><strong>Description:</strong> ${res.data.description}</li>
              <li><strong>Amount:</strong> $${res.data.amount.toFixed(2)}</li>
              <li><strong>Status:</strong> ${res.data.status}</li>
            </ul>
          `,
          html: true
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        await axios.post('/api/audit', {
          action: 'email_failed',
          user: 'staff',
          role: 'staff',
          key: res.data.description,
          note: 'Failed to notify invoice marked as paid',
          timestamp: new Date().toISOString(),
          retry: true
        });
        setTimeout(async () => {
          try {
            await axios.post('/api/notify', {
              to: ['admin@example.com', 'billing@example.com'],
              subject: 'Retry: Invoice Marked as Paid',
              body: `
                <h3>Invoice Paid Notification (Retry)</h3>
                <p>This is a retry attempt to notify that the following invoice was marked as <strong>PAID</strong>:</p>
                <ul>
                  <li><strong>Client ID:</strong> ${res.data.clientId}</li>
                  <li><strong>Description:</strong> ${res.data.description}</li>
                  <li><strong>Amount:</strong> $${res.data.amount.toFixed(2)}</li>
                  <li><strong>Status:</strong> ${res.data.status}</li>
                </ul>
              `,
              html: true
            });
          } catch (retryError) {
            console.error('Retry email also failed:', retryError);
            await axios.post('/api/audit', {
              action: 'email_retry_failed',
              user: 'staff',
              role: 'staff',
              key: res.data.description,
              note: 'Second attempt to notify invoice paid also failed',
              timestamp: new Date().toISOString()
            });
          }
        }, 3000);
      }
      fetchAllInvoices();
    } catch (err) {
      console.error('Error updating invoice:', err);
    }
  };

  const isOverdue = (inv) => {
    return inv.status === 'Unpaid' && inv.dueDate && new Date(inv.dueDate) < new Date();
  };

  const handleSort = (field) => {
    const sorted = [...invoices].sort((a, b) => {
      if (field === 'amount') return a.amount - b.amount;
      if (field === 'dueDate') return new Date(a.dueDate) - new Date(b.dueDate);
      return a[field]?.localeCompare(b[field]);
    });
    setInvoices(sorted);
    setSortField(field);
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.clientId.toLowerCase().includes(filter.toLowerCase()) ||
    inv.description.toLowerCase().includes(filter.toLowerCase())
  );

  const totalFilteredOwed = filteredInvoices
    .filter(inv => inv.status === 'Unpaid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const indexOfLast = currentPage * invoicesPerPage;
  const indexOfFirst = indexOfLast - invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);

  if (!isAuthenticated) {
    return <div className="p-4 text-red-600">Access denied. You must be logged in to view invoice records.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">All Unpaid Invoices</h2>
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="Filter by client or description"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border px-2 py-1"
        />
        <button onClick={exportAllUnpaid} className="bg-blue-700 text-white px-4 py-2">Export All Unpaid</button>
        <button onClick={fetchFailedEmailAudit} className="bg-red-600 text-white px-4 py-2">Show Failed Emails</button>
      </div>
      <p className="text-sm mb-2"><strong>Total Unpaid (Filtered):</strong> ${totalFilteredOwed.toFixed(2)}</p>
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 cursor-pointer" onClick={() => handleSort('clientId')}>Client ID</th>
            <th className="border p-2 cursor-pointer" onClick={() => handleSort('description')}>Description</th>
            <th className="border p-2 cursor-pointer" onClick={() => handleSort('amount')}>Amount</th>
            <th className="border p-2 cursor-pointer" onClick={() => handleSort('dueDate')}>Due Date</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentInvoices.map(inv => (
            <tr key={inv._id} className={isOverdue(inv) ? 'text-red-600' : ''}>
              <td className="border p-2">{inv.clientId}</td>
              <td className="border p-2">{inv.description}</td>
              <td className="border p-2">${inv.amount.toFixed(2)}</td>
              <td className="border p-2">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</td>
              <td className="border p-2">{inv.status}</td>
              <td className="border p-2">
                {inv.status === 'Unpaid' && (
                  <button onClick={() => markAsPaid(inv._id)} className="text-blue-600 underline text-sm">
                    Mark as Paid
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 border ${currentPage === i + 1 ? 'bg-blue-600 text-white' : ''}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {failedEmails.length > 0 && (
        <div className="mt-6 border p-4 bg-yellow-100">
          <h3 className="font-bold text-red-800 mb-2">Failed Email Notifications</h3>
          <ul className="list-disc ml-5 text-sm">
            {failedEmails.map((entry, idx) => (
              <li key={idx} className="mb-2">
                <div>{entry.timestamp} - {entry.key}: {entry.note || entry.action}</div>
                <button
                  onClick={async () => {
                    try {
                      await axios.post('/api/notify', {
                        to: ['admin@example.com', 'billing@example.com'],
                        subject: 'Manual Retry: Invoice Notification',
                        body: `Retrying email for invoice: ${entry.key}`,
                        html: true
                      });
                      alert('Email resent.');
                      await axios.post('/api/audit', {
                        action: 'email_manual_retry_success',
                        user: 'admin',
                        role: 'admin',
                        key: entry.key,
                        note: 'Manual retry of invoice email notification succeeded',
                        timestamp: new Date().toISOString()
                      });
                    } catch (e) {
                      alert('Retry failed.');
                      await axios.post('/api/audit', {
                        action: 'email_manual_retry_failed',
                        user: 'admin',
                        role: 'admin',
                        key: entry.key,
                        note: 'Manual retry of invoice email notification failed',
                        timestamp: new Date().toISOString()
                      });
                      console.error(e);
                    }
                  }}
                  className="text-sm text-blue-600 underline"
                >
                  Retry Email
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

