import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('rendert die Dashboard-Komponente', () => {
    render(<App />);
    
    // Check whether important dashboard elements are present
    expect(screen.getByText('Alarmstichwort')).toBeInTheDocument();
    expect(screen.getByText('Alarmeingang')).toBeInTheDocument();
    expect(screen.getByText('Uhrzeit')).toBeInTheDocument();
  });
});