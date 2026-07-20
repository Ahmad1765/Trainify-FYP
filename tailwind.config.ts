import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: [
					'Inter',
					'-apple-system',
					'BlinkMacSystemFont',
					'Segoe UI',
					'Roboto',
					'sans-serif',
				],
			},
			fontSize: {
				// Display scale — page titles feel distinct from card headers.
				'display-2xl': ['4.5rem', { lineHeight: '1.02', letterSpacing: '-0.035em', fontWeight: '800' }],
				'display-xl': ['3.5rem', { lineHeight: '1.04', letterSpacing: '-0.03em', fontWeight: '800' }],
				'display-lg': ['2.75rem', { lineHeight: '1.08', letterSpacing: '-0.025em', fontWeight: '700' }],
				'display-md': ['2rem', { lineHeight: '1.12', letterSpacing: '-0.02em', fontWeight: '700' }],
				'display-sm': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '700' }],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Fitness app palette — retuned for a layered, premium dark theme.
				// Keys are unchanged so existing classes pick up the new look; only
				// the values are refined (tamed green + green-tinted charcoal surfaces).
				fitness: {
					black: '#080B0A',        // deepest surface (sidebar, overlays)
					green: '#1FDD80',        // primary brand accent (tamed from #00FF7F)
					'light-green': '#7DF0B4',// gradient companion / soft highlights
					'green-deep': '#12A862', // pressed / darker accent
					gray: '#93A29B',         // muted body text
					'dark-gray': '#232B27',  // inner elements, borders, inputs
					background: '#0C0F0E',   // app background (near #121212, faint green)
					'card-bg': '#151A18',    // elevated card surface
					'card-elevated': '#1C231F', // second elevation layer
					success: '#34D399',
					error: '#F0616D',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			boxShadow: {
				'elevation-1': '0 1px 2px 0 rgba(0,0,0,0.4), 0 1px 3px 0 rgba(0,0,0,0.3)',
				'elevation-2': '0 4px 12px -2px rgba(0,0,0,0.5), 0 2px 6px -2px rgba(0,0,0,0.4)',
				'elevation-3': '0 16px 40px -12px rgba(0,0,0,0.65), 0 6px 16px -8px rgba(0,0,0,0.5)',
				'glow': '0 0 0 1px rgba(31,221,128,0.35), 0 8px 30px -8px rgba(31,221,128,0.35)',
				'glow-sm': '0 0 16px -4px rgba(31,221,128,0.45)',
			},
			backgroundImage: {
				'brand-gradient': 'linear-gradient(135deg, #1FDD80 0%, #7DF0B4 100%)',
				'radial-glow': 'radial-gradient(600px circle at var(--x,50%) var(--y,0%), rgba(31,221,128,0.12), transparent 70%)',
				'grid-faint': 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' }
				},
				'fade-in-up': {
					from: { opacity: '0', transform: 'translateY(12px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					from: { opacity: '0', transform: 'scale(0.96)' },
					to: { opacity: '1', transform: 'scale(1)' }
				},
				'shimmer': {
					'100%': { transform: 'translateX(100%)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 0 0 rgba(31,221,128,0.35)' },
					'50%': { boxShadow: '0 0 0 8px rgba(31,221,128,0)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.4s ease-out both',
				'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
				'scale-in': 'scale-in 0.35s cubic-bezier(0.22,1,0.36,1) both',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
