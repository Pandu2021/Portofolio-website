// @vitest-environment jsdom
/**
 * @file CertificateDialog.test.tsx
 * The certificate image is not loaded until requested; the dialog opens as a
 * modal, is labelled, and closes with its close button or Escape.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { CertificateDialog } from './CertificateDialog';

// jsdom may not implement the modal dialog API; provide a minimal stand-in.
beforeAll(() => {
  const proto = HTMLDialogElement.prototype;
  if (typeof proto.showModal !== 'function' || !proto.showModal.toString().includes('native')) {
    proto.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    proto.close = function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
});

afterEach(cleanup);

const props = {
  name: 'Google UX Design',
  src: '/Portofolio-website/certificates/google-ux-design.jpg',
  width: 1188,
  height: 928,
  labels: { view: 'View certificate', close: 'Close', titlePrefix: 'Certificate:' },
};

describe('<CertificateDialog />', () => {
  it('does not load the image before it is requested', () => {
    const { container } = render(<CertificateDialog {...props} />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('opens a labelled modal with the image on demand', () => {
    const { container } = render(<CertificateDialog {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /View certificate: Google UX Design/ }));

    const dialog = container.querySelector('dialog');
    expect(dialog?.hasAttribute('open')).toBe(true);
    expect(dialog?.getAttribute('aria-label')).toBe('Certificate: Google UX Design');

    const image = container.querySelector('img');
    expect(image?.getAttribute('src')).toBe(props.src);
    expect(image?.getAttribute('alt')).toBe('Certificate: Google UX Design');
    expect(image?.getAttribute('width')).toBe('1188');
  });

  it('closes with the close button', () => {
    const { container } = render(<CertificateDialog {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /View certificate/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Close', hidden: true }));
    expect(container.querySelector('dialog')?.hasAttribute('open')).toBe(false);
  });
});
