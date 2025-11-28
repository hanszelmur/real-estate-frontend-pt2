import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { Agent } from '../../types';
import { getInitials } from '../../utils/helpers';

export default function AgentSettings() {
  const { currentUser, updateAgentProfile, updateAgentSmsVerification } = useApp();

  // Hooks must be called before any conditional returns
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [showSmsVerify, setShowSmsVerify] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [smsSuccess, setSmsSuccess] = useState(false);

  // Redirect if not logged in as agent
  if (!currentUser || currentUser.role !== 'agent') {
    return <Navigate to="/login" replace />;
  }

  const agent = currentUser as Agent;

  const handleSaveProfile = () => {
    updateAgentProfile(agent.id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSendSmsCode = () => {
    // DEMO: In production, this would send an actual SMS code
    setShowSmsVerify(true);
  };

  const handleVerifySms = () => {
    // DEMO: In production, this would validate the actual SMS code
    // For demo, any 6-digit code works
    if (smsCode.length === 6) {
      updateAgentSmsVerification(agent.id, true);
      setSmsSuccess(true);
      setShowSmsVerify(false);
      setSmsCode('');
      setTimeout(() => setSmsSuccess(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          to="/agent/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-1">Manage your agent profile and preferences</p>
        </div>

        {/* Success Messages */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">✓ Profile saved successfully!</p>
          </div>
        )}
        {smsSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">✓ Phone number verified successfully!</p>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
          
          {/* Profile Picture */}
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {agent.profilePicUrl ? (
                <img 
                  src={agent.profilePicUrl} 
                  alt={agent.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(agent.name)
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Profile Picture</p>
              <p className="text-xs text-gray-400 mt-1">
                Profile pictures can be changed via URL in a future update
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your full name"
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="your.email@example.com"
            />
          </div>

          {/* Phone */}
          <div className="mb-6">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+63 912 345 6789"
            />
          </div>

          <button
            onClick={handleSaveProfile}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>

        {/* SMS Verification Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Phone Verification</h2>
          
          <div className={`p-4 rounded-lg mb-4 ${agent.smsVerified ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded-full mr-3 ${agent.smsVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <div>
                <p className={agent.smsVerified ? 'text-green-800 font-medium' : 'text-yellow-800 font-medium'}>
                  {agent.smsVerified ? 'Phone Verified' : 'Phone Not Verified'}
                </p>
                <p className={`text-sm ${agent.smsVerified ? 'text-green-700' : 'text-yellow-700'}`}>
                  {agent.smsVerified 
                    ? 'You can send and receive messages with customers and view their contact info.'
                    : 'Verify your phone to enable messaging and view customer contact information.'}
                </p>
              </div>
            </div>
          </div>

          {!agent.smsVerified && (
            <>
              {!showSmsVerify ? (
                <button
                  onClick={handleSendSmsCode}
                  disabled={!phone}
                  className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {phone ? 'Send Verification Code' : 'Enter phone number first'}
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    A 6-digit code has been sent to {phone}. Enter it below to verify.
                  </p>
                  <p className="text-xs text-gray-400">
                    (Demo: Enter any 6-digit code to verify)
                  </p>
                  <input
                    type="text"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowSmsVerify(false)}
                      className="flex-1 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleVerifySms}
                      disabled={smsCode.length !== 6}
                      className="flex-1 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Agent Stats (Read Only) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Agent Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-3xl font-bold text-blue-800">{agent.rating.toFixed(1)}</p>
              <p className="text-sm text-blue-600">Rating</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-3xl font-bold text-green-800">{agent.salesCount}</p>
              <p className="text-sm text-green-600">Properties Sold</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            Stats are updated automatically based on your performance
          </p>
        </div>
      </div>
    </div>
  );
}
