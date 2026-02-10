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
				}
			},
			fontFamily: {
				sans: [
					"Inter",
					"ui-sans-serif",
					"system-ui",
					"-apple-system",
					"Segoe UI",
					"Roboto",
					"Noto Sans",
					"Ubuntu",
					"Cantarell",
					"Helvetica Neue",
					"Arial",
					"sans-serif"
				],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
			'fall': {
				'0%': {
					transform: 'translateY(-100px) rotate(0deg)',
					opacity: '1'
				},
				'100%': {
					transform: 'translateY(100vh) rotate(360deg)',
					opacity: '0.5'
				}
			},
			'fade-out': {
				'0%': {
					opacity: '1'
				},
				'100%': {
					opacity: '0'
				}
			},
			'drop-in': {
				'0%': {
					transform: 'scale(1.05)',
					opacity: '0.8'
				},
				'50%': {
					transform: 'scale(0.97)'
				},
				'100%': {
					transform: 'scale(1)',
					opacity: '1'
				}
			},
			'shake': {
				'0%, 100%': { transform: 'translateX(0)' },
				'10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
				'20%, 40%, 60%, 80%': { transform: 'translateX(2px)' }
			},
			'drop-settle': {
				'0%': { 
					transform: 'scale(1.03)', 
					boxShadow: '0 10px 25px rgba(0,0,0,0.15)' 
				},
				'60%': { 
					transform: 'scale(0.98)' 
				},
				'100%': { 
					transform: 'scale(1)', 
					boxShadow: 'none' 
				}
			},
			'typing': {
				'0%': { width: '0' },
				'100%': { width: '100%' }
			}
			},
		animation: {
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out',
			'fall': 'fall 2.5s ease-in forwards',
			'fade-out': 'fade-out 0.3s ease-out forwards',
			'fade-in': 'fade-in 0.3s ease-out forwards',
			'drop-in': 'drop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
			'shake': 'shake 0.4s ease-in-out',
			'drop-settle': 'drop-settle 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
			'typing': 'typing 1s steps(30, end) forwards'
		}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
