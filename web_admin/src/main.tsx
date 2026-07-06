import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './lib/auth-context';
import { routeTree } from './routeTree.gen';

import './styles.css';

console.log('[IMIRIRE] Starting app initialization...');
console.log('[IMIRIRE] Route tree:', routeTree);

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

console.log('[IMIRIRE] QueryClient created');

// Create router instance
type AppRouter = ReturnType<typeof createRouter>;
let router: AppRouter | undefined;
try {
  router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });
  console.log('[IMIRIRE] Router created successfully');
} catch (error) {
  console.error('[IMIRIRE] Router creation failed:', error);
  throw error;
}

if (!router) {
  throw new Error('[IMIRIRE] Router initialization failed');
}

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}

// Mount the app
console.log('[IMIRIRE] Mounting React app...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[IMIRIRE] Root element not found!');
} else {
  console.log('[IMIRIRE] Root element found, creating React root...');
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RouterProvider router={router}>
              <Toaster richColors position="top-right" />
            </RouterProvider>
          </AuthProvider>
        </QueryClientProvider>
      </React.StrictMode>
    );
    console.log('[IMIRIRE] React app rendered successfully!');
  } catch (error) {
    console.error('[IMIRIRE] Render failed:', error);
    // Render error message directly
    rootElement.innerHTML = `
      <div style="padding: 40px; font-family: system-ui">
        <h1 style="color: red">App Failed to Load</h1>
        <pre style="background: #f5f5f5; padding: 20px; overflow: auto">${error}</pre>
      </div>
    `;
  }
}

