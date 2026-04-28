/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                // ──── Chart Colors (shadcn/ui style) ────
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))',
                },
                // ──── Airbnb Design System Colors ────
                // Primary Brand
                'rausch': '#ff385c',
                'rausch-deep': '#e00b41',

                // Product Tier Colors
                'plus-magenta': '#92174d',
                'luxe-purple': '#460479',

                // Surface & Background
                'canvas-white': '#ffffff',
                'soft-cloud': '#f7f7f7',
                'hairline-gray': '#dddddd',

                // Neutrals & Text
                'ink-black': '#222222',
                'charcoal': '#3f3f3f',
                'ash-gray': '#6a6a6a',
                'mute-gray': '#929292',
                'stone-gray': '#c1c1c1',

                // Semantic
                'error-red': '#c13515',
                'error-deep': '#b32505',
                'info-blue': '#428bff',

                // Translucent
                'translucent-black': 'rgba(0, 0, 0, 0.24)',
                'translucent-light': 'rgba(0, 0, 0, 0.02)',
            },
            fontFamily: {
                // Airbnb Cereal VF with fallbacks
                'airbnb': ['"Airbnb Cereal VF"', 'Circular', '-apple-system', 'system-ui', 'Roboto', '"Helvetica Neue"', 'sans-serif'],
            },
            fontSize: {
                // ──── Airbnb Typography Scale ────
                'section-heading': ['28px', { lineHeight: '1.43', letterSpacing: '0', fontWeight: '700' }],
                'subsection-heading': ['22px', { lineHeight: '1.18', letterSpacing: '-0.44px', fontWeight: '500' }],
                'card-title': ['21px', { lineHeight: '1.43', letterSpacing: '0', fontWeight: '700' }],
                'listing-title': ['20px', { lineHeight: '1.20', letterSpacing: '-0.18px', fontWeight: '600' }],
                'subtitle-bold': ['16px', { lineHeight: '1.25', letterSpacing: '0', fontWeight: '600' }],
                'body-medium': ['16px', { lineHeight: '1.25', letterSpacing: '0', fontWeight: '500' }],
                'button-large': ['16px', { lineHeight: '1.25', letterSpacing: '0', fontWeight: '500' }],
                'button-default': ['14px', { lineHeight: '1.29', letterSpacing: '0', fontWeight: '500' }],
                'link': ['14px', { lineHeight: '1.43', letterSpacing: '0', fontWeight: '500' }],
                'caption-medium': ['14px', { lineHeight: '1.29', letterSpacing: '0', fontWeight: '500' }],
                'caption-bold': ['14px', { lineHeight: '1.43', letterSpacing: '0', fontWeight: '600' }],
                'caption-small': ['13px', { lineHeight: '1.23', letterSpacing: '0', fontWeight: '400' }],
                'micro-default': ['12px', { lineHeight: '1.33', letterSpacing: '0', fontWeight: '400' }],
                'micro-bold': ['12px', { lineHeight: '1.33', letterSpacing: '0', fontWeight: '700' }],
                'badge-uppercase': ['11px', { lineHeight: '1.18', letterSpacing: '0', fontWeight: '600' }],
                'superscript': ['8px', { lineHeight: '1.25', letterSpacing: '0.32px', fontWeight: '700' }],
            },
            borderRadius: {
                'none': '0',
                'sm': '4px',
                'DEFAULT': '8px',
                'md': '8px',
                'lg': '14px',
                'xl': '20px',
                '2xl': '32px',
                'full': '50%',
            },
            spacing: {
                // Airbnb 8px base unit scale
                '0.5': '2px',
                '1': '4px',
                '1.5': '6px',
                '2': '8px',
                '2.5': '10px',
                '3': '12px',
                '3.5': '14px',
                '4': '16px',
                '5': '20px',
                '6': '24px',
                '7': '28px',
                '8': '32px',
                '9': '36px',
                '10': '40px',
                '11': '44px',
                '12': '48px',
                '14': '56px',
                '16': '64px',
                '18': '72px',
                '20': '80px',
            },
            maxWidth: {
                'airbnb': '1760px',
                'airbnb-content': '1280px',
            },
            boxShadow: {
                // Level 1: Active/pressed icon buttons
                'airbnb-1': 'rgba(0, 0, 0, 0.08) 0 4px 12px',
                // Level 2: Booking panel, modals, dropdowns (three-layer elevation)
                'airbnb-2': 'rgba(0, 0, 0, 0.02) 0 0 0 1px, rgba(0, 0, 0, 0.04) 0 2px 6px 0, rgba(0, 0, 0, 0.1) 0 4px 8px 0',
                // Search bar subtle floating feel
                'search': 'rgba(0, 0, 0, 0.04) 0 2px 6px 0',
            },
            transitionDuration: {
                '200': '200ms',
            },
            transitionTimingFunction: {
                'airbnb': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
        },
    },
    plugins: [],
};