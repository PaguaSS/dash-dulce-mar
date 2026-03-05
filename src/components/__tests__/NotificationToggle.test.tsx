import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationToggle from '../NotificationToggle';

// Create mock functions that will be available when the mock factory runs
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();

// Store mock state that can be changed between tests
let mockState = {
  isSubscribed: false,
  isLoading: false,
  isSupported: true,
  isBlocked: false,
};

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
    get isSubscribed() { return mockState.isSubscribed; },
    get isLoading() { return mockState.isLoading; },
    get isSupported() { return mockState.isSupported; },
    get isBlocked() { return mockState.isBlocked; },
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../services/notification.service', () => ({
  notificationService: {
    sendTestNotification: vi.fn(),
  },
}));

describe('NotificationToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default state before each test
    mockState = {
      isSubscribed: false,
      isLoading: false,
      isSupported: true,
      isBlocked: false,
    };
  });

  it('renders the notification toggle component', () => {
    render(<NotificationToggle />);

    expect(screen.getByText('notifications.title')).toBeInTheDocument();
    expect(screen.getByText('notifications.enableReminders')).toBeInTheDocument();
    expect(screen.getByText('notifications.description')).toBeInTheDocument();
  });

  it('shows switch when notifications are supported and not blocked', () => {
    render(<NotificationToggle />);

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).not.toBeChecked();
  });

  it('calls subscribe when toggle is turned on', async () => {
    mockSubscribe.mockResolvedValue(true);

    render(<NotificationToggle />);

    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });
  });

  it('calls unsubscribe when toggle is turned off', async () => {
    mockState.isSubscribed = true;
    mockUnsubscribe.mockResolvedValue(true);

    render(<NotificationToggle />);

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeChecked();
    fireEvent.click(switchElement);

    await waitFor(() => {
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  it('shows blocked message when notifications are denied', () => {
    mockState.isBlocked = true;

    render(<NotificationToggle />);

    expect(screen.getByText('notifications.blocked')).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('returns null when notifications are not supported', () => {
    mockState.isSupported = false;

    const { container } = render(<NotificationToggle />);

    expect(container.firstChild).toBeNull();
  });
});
