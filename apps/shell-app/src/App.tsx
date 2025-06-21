// Shell App - Main Application Component (Simplified)

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Simple components
const HomePage = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold">Welcome to Shell App</h1>
    <p className="mt-4">This is the main shell application for microfrontend orchestration.</p>
  </div>
);

const LoginPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Login</h1>
    <p className="mt-4">Login functionality will be implemented here.</p>
  </div>
);

const NotFoundPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
    <p className="mt-4">The page you&apos;re looking for doesn&apos;t exist.</p>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold">Shell App</h1>
                </div>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {/* @ts-ignore - React Router JSX compatibility */}
            <Routes>
              {/* @ts-ignore */}
              <Route path="/" element={<HomePage />} />
              {/* @ts-ignore */}
              <Route path="/login" element={<LoginPage />} />
              {/* @ts-ignore */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
