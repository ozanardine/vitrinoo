import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import { Profile } from './pages/Profile.tsx';
import { Store } from './pages/Store.tsx';
import { TinyCallback } from './pages/TinyCallback.tsx';
import { Layout } from './components/Layout.tsx';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><App /></Layout>,
  },
  {
    path: '/profile',
    element: <Layout><Profile /></Layout>,
  },
  {
    path: '/tiny-callback',
    element: <TinyCallback />,
  },
  {
    path: '/:slug',
    element: <Store />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);