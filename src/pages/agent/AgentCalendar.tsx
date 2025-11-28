import { useState, useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { Agent, Appointment } from '../../types';
import { formatTime, formatTimeRange } from '../../utils/helpers';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import AppointmentDetailModal from '../../components/common/AppointmentDetailModal';

type ViewMode = 'month' | 'day';

export default function AgentCalendar() {
  const {
    currentUser,
    appointments,
    properties,
    users,
    updateAppointment,
  } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Get agent's appointments - useMemo must be before conditional return
  const agentId = currentUser?.id;
  const agentAppointments = useMemo(() => 
    agentId 
      ? appointments.filter(a => 
          a.agentId === agentId && 
          (a.status === 'scheduled' || a.status === 'pending' || a.status === 'accepted' || a.status === 'completed')
        )
      : []
  , [appointments, agentId]);

  // Redirect if not logged in as agent
  if (!currentUser || currentUser.role !== 'agent') {
    return <Navigate to="/login" replace />;
  }

  const agent = currentUser as Agent;

  // Get dates for month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return agentAppointments.filter(a => a.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Get blocked slots for a date
  const getBlockedSlotsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return agent.availability.filter(s => s.date === dateStr && s.isBooked && !s.bookingId);
  };

  // Get buffer slots (2 hours after completed appointments)
  const getBufferSlotsForDate = (date: Date): string[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const completedAppts = agentAppointments.filter(a => 
      a.date === dateStr && (a.status === 'completed' || a.status === 'done')
    );
    
    const bufferTimes: string[] = [];
    completedAppts.forEach(appt => {
      // Add buffer for 2 hours after end time
      const endTimeStr = appt.endTime || appt.startTime; // Default to startTime if no endTime
      const [hours, mins] = endTimeStr.split(':').map(Number);
      for (let i = 0; i < 2; i++) {
        const bufferHour = hours + i;
        if (bufferHour < 18) { // Don't buffer past 6 PM
          bufferTimes.push(`${String(bufferHour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
        }
      }
    });
    return bufferTimes;
  };

  // Mark appointment as done
  const handleMarkAsDone = (appointmentId: string) => {
    updateAppointment(appointmentId, { status: 'completed' });
  };

  // Navigation
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getProperty = (id: string) => properties.find(p => p.id === id);
  const getCustomer = (id: string) => users.find(u => u.id === id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 border-yellow-300';
      case 'accepted': return 'bg-green-100 border-green-300';
      case 'scheduled': return 'bg-blue-100 border-blue-300';
      case 'completed': return 'bg-gray-100 border-gray-300';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  // Day view content
  const renderDayView = () => {
    const dateToShow = selectedDate || new Date();
    const dayAppointments = getAppointmentsForDate(dateToShow);
    const blockedSlots = getBlockedSlotsForDate(dateToShow);
    const bufferTimes = getBufferSlotsForDate(dateToShow);

    // Generate time slots from 8 AM to 6 PM
    const timeSlots = [];
    for (let hour = 8; hour <= 17; hour++) {
      timeSlots.push(`${String(hour).padStart(2, '0')}:00`);
    }

    return (
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">
            {format(dateToShow, 'EEEE, MMMM d, yyyy')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>

        <div className="divide-y">
          {timeSlots.map(time => {
            const appointment = dayAppointments.find(a => a.startTime === time);
            const isBlocked = blockedSlots.some(s => s.startTime === time);
            const isBuffer = bufferTimes.includes(time);
            
            return (
              <div 
                key={time} 
                className={`flex items-stretch min-h-[80px] ${
                  isBuffer ? 'bg-orange-50' : ''
                }`}
              >
                {/* Time column */}
                <div className="w-24 flex-shrink-0 p-3 text-right border-r bg-gray-50">
                  <span className="text-sm font-medium text-gray-600">{formatTime(time)}</span>
                </div>

                {/* Content column */}
                <div className="flex-grow p-3">
                  {appointment ? (
                    <div 
                      className={`p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getStatusBgColor(appointment.status)}`}
                      onClick={() => setSelectedAppointment(appointment)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {getProperty(appointment.propertyId)?.title || 'Property'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatTimeRange(appointment.startTime, appointment.endTime)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Customer: {appointment.customerName || getCustomer(appointment.customerId)?.name}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full text-white ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                          {appointment.status === 'accepted' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsDone(appointment.id);
                              }}
                              className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              Mark Done
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : isBlocked ? (
                    <div className="p-3 rounded-lg bg-gray-200 border border-gray-300">
                      <p className="text-sm text-gray-600 font-medium">🚫 Blocked</p>
                      <p className="text-xs text-gray-500">Manually blocked slot</p>
                    </div>
                  ) : isBuffer ? (
                    <div className="p-3 rounded-lg bg-orange-100 border border-orange-200">
                      <p className="text-sm text-orange-700 font-medium">⏳ Buffer Period</p>
                      <p className="text-xs text-orange-600">2-hour rest after completed viewing</p>
                    </div>
                  ) : (
                    <div className="p-3 text-sm text-gray-400 italic">
                      Available
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <Link
              to="/agent/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-2"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1">View and manage your appointments</p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-4">
            <div className="inline-flex rounded-lg bg-gray-200 p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'month' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'day' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Day
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex items-center justify-between p-4 border-b">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                Today
              </button>
            </div>

            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 border-b text-sm">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
              <span className="text-gray-600">Pending</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              <span className="text-gray-600">Accepted</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
              <span className="text-gray-600">Scheduled</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-gray-400 mr-2"></span>
              <span className="text-gray-600">Completed</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-gray-300 mr-2"></span>
              <span className="text-gray-600">Blocked</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-orange-300 mr-2"></span>
              <span className="text-gray-600">Buffer (2hr post-viewing)</span>
            </div>
          </div>
        </div>

        {viewMode === 'month' ? (
          /* Month View */
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-gray-100 border-b">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dayAppointments = getAppointmentsForDate(day);
                const blockedSlots = getBlockedSlotsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                return (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedDate(day);
                      setViewMode('day');
                    }}
                    className={`min-h-[100px] p-2 border-b border-r cursor-pointer transition-colors ${
                      !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'hover:bg-blue-50'
                    } ${isSelected ? 'bg-blue-100' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isTodayDate 
                        ? 'w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center' 
                        : ''
                    }`}>
                      {format(day, 'd')}
                    </div>

                    {/* Appointments preview */}
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map(appt => (
                        <div
                          key={appt.id}
                          className={`text-xs p-1 rounded truncate ${getStatusBgColor(appt.status)}`}
                          title={`${formatTime(appt.startTime)} - ${getProperty(appt.propertyId)?.title}`}
                        >
                          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${getStatusColor(appt.status)}`}></span>
                          {formatTime(appt.startTime)}
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                      {blockedSlots.length > 0 && dayAppointments.length === 0 && (
                        <div className="text-xs p-1 rounded bg-gray-200 text-gray-600">
                          {blockedSlots.length} blocked
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Day View */
          renderDayView()
        )}

        {/* Appointment Detail Modal */}
        {selectedAppointment && (
          <AppointmentDetailModal
            appointment={selectedAppointment}
            property={getProperty(selectedAppointment.propertyId)}
            agent={agent}
            customer={getCustomer(selectedAppointment.customerId)}
            onClose={() => setSelectedAppointment(null)}
            mode="agent"
          />
        )}
      </div>
    </div>
  );
}
