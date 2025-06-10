import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { InvoiceManager } from '../InvoiceManager';

jest.mock('axios');

describe('InvoiceManager', () => {
  const clientId = 'test-client';

  beforeEach(() => {
    axios.get.mockResolvedValue({ data: [] });
    axios.post.mockResolvedValue({});
    axios.put.mockResolvedValue({});
  });

  it('renders inputs and buttons', () => {
    render(<InvoiceManager clientId={clientId} />);
    expect(screen.getByPlaceholderText(/Description/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/date/i)).toBeInTheDocument();
    expect(screen.getByText(/Add/i)).toBeInTheDocument();
    expect(screen.getByText(/Export Unpaid/i)).toBeInTheDocument();
  });

  it('creates a new invoice', async () => {
    render(<InvoiceManager clientId={clientId} />);
    fireEvent.change(screen.getByPlaceholderText(/Description/i), { target: { value: 'Test Invoice' } });
    fireEvent.change(screen.getByPlaceholderText(/Amount/i), { target: { value: '100' } });
    fireEvent.click(screen.getByText(/Add/i));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/api/invoices', expect.objectContaining({
      clientId,
      description: 'Test Invoice',
      amount: 100,
      dueDate: ''
    })));
  });
});
