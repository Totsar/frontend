import React from 'react';
import { render } from '@testing-library/react';
import { AuthContext } from '../../src/context/AuthContext';

export function renderWithProviders(ui, { authValue } = {}) {
    const Wrapper = ({ children }) => (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );

    return render(ui, { wrapper: Wrapper });
}
