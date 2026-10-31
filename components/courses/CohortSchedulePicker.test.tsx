import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CohortSchedulePicker, formatSchedule } from './CohortSchedulePicker';

describe('formatSchedule', () => {
  test('ordena os dias e junta o intervalo de horas', () => {
    expect(formatSchedule(['Qua', 'Seg'], '18:00', '20:00')).toBe(
      'Seg/Qua 18:00-20:00',
    );
  });
  test('omite o que não foi escolhido', () => {
    expect(formatSchedule([], '', '')).toBe('');
    expect(formatSchedule(['Sex'], '', '')).toBe('Sex');
    expect(formatSchedule([], '09:00', '')).toBe('09:00');
  });
});

describe('CohortSchedulePicker', () => {
  test('emite o horário ao escolher dias e horas', () => {
    const onChange = vi.fn();
    render(<CohortSchedulePicker onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Seg' }));
    fireEvent.click(screen.getByRole('button', { name: 'Qua' }));
    fireEvent.change(screen.getByLabelText('Das'), {
      target: { value: '18:00' },
    });
    fireEvent.change(screen.getByLabelText('Às'), {
      target: { value: '20:00' },
    });
    expect(onChange).toHaveBeenLastCalledWith('Seg/Qua 18:00-20:00');
  });
});
