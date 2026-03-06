import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Root layout that provides AppContext to all routes
function RootLayout() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Outlet />
      </AppProvider>
    </ErrorBoundary>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'customers', element: <Customers /> },
          { path: 'customers/:id', element: <CustomerDetails /> },
          { path: 'reports', element: <Reports /> },
          { path: 'settings', element: <Settings /> },
        ],
      },
    ],
  },
]);

function App() {
  console.log("App component executing...");
  return <RouterProvider router={router} />;
}

export default App;
