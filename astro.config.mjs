// @ts-check
import { defineConfig } from 'astro/config';
import VitePWA from '@vite-pwa/astro';
import vercel from '@astrojs/vercel';
import clerk from '@clerk/astro';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [
    clerk({
      // Authentication configuration
      signInUrl: '/user/sign-in',
      signUpUrl: '/user/sign-up',
      afterSignInUrl: '/',
      afterSignUpUrl: '/',
      
      // Appearance customization
      appearance: {
        variables: {
          colorPrimary: '#6366f1',
          colorText: '#374151',
          colorBackground: '#ffffff',
          colorInputBackground: '#f9fafb',
          colorInputText: '#374151',
        },
        elements: {
          formButtonPrimary: 'auth-button',
          card: 'auth-card',
          headerTitle: 'auth-title',
          headerSubtitle: 'auth-subtitle',
          socialButtonsBlockButton: 'social-button',
          socialButtonsBlockButtonText: 'social-button-text',
          formFieldInput: 'form-input',
          formFieldLabel: 'form-label',
          footerActionLink: 'footer-link'
        }
      },
      
      // Localization
      localization: {
        signUp: {
          start: {
            subtitle: 'to access MathWise',
          },
          emailCode: {
            subtitle: 'to access MathWise',
          },
        },
        signIn: {
          start: {
            subtitle: 'to access MathWise',
          },
        },
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['/favicon.svg', '/favicon.ico'],
      manifest: {
        name: 'M.A.T.H.Wise',
        short_name: 'MathWise',
        description: 'AI Math Study Partner',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        icons: []
      },
      devOptions: {
        enabled: true
      }
    }),
  ],
});
