import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import InputField from '../../components/InputField';

describe('InputField component', () => {
  it('renders a label and an input', () => {
    render(<InputField label="Email" id="email" value="" onChange={() => {}} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('shows an error message when the error prop is set', () => {
    render(
      <InputField
        label="Email"
        id="email"
        value=""
        onChange={() => {}}
        error="Invalid email"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
  });

  it('sets aria-invalid when there is an error', () => {
    render(
      <InputField
        label="Email"
        id="email"
        value=""
        onChange={() => {}}
        error="Required"
      />,
    );
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('calls onChange when the user types', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <InputField label="Name" id="name" value="" onChange={handleChange} />,
    );
    await user.type(screen.getByLabelText(/name/i), 'a');

    expect(handleChange).toHaveBeenCalled();
  });

  it('marks the input as required when the required prop is true', () => {
    render(
      <InputField
        label="Email"
        id="email"
        value=""
        onChange={() => {}}
        required
      />,
    );
    expect(screen.getByLabelText(/email/i)).toBeRequired();
  });

  it('renders without a label when label is not provided', () => {
    const { container } = render(
      <InputField id="hidden" value="" onChange={() => {}} />,
    );
    expect(container.querySelector('label')).toBeNull();
  });
});
