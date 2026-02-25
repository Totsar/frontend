import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ItemDetailModal from './ItemDetailModal';
import { renderWithProviders } from '../../../tests/utils/renderWithProviders';

vi.mock('../map/MapView', () => ({
    default: () => <div data-testid="map-view" />,
}));

const { mockedItemService } = vi.hoisted(() => {
    const mock = {
        getItem: vi.fn(),
        createComment: vi.fn(),
        updateComment: vi.fn(),
        deleteComment: vi.fn(),
        reportComment: vi.fn(),
    };
    return { mockedItemService: mock };
});

vi.mock('../../services/itemService', () => ({
    itemService: mockedItemService,
}));

const baseItem = {
    id: '12',
    title: 'Blue Backpack',
    description: 'A blue backpack with patches',
    tags: ['school', 'bag'],
    location: 'Room 204',
    latitude: '35.6892',
    longitude: '51.3890',
    createdAt: '2026-02-01T10:00:00Z',
    comments: [],
    image: null,
    userId: '7',
    itemType: 'lost',
};

describe('ItemDetailModal (no image)', () => {
    beforeEach(() => {
        Object.values(mockedItemService).forEach((fn) => fn.mockReset());
        mockedItemService.getItem.mockResolvedValue(baseItem);
        mockedItemService.createComment.mockResolvedValue({});
        mockedItemService.updateComment.mockResolvedValue({});
        mockedItemService.deleteComment.mockResolvedValue({});
        mockedItemService.reportComment.mockResolvedValue({});
    });

    it('renders basic info and map preview without requiring an image', () => {
        const onClose = vi.fn();
        const onItemChange = vi.fn();

        renderWithProviders(
            <ItemDetailModal
                item={baseItem}
                onClose={onClose}
                onItemChange={onItemChange}
                formatDateTime={(value) => `formatted-${value}`}
                showEditAction
                onEditItem={vi.fn()}
            />,
            { authValue: { auth: { user: { id: '1' } }, isLoggedIn: true } },
        );

        expect(screen.getByRole('heading', { name: /blue backpack/i })).toBeInTheDocument();
        expect(screen.getByText('Room 204')).toBeInTheDocument();
        expect(screen.getByTestId('map-view')).toBeInTheDocument();
        expect(screen.getByText(/Comments \(0\)/)).toBeInTheDocument();
    });

    it('closes when clicking the X button', () => {
        const onClose = vi.fn();

        renderWithProviders(<ItemDetailModal item={baseItem} onClose={onClose} />, {
            authValue: { auth: null, isLoggedIn: false },
        });

        fireEvent.click(screen.getByRole('button', { name: 'X' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('prevents commenting when logged out', async () => {
        renderWithProviders(
            <ItemDetailModal
                isOpen
                onClose={vi.fn()}
                item={baseItem}
                refreshItems={vi.fn()}
            />,
            { authValue: { auth: null, isLoggedIn: false } }
        );

        const textarea = screen.getByPlaceholderText(/Log in to add a comment/i);
        const addButton = screen.getByRole('button', { name: /add comment/i });

        expect(textarea).toBeDisabled();
        expect(addButton).toBeDisabled();

        fireEvent.click(addButton);
        expect(mockedItemService.createComment).not.toHaveBeenCalled();
    });

    it('submits a new comment and refreshes item data', async () => {
        const onItemChange = vi.fn();

        renderWithProviders(
            <ItemDetailModal item={baseItem} onItemChange={onItemChange} />,
            { authValue: { auth: { user: { id: '7' } }, isLoggedIn: true } },
        );

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New comment' } });
        fireEvent.click(screen.getByRole('button', { name: /add comment/i }));

        await waitFor(() => {
            expect(mockedItemService.createComment).toHaveBeenCalledWith('12', 'New comment');
        });
        expect(onItemChange).toHaveBeenCalledTimes(1);
    });

    it('opens report modal for a foreign comment', async () => {
        const itemWithComment = {
            ...baseItem,
            comments: [
                { id: '99', userId: '2', text: 'Nice find', createdAt: '2026-02-01T11:00:00Z' },
            ],
        };

        renderWithProviders(<ItemDetailModal item={itemWithComment} />, {
            authValue: { auth: { user: { id: '7' } }, isLoggedIn: true },
        });

        fireEvent.click(screen.getByRole('button', { name: /report comment/i }));
        expect(screen.getByText('Report comment')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
        await waitFor(() => {
            expect(mockedItemService.reportComment).toHaveBeenCalledWith('12', '99', 'spam', '');
        });
    });
});
