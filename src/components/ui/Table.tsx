'use client';

import { ReactNode } from 'react';

interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => ReactNode;
    width?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string;
    onRowClick?: (item: T) => void;
    loading?: boolean;
    emptyMessage?: string;
}

export function DataTable<T>({
    columns,
    data,
    keyExtractor,
    onRowClick,
    loading = false,
    emptyMessage = 'Nenhum registro encontrado',
}: DataTableProps<T>) {
    if (loading) {
        return (
            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col.key} style={{ width: col.width }}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i}>
                                {columns.map((col) => (
                                    <td key={col.key}>
                                        <div
                                            className="skeleton"
                                            style={{ height: '20px', width: '80%' }}
                                        ></div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col.key} style={{ width: col.width }}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem' }}>
                                <div className="text-muted">{emptyMessage}</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="table-wrapper">
            <table className="table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} style={{ width: col.width }}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item) => (
                        <tr
                            key={keyExtractor(item)}
                            onClick={() => onRowClick?.(item)}
                            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                        >
                            {columns.map((col) => (
                                <td key={col.key}>
                                    {col.render
                                        ? col.render(item)
                                        : (item as Record<string, unknown>)[col.key]?.toString() || '-'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Simple pagination
interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between mt-lg">
            <span className="text-sm text-muted">
                Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-sm">
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    ← Anterior
                </button>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Próximo →
                </button>
            </div>
        </div>
    );
}
