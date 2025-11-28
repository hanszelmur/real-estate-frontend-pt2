import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import LoginPage from './pages/LoginPage';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerSettings from './pages/customer/CustomerSettings';
import AgentDashboard from './pages/agent/AgentDashboard';
import AgentSettings from './pages/agent/AgentSettings';
import AgentCalendar from './pages/agent/AgentCalendar';
import AdminDashboard from './pages/admin/AdminDashboard';
import './index.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="properties" element={<PropertiesPage />} />
            <Route path="properties/:id" element={<PropertyDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="customer/dashboard" element={<CustomerDashboard />} />
            <Route path="customer/settings" element={<CustomerSettings />} />
            <Route path="agent/dashboard" element={<AgentDashboard />} />
            <Route path="agent/settings" element={<AgentSettings />} />
            <Route path="agent/calendar" element={<AgentCalendar />} />
            {/* Admin dashboard on separate undiscoverable path */}
            <Route path="internal/admin/dashboard" element={<AdminDashboard />} />
            {/* Legacy path redirect for admin */}
            <Route path="admin/dashboard" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
