import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate, formatTimeRange, formatRelativeTime, getInitials } from '../../utils/helpers';
import type { Appointment } from '../../types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
  const {
    currentUser,
    appointments,
    properties,
    agents,
    canMessage,
    getMessagesByAppointment,
    sendMessage,
  } = useApp();

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newMessage, setNewMessage] = useState('');

  if (!currentUser) return null;

  // Get user's appointments that can have messaging
  const userAppointments = appointments.filter(a => {
    if (currentUser.role === 'customer') {
      return a.customerId === currentUser.id && (a.status === 'accepted' || a.status === 'scheduled');
    } else if (currentUser.role === 'agent') {
      return a.agentId === currentUser.id && (a.status === 'accepted' || a.status === 'scheduled');
    }
    return false;
  });

  const getProperty = (id: string) => properties.find(p => p.id === id);
  const getAgent = (id: string) => agents.find(a => a.id === id);

  const handleSendMessage = () => {
    if (selectedAppointment && newMessage.trim()) {
      sendMessage(selectedAppointment.id, newMessage);
      setNewMessage('');
    }
  };

  const selectedMessages = selectedAppointment 
    ? getMessagesByAppointment(selectedAppointment.id) 
    : [];
  
  const selectedProperty = selectedAppointment 
    ? getProperty(selectedAppointment.propertyId) 
    : null;
  
  const selectedAgent = selectedAppointment 
    ? getAgent(selectedAppointment.agentId) 
    : null;

  const canMessageSelected = selectedAppointment 
    ? canMessage(selectedAppointment.id) 
    : false;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          role="button"
          aria-label="Close chat"
          tabIndex={0}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-drawer-title"
      >
        {/* Header */}
        <div className="bg-blue-800 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h2 id="chat-drawer-title" className="text-lg font-semibold text-white">Messages</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex h-[calc(100%-64px)]">
          {/* Appointments List */}
          <div className={`${selectedAppointment ? 'hidden sm:block' : ''} w-full sm:w-1/2 border-r border-gray-200 overflow-y-auto`}>
            <div className="p-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Appointments</h3>
            </div>
            
            {userAppointments.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm">No active appointments</p>
                <p className="text-xs mt-1">Book a viewing to start chatting</p>
              </div>
            ) : (
              <div>
                {userAppointments.map(apt => {
                  const property = getProperty(apt.propertyId);
                  const agent = getAgent(apt.agentId);
                  const messages = getMessagesByAppointment(apt.id);
                  const lastMessage = messages[messages.length - 1];
                  const canChat = canMessage(apt.id);
                  
                  return (
                    <button
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedAppointment?.id === apt.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {property?.title?.charAt(0) || 'P'}
                        </div>
                        <div className="ml-3 flex-grow min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {property?.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {currentUser.role === 'customer' 
                              ? `Agent: ${agent?.name}` 
                              : `Customer: ${apt.customerName || 'Customer'}`}
                          </p>
                          {lastMessage && (
                            <p className="text-xs text-gray-400 truncate mt-1">
                              {lastMessage.content}
                            </p>
                          )}
                          {!canChat && (
                            <p className="text-xs text-yellow-600 mt-1">
                              SMS verification required
                            </p>
                          )}
                        </div>
                        {messages.length > 0 && (
                          <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full ml-2">
                            {messages.length}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className={`${selectedAppointment ? '' : 'hidden sm:flex'} flex-1 flex flex-col sm:w-1/2`}>
            {selectedAppointment ? (
              <>
                {/* Chat Header */}
                <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center">
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="sm:hidden mr-2 p-1 hover:bg-gray-200 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex-grow min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {selectedProperty?.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(selectedAppointment.date)} • {formatTimeRange(selectedAppointment.startTime, selectedAppointment.endTime)}
                    </p>
                  </div>
                  {selectedAgent && currentUser.role === 'customer' && (
                    <div className="flex items-center ml-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                        {getInitials(selectedAgent.name)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {!canMessageSelected ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-4 bg-yellow-50 rounded-lg max-w-xs">
                        <svg className="w-10 h-10 mx-auto mb-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm text-yellow-700">
                          Messaging requires both parties to verify their phone via SMS.
                        </p>
                      </div>
                    </div>
                  ) : selectedMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-sm text-gray-500">No messages yet</p>
                        <p className="text-xs text-gray-400 mt-1">Start a conversation!</p>
                      </div>
                    </div>
                  ) : (
                    selectedMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.senderId === currentUser.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-white shadow-sm'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.senderId === currentUser.id ? 'text-blue-200' : 'text-gray-400'
                          }`}>
                            {formatRelativeTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                {canMessageSelected && (
                  <div className="p-3 bg-white border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-grow rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-4">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm text-gray-500">Select an appointment to chat</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
