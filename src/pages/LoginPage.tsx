import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';
import type { ReactNode } from 'react';
import { mockAgents } from '../data/mockData';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, agents } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [selectedAgentId, setSelectedAgentId] = useState<string>(mockAgents[0].id);

  const handleLogin = () => {
    if (selectedRole === 'agent') {
      login(selectedRole, selectedAgentId);
      navigate('/agent/dashboard');
    } else if (selectedRole === 'admin') {
      login(selectedRole);
      navigate('/admin/dashboard');
    } else {
      login(selectedRole);
      navigate('/');
    }
  };

  const roles: { role: UserRole; label: string; description: string; icon: ReactNode }[] = [
    {
      role: 'customer',
      label: 'Customer',
      description: 'Browse properties and book viewings',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      role: 'agent',
      label: 'Agent',
      description: 'Manage bookings and availability',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      role: 'admin',
      label: 'Admin',
      description: 'Manage assignments and handle complaints',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Demo Login</h1>
          <p className="text-gray-600">
            Select a role to explore the TES Properties platform
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4 mb-6">
            {roles.map(({ role, label, description, icon }) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  selectedRole === role
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center">
                  <div className={`${selectedRole === role ? 'text-blue-600' : 'text-gray-400'} mr-4`}>
                    {icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-gray-500">{description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Agent selection */}
          {selectedRole === 'agent' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Agent Account
              </label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              >
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} {agent.isOnVacation ? '(On Vacation)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue as {roles.find(r => r.role === selectedRole)?.label}
          </button>

          <p className="mt-4 text-xs text-center text-gray-500">
            This is a demo login for testing purposes. No real authentication is performed.
          </p>
        </div>

        {/* Role access info */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Security Notice</h3>
          <p className="text-sm text-yellow-700">
            Each role has restricted access. Customers cannot access agent or admin dashboards.
            Agents cannot access admin features. All access is role-gated for security.
          </p>
        </div>
      </div>
    </div>
  );
}
