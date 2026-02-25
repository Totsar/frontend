import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ItemCardsGrid from './ItemCardsGrid';

const items = [
    {
        id: '1',
        title: 'Lost Wallet',
        description: 'Black leather wallet',
        tags: ['wallet'],
        location: 'Library',
        createdAt: '2026-02-01T10:00:00Z',
        image: null,
        itemType: 'lost',
    },
    {
        id: '2',
        title: 'Found Keys',
        description: 'Set of keys with a red tag',
        tags: ['keys'],
        location: 'Cafeteria',
        createdAt: '2026-02-02T12:00:00Z',
        image: null,
        itemType: 'found',
    },
];

describe('ItemCardsGrid (no image)', () => {
    it('renders items without requiring images', () => {
        render(
            <ItemCardsGrid
                items={items}
                loading={false}
                error={null}
                onItemClick={vi.fn()}
            />,
        );

        expect(screen.getByText('Lost Wallet')).toBeInTheDocument();
        expect(screen.getByText('Found Keys')).toBeInTheDocument();
        expect(screen.getByText('Library')).toBeInTheDocument();
        expect(screen.getByText('Cafeteria')).toBeInTheDocument();
    });

    it('renders empty state when no items', () => {
        render(
            <ItemCardsGrid
                items={[]}
                loading={false}
                error={null}
                onItemClick={vi.fn()}
            />,
        );

        expect(screen.getByText(/no items found/i)).toBeInTheDocument();
    });

    it('renders empty state even when loading', () => {
        render(
            <ItemCardsGrid
                items={[]}
                loading
                error={null}
                onItemClick={vi.fn()}
            />,
        );

        expect(screen.getByText(/no items found/i)).toBeInTheDocument();
    });

    it('renders empty state even when error exists', () => {
        render(
            <ItemCardsGrid
                items={[]}
                loading={false}
                error="Something went wrong"
                onItemClick={vi.fn()}
            />,
        );

        expect(screen.getByText(/no items found/i)).toBeInTheDocument();
    });
});
