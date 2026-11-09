'use client';
/**
 * @file CertificateDialog.tsx
 * "View certificate" button + modal image viewer built on the native
 * `<dialog>` element (focus trap, Escape to close and focus return are
 * provided by the browser).
 *
 * The image is lazy: it is only added to the page the first time the dialog
 * opens, so certificates cost no bandwidth until someone asks to see them.
 */
import { useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

interface CertificateDialogProps {
  /** Certificate name, used in the dialog title and image alt text. */
  name: string;
  /** Image URL (already prefixed with the base path). */
  src: string;
  width: number;
  height: number;
  labels: { view: string; close: string; titlePrefix: string };
}

/** Button that opens the certificate image in an accessible modal dialog. */
export function CertificateDialog({ name, src, width, height, labels }: CertificateDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [requested, setRequested] = useState(false);

  const open = () => {
    setRequested(true);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button type="button" className="btn btn--ghost btn--sm" onClick={open}>
        <Icon name="image" size={16} />
        {labels.view}
        <span className="sr-only">: {name}</span>
      </button>

      <dialog
        ref={dialogRef}
        className="cert-dialog"
        aria-label={`${labels.titlePrefix} ${name}`}
        // Clicking the dimmed backdrop (the dialog element itself) closes it.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="cert-dialog__header">
          <p className="cert-dialog__title">{name}</p>
          <button type="button" className="icon-button" onClick={close} aria-label={labels.close}>
            <Icon name="close" size={20} />
          </button>
        </div>
        {requested && (
          // Plain <img>: the site is a static export and the JPGs are pre-optimized,
          // so next/image would add JavaScript without any benefit here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="cert-dialog__image"
            src={src}
            alt={`${labels.titlePrefix} ${name}`}
            width={width}
            height={height}
            decoding="async"
          />
        )}
      </dialog>
    </>
  );
}
