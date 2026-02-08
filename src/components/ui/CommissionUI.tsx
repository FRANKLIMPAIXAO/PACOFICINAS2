'use client'

import * as React from 'react'

// Helper for class names
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ')
}

// --- Card Components ---
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("card", className)}
            {...props}
        />
    )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("card-header", className)}
            {...props}
        />
    )
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={cn("card-title", className)}
            {...props}
        />
    )
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("card-body", className)} {...props} />
    )
}

// --- Button Component ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        const variants = {
            default: "btn-primary",
            destructive: "btn-danger",
            outline: "btn-secondary", // Outline mapeado para secondary por enquanto
            secondary: "btn-secondary",
            ghost: "btn-ghost",
            link: "btn-ghost text-primary-600 underline", // Link customizado
        }

        const sizes = {
            default: "",
            sm: "btn-sm",
            lg: "btn-lg",
            icon: "btn-icon",
        }

        return (
            <button
                ref={ref}
                className={cn(
                    "btn",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

// --- Badge Component ---
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
    const variants: Record<string, string> = {
        default: "badge-info",
        secondary: "badge-gray",
        destructive: "badge-error",
        outline: "badge-gray border border-gray-300",
        success: "badge-success",
        warning: "badge-warning"
    }

    return (
        <div
            className={cn(
                "badge",
                variants[variant] || variants.default,
                className
            )}
            {...props}
        />
    )
}

// --- Tabs Component ---
// Adaptado para usar estilos do globals.css ou styles inline simples para layout
export function Tabs({ value, onValueChange, children, className }: any) {
    return (
        <TabsContext.Provider value={{ value, onValueChange }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    )
}

const TabsContext = React.createContext<{ value?: string, onValueChange?: (v: string) => void }>({});

export function TabsList({ className, children }: any) {
    return (
        <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 mb-4", className)}>
            {children}
        </div>
    )
}

export function TabsTrigger({ value, children, className }: any) {
    const context = React.useContext(TabsContext);
    const isActive = context.value === value;
    return (
        <button
            type="button"
            onClick={() => context.onValueChange?.(value)}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive ? "bg-white text-gray-950 shadow-sm" : "hover:bg-gray-200 hover:text-gray-900",
                className
            )}
        >
            {children}
        </button>
    )
}

export function TabsContent({ value, children, className }: any) {
    const context = React.useContext(TabsContext);
    if (context.value !== value) return null;
    return (
        <div className={cn("mt-2 animate-in fade-in-50", className)}>
            {children}
        </div>
    )
}

// --- Input Component ---
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "form-input",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

// --- Label Component ---
export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ className, ...props }, ref) => (
        <label
            ref={ref}
            className={cn(
                "form-label",
                className
            )}
            {...props}
        />
    )
)
Label.displayName = "Label"

// --- Select Component ---
// Simplificando o Select para usar HTML nativo styled com .form-select
// Isso garante compatibilidade com o CSS global e evita complexidade desnecessária
export function Select({ value, onValueChange, children }: any) {
    // Extrair options dos children (assumindo estrutura simples)
    // Se a estrutura for complexa, mantemos a implementação customizada mas ajustamos o estilo

    // Vamos manter a implementação customizada por enquanto para compatibilidade com a API, 
    // mas ajustar as classes internas
    const [open, setOpen] = React.useState(false);
    return (
        <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
            <div className="relative w-full">{children}</div>
        </SelectContext.Provider>
    )
}

const SelectContext = React.createContext<{
    value?: string,
    onValueChange?: (v: string) => void,
    open?: boolean,
    setOpen?: (v: boolean) => void
}>({});

export function SelectTrigger({ children, className }: any) {
    const { open, setOpen } = React.useContext(SelectContext);
    return (
        <button
            type="button"
            onClick={() => setOpen?.(!open)}
            className={cn(
                "form-input flex items-center justify-between cursor-pointer", // Usando estilo de input
                className
            )}
        >
            {children}
            <span className="ml-2 opacity-50">▼</span>
        </button>
    )
}

export function SelectValue({ placeholder }: any) {
    const { value } = React.useContext(SelectContext);
    // Aqui seria ideal mapear valor -> label, mas simplificando mostra o valor ou placeholder
    return <span>{value || placeholder}</span>;
}

export function SelectContent({ children }: any) {
    const { open } = React.useContext(SelectContext);
    if (!open) return null;
    return (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white p-1 shadow-lg animate-in fade-in-0 zoom-in-95">
            {children}
        </div>
    )
}

export function SelectItem({ value, children }: any) {
    const { onValueChange, setOpen, value: currentValue } = React.useContext(SelectContext);
    const isSelected = currentValue === value;
    return (
        <div
            onClick={() => {
                onValueChange?.(value);
                setOpen?.(false);
            }}
            className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-gray-100",
                isSelected && "bg-primary-50 text-primary-700 font-medium"
            )}
        >
            {children}
        </div>
    )
}

