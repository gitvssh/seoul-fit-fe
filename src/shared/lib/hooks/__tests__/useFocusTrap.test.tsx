import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useFocusTrap } from '../useFocusTrap';

function Harness() {
  const [open, setOpen] = React.useState(false);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open, () => setOpen(false));
  return (
    <>
      <button type='button' onClick={() => setOpen(true)}>
        Open
      </button>
      {open && (
        <div ref={dialogRef} role='dialog' tabIndex={-1}>
          <button type='button'>First</button>
          <button type='button'>Last</button>
        </div>
      )}
    </>
  );
}

describe('useFocusTrap', () => {
  it('moves focus inside, wraps Tab, closes on Escape, and restores focus', () => {
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open' });
    opener.focus();
    fireEvent.click(opener);

    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });
    expect(first).toHaveFocus();

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
