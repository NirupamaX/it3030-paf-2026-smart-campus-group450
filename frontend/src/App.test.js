import { render, screen } from '@testing-library/react';
import App from './App';

test('renders CampusX branding', () => {
  render(<App />);
  expect(screen.getAllByText(/CampusX/i).length).toBeGreaterThan(0);
});
