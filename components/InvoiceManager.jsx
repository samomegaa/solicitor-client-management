import React, { useEffect, useState } from 'react';
import axios from 'axios';

export function InvoiceManager({ clientId }) {
  const [showGuide, setShowGuide] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, [clientId]);

  const fetchInvoices = async () => {
    const res = await axios.get(`/api/invoices/${clientId}`);
    setInvoices(res.data);
  };

  const createInvoice = async () => {
    await axios.post('/api/invoices', {
      clientId,
      description,
      amount: parseFloat(amount),
      dueDate
    });
    setDescription('');
    setAmount('');
    setDueDate('');
    fetchInvoices();
  };

  const markAsPaid = async (id) => {
    await axios.put(`/api/invoices/${id}/pay`);
    fetchInvoices();
  };

  const downloadInvoice = (inv) => {
    const content = `Invoice

Client ID: ${inv.clientId}
Description: ${inv.description}
Amount: $${inv.amount.toFixed(2)}
Status: ${inv.status}
Date: ${new Date(inv.createdAt).toLocaleDateString()}
Due: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}`;
    const blob = new Blob([content], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Invoice_${inv._id}.pdf`;
    link.click();
  };

  const exportUnpaidInvoices = () => {
    const unpaid = invoices.filter(inv => inv.status === 'Unpaid');
    const csv = unpaid.map(inv => `${inv.description},${inv.amount},${inv.dueDate || 'N/A'}`).join('\n');
    const blob = new Blob([`Description,Amount,Due Date\n${csv}`], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `unpaid_invoices_${clientId}.csv`;
    link.click();
  };

  const totalOwed = invoices
    .filter(inv => inv.status === 'Unpaid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalPaid = invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const isOverdue = (inv) => {
    return inv.status === 'Unpaid' && inv.dueDate && new Date(inv.dueDate) < new Date();
  };

  return (
    <div className="p-2 border rounded mt-4">
      <h3 className="font-semibold mb-2">Invoices</h3>
      <div className="mb-2">
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-1 border mr-2"
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="p-1 border mr-2"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="p-1 border mr-2"
        />
        <button onClick={createInvoice} className="bg-green-600 text-white px-3 py-1">Add</button>
        <button onClick={exportUnpaidInvoices} className="ml-2 bg-blue-500 text-white px-3 py-1">Export Unpaid</button>
      </div>
      <ul>
        {invoices.map((inv) => (
          <li key={inv._id} className={`mb-1 ${isOverdue(inv) ? 'text-red-600' : ''}`}>
            <span>
              {inv.description} - ${inv.amount.toFixed(2)} - {inv.status} -
              Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}
            </span>
            <button onClick={() => downloadInvoice(inv)} className="ml-2 text-sm text-gray-600 underline">
              Download PDF
            </button>
            {inv.status === 'Unpaid' && (
              <button onClick={() => markAsPaid(inv._id)} className="ml-2 text-sm text-blue-600 underline">
                Mark as Paid
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-2 text-sm">
        <strong>Total Paid:</strong> ${totalPaid.toFixed(2)}<br />
        <strong>Total Owed:</strong> ${totalOwed.toFixed(2)}
      </div>
      <div className="mt-4">
        <button
          className="text-blue-700 underline text-sm"
          onClick={() => setShowGuide(!showGuide)}
        >
          🔔 View Daily Digest Job Deployment Guide
        </button>
        {showGuide && (
          <div className="mt-2 border p-3 bg-gray-50 text-sm">
            <p><strong>Daily Digest Job - Deployment Guide:</strong></p>
            <p>This guide explains how to deploy and schedule the <code>dailyDigestJob.js</code> for automatic execution.</p>
            <p><a href="/mnt/data/Daily_Digest_Job_Deployment_Guide.pdf" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">📄 Download PDF</a></p>
          </div>
        )}
      </div>
    </div>
  );
}
