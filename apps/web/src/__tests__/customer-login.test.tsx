import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CustomerLoginPage from '@/app/login/page';
import * as api from '@/lib/api';
import { useRouter } from 'next/navigation';

// Mock the api fetcher
vi.mock('@/lib/api', () => ({
  fetchApi: vi.fn(),
}));

describe('CustomerLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<CustomerLoginPage />);
    expect(screen.getByText('FabricViz')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. AB123')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Access Catalog/i })).toBeDisabled();
  });

  it('enables the submit button only when 5 characters are entered', async () => {
    render(<CustomerLoginPage />);
    const input = screen.getByPlaceholderText('e.g. AB123');
    const button = screen.getByRole('button', { name: /Access Catalog/i });

    fireEvent.change(input, { target: { value: 'AB12' } });
    expect(button).toBeDisabled();

    fireEvent.change(input, { target: { value: 'AB123' } });
    expect(button).not.toBeDisabled();
  });

  it('submits successfully and redirects on valid code', async () => {
    const mockPush = vi.fn();
    (useRouter as any).mockReturnValue({ push: mockPush });
    (api.fetchApi as any).mockResolvedValue({ token: 'fake-token', customer: { id: 1 } });

    render(<CustomerLoginPage />);
    
    const input = screen.getByPlaceholderText('e.g. AB123');
    const button = screen.getByRole('button', { name: /Access Catalog/i });

    fireEvent.change(input, { target: { value: 'VALID' } });
    fireEvent.click(button);

    expect(button).toHaveTextContent('Verifying...');
    
    await waitFor(() => {
      expect(api.fetchApi).toHaveBeenCalledWith('/api/auth/verify-code', expect.any(Object));
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('displays error message on failed login', async () => {
    (api.fetchApi as any).mockRejectedValue(new Error('Invalid code'));

    render(<CustomerLoginPage />);
    
    const input = screen.getByPlaceholderText('e.g. AB123');
    const button = screen.getByRole('button', { name: /Access Catalog/i });

    fireEvent.change(input, { target: { value: 'WRONG' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Invalid code')).toBeInTheDocument();
    });
  });
});
