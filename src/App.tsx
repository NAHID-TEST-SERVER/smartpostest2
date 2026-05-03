/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PosPage from './pages/Pos/PosPage';
import AdminLayout from './pages/Admin/AdminLayout';
import Dashboard from './pages/Admin/Dashboard';
import Products from './pages/Admin/Products';
import Customers from './pages/Admin/Customers';
import Reports from './pages/Admin/Reports';
import Login from './pages/Admin/Login';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PosPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="login" element={<Login />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="customers" element={<Customers />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
