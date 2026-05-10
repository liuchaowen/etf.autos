/**
 * Button 组件
 * 基于 shadcn/ui 设计的简化版本
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'destructive';
    size?: 'default' | 'sm' | 'lg';
    children: React.ReactNode;
}

export function Button({
    variant = 'default',
    size = 'default',
    className,
    children,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center rounded-md font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                // 变体样式
                variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
                variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
                variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                // 尺寸样式
                size === 'default' && 'h-10 px-4 py-2 text-sm',
                size === 'sm' && 'h-8 px-3 text-xs',
                size === 'lg' && 'h-12 px-6 text-base',
                className
            )}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}