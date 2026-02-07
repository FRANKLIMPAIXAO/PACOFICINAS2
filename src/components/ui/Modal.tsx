'use client';

import { ReactNode, useState } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
    if (!isOpen) return null;

    const sizeStyles = {
        sm: { maxWidth: '400px' },
        md: { maxWidth: '500px' },
        lg: { maxWidth: '700px' },
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                style={sizeStyles[size]}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    loading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'primary',
    loading = false,
}: ConfirmModalProps) {
    const buttonClass = variant === 'danger' ? 'btn-danger' : variant === 'warning' ? 'btn-warning' : 'btn-primary';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </button>
                    <button className={`btn ${buttonClass}`} onClick={onConfirm} disabled={loading}>
                        {loading ? <span className="spinner" style={{ width: 16, height: 16 }}></span> : confirmText}
                    </button>
                </>
            }
        >
            <p>{message}</p>
        </Modal>
    );
}
