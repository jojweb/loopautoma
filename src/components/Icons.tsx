import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const baseProps = {
    stroke: "currentColor",
    fill: "none",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
} as const;

export function RefreshIcon({ size = 18, ...props }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} {...baseProps} {...props}>
            <path d="M3 12a9 9 0 0 1 15-6" />
            <path d="M21 12a9 9 0 0 1-15 6" />
            <polyline points="3 4 3 10 9 10" />
            <polyline points="21 20 21 14 15 14" />
        </svg>
    );
}

export function TrashIcon({ size = 18, ...props }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} {...baseProps} {...props}>
            <path d="M3 6h18" />
            <path d="M8 6l1-2h6l1 2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
    );
}

export function InfoIcon({ size = 18, ...props }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} {...baseProps} {...props}>
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
            <line x1="12" y1="12" x2="12" y2="16" />
        </svg>
    );
}

export function KeyboardIcon({ size = 18, ...props }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} {...baseProps} {...props}>
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path d="M7 10h.01M11 10h.01M15 10h.01M19 10h.01M5 14h14" />
        </svg>
    );
}

export function MouseIcon({ size = 18, ...props }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} {...baseProps} {...props}>
            <rect x="7" y="3" width="10" height="18" rx="5" />
            <line x1="12" y1="7" x2="12" y2="11" />
        </svg>
    );
}

export function SparklesIcon({ size = 18, ...props }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} {...baseProps} {...props}>
            <path d="M12 2l1.7 4.8L18 8.5l-3.8 2.7L15 16l-3-2.2L9 16l.8-4.8L6 8.5l4.3-1.7L12 2z" />
            <path d="M4 17l.8 2 .8-2 .8 2 .8-2" />
            <path d="M17 18l.5 1.5.5-1.5.5 1.5.5-1.5" />
        </svg>
    );
}

export function PlusIcon({ size = 18, ...props }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} {...baseProps} {...props}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

export function ScissorsIcon({ size = 18, ...props }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} {...baseProps} {...props}>
            <circle cx="6" cy="6" r="2.5" />
            <circle cx="6" cy="18" r="2.5" />
            <line x1="20" y1="4" x2="8" y2="12" />
            <line x1="20" y1="20" x2="8" y2="12" />
        </svg>
    );
}

export function SettingsIcon({ size = 18, ...props }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} {...baseProps} {...props}>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 3v1.5M12 19.5V21M5.64 5.64l1.06 1.06M17.3 17.3l1.06 1.06M3 12h1.5M19.5 12H21M5.64 18.36l1.06-1.06M17.3 6.7l1.06-1.06" />
            <path d="M15.73 4.27l-0.86 0.86a8 8 0 0 1 0 13.74l0.86 0.86a9 9 0 0 0 0-15.46zM8.27 4.27l0.86 0.86a8 8 0 0 0 0 13.74l-0.86 0.86a9 9 0 0 1 0-15.46z" />
        </svg>
    );
}