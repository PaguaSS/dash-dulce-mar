import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CategoryList from '../CategoryList';
import {
  categoryService,
  type PortfolioItem,
  type PortfolioListResponse,
} from '../../../services/category.service';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from 'vitest';

// Mock imports
vi.mock('../../../services/category.service');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('react-hot-toast', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Setup mock data
const mockItems: PortfolioItem[] = [
  {
    id: '1',
    type: 'CATEGORY',
    title: 'Sweets',
    image: 'sweets.jpg',
    active: true,
    parentId: null,
    description: 'Yummy',
  },
  {
    id: '2',
    type: 'ITEM',
    title: 'Candy',
    image: 'candy.jpg',
    active: true,
    parentId: '1',
    description: 'Sweet candy',
  },
];

const mockResponse: PortfolioListResponse = {
  data: mockItems,
  meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
};

describe('CategoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (
      categoryService.getContents as MockedFunction<
        typeof categoryService.getContents
      >
    ).mockResolvedValue(mockResponse);
  });

  it('calls getContents with parentId: "null" initially (Root View)', async () => {
    render(
      <MemoryRouter>
        <CategoryList />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(categoryService.getContents).toHaveBeenCalledWith(
        expect.objectContaining({
          parentId: 'null',
        }),
      );
    });
  });

  it('renders items correctly', async () => {
    render(
      <MemoryRouter>
        <CategoryList />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Sweets')).toBeInTheDocument();
      expect(screen.getByText('Candy')).toBeInTheDocument();
    });
  });

  it('performs global search by omitting parentId', async () => {
    render(
      <MemoryRouter>
        <CategoryList />
      </MemoryRouter>,
    );

    const searchInput = screen.getByPlaceholderText('portfolio.search');
    fireEvent.change(searchInput, { target: { value: 'Candy' } });

    await waitFor(() => {
      // We expect the LAST call to have the search term and NO parentId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calls = (categoryService.getContents as any).mock.calls;
      const lastCallArgs = calls[calls.length - 1][0];

      expect(lastCallArgs.search).toBe('Candy');
      expect(lastCallArgs.parentId).toBeUndefined();
    });
  });
});
