import { useState, useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useApp, AGENT_BUFFER_HOURS } from '../../context/AppContext';
import type { Agent, Appointment, AgentUnavailablePeriod } from '../../types';
import { formatTime } from '../../utils/helpers';
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
    addAgentUnavailablePeriod,
    removeAgentUnavailablePeriod,
    getAgentUnavailablePeriods,
  } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockStartTime, setBlockStartTime] = useState('09:00');
  const [blockEndTime, setBlockEndTime] = useState('10:00');
  const [blockReason, setBlockReason] = useState('');

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

  // Get blocked slots for a date (from availability)
  const getBlockedSlotsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return agent.availability.filter(s => s.date === dateStr && s.isBooked && !s.bookingId);
  };

  // Get unavailable periods for a date (custom blocked periods)
  const getUnavailablePeriodsForDate = (date: Date): AgentUnavailablePeriod[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return getAgentUnavailablePeriods(agent.id, dateStr);
  };

  // Get buffer slots (configurable hours after completed appointments)
  const getBufferSlotsForDate = (date: Date): string[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const completedAppts = agentAppointments.filter(a => 
      a.date === dateStr && (a.status === 'completed' || a.status === 'done')
    );
    
    const bufferTimes: string[] = [];
    completedAppts.forEach(appt => {
      // Add buffer for configurable hours after end time
      // If no endTime, use startTime + 1 hour as minimum duration
      let endTimeStr = appt.endTime;
      if (!endTimeStr) {
        const [startHours, startMins] = appt.startTime.split(':').map(Number);
        const defaultEndHour = Math.min(startHours + 1, 23);
        endTimeStr = `${String(defaultEndHour).padStart(2, '0')}:${String(startMins).padStart(2, '0')}`;
      }
      const [hours, mins] = endTimeStr.split(':').map(Number);
      for (let i = 0; i < AGENT_BUFFER_HOURS; i++) {
        const bufferHour = hours + i;
        if (bufferHour < 18) { // Don't buffer past 6 PM
          bufferTimes.push(`${String(bufferHour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
        }
      }
    });
    return bufferTimes;
  };

  // Check if a time slot falls within an unavailable period
  const isTimeInUnavailablePeriod = (time: string, unavailablePeriods: AgentUnavailablePeriod[]): AgentUnavailablePeriod | null => {
    return unavailablePeriods.find(period => 
      time >= period.startTime && time < period.endTime
    ) || null;
  };

  // Mark appointment as done
  const handleMarkAsDone = (appointmentId: string) => {
    updateAppointment(appointmentId, { status: 'completed' });
  };

  // Add unavailable period
  const handleAddUnavailablePeriod = () => {
    if (!selectedDate || blockStartTime >= blockEndTime) return;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    addAgentUnavailablePeriod(agent.id, {
      date: dateStr,
      startTime: blockStartTime,
      endTime: blockEndTime,
      reason: blockReason || undefined,
    });
    
    // Reset form
    setShowBlockModal(false);
    setBlockStartTime('09:00');
    setBlockEndTime('10:00');
    setBlockReason('');
  };

  // Remove unavailable period
  const handleRemoveUnavailablePeriod = (periodId: string) => {
    removeAgentUnavailablePeriod(agent.id, periodId);
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
    const unavailablePeriods = getUnavailablePeriodsForDate(dateToShow);

    // Generate time slots from 8 AM to 6 PM
    const timeSlots = [];
    for (let hour = 8; hour <= 17; hour++) {
      timeSlots.push(`${String(hour).padStart(2, '0')}:00`);
    }

    return (
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {format(dateToShow, 'EEEE, MMMM d, yyyy')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>
          <button
            onClick={() => setShowBlockModal(true)}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Mark Unavailable
          </button>
        </div>

        {/* Unavailable Periods Summary */}
        {unavailablePeriods.length > 0 && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <h3 className="text-sm font-medium text-red-800 mb-2">Blocked Periods</h3>
            <div className="space-y-2">
              {unavailablePeriods.map(period => (
                <div key={period.id} className="flex items-center justify-between bg-white p-2 rounded border border-red-200">
                  <div>
                    <span className="font-medium text-red-700">
                      {formatTime(period.startTime)} - {formatTime(period.endTime)}
                    </span>
                    {period.reason && (
                      <span className="text-sm text-gray-600 ml-2">({period.reason})</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveUnavailablePeriod(period.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="divide-y">
          {timeSlots.map(time => {
            const appointment = dayAppointments.find(a => a.startTime === time);
            const isBlocked = blockedSlots.some(s => s.startTime === time);
            const isBuffer = bufferTimes.includes(time);
            const unavailablePeriod = isTimeInUnavailablePeriod(time, unavailablePeriods);
            
            return (
              <div 
                key={time} 
                className={`flex items-stretch min-h-[80px] ${
                  isBuffer ? 'bg-orange-50' : unavailablePeriod ? 'bg-red-50' : ''
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
                            {formatTime(appointment.startTime)}
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
                  ) : unavailablePeriod ? (
                    <div className="p-3 rounded-lg bg-red-100 border border-red-300">
                      <p className="text-sm text-red-700 font-medium">🚫 Unavailable</p>
                      <p className="text-xs text-red-600">
                        {unavailablePeriod.reason || 'Custom blocked period'}
                      </p>
                    </div>
                  ) : isBlocked ? (
                    <div className="p-3 rounded-lg bg-gray-200 border border-gray-300">
                      <p className="text-sm text-gray-600 font-medium">🚫 Blocked</p>
                      <p className="text-xs text-gray-500">Manually blocked slot</p>
                    </div>
                  ) : isBuffer ? (
                    <div className="p-3 rounded-lg bg-orange-100 border border-orange-200">
                      <p className="text-sm text-orange-700 font-medium">⏳ Buffer Period</p>
                      <p className="text-xs text-orange-600">{AGENT_BUFFER_HOURS}-hour rest after completed viewing</p>
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

  // Block time modal
  const renderBlockModal = () => {
    if (!showBlockModal || !selectedDate) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={() => setShowBlockModal(false)}
          ></div>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
            <div className="bg-white px-6 py-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Mark Time as Unavailable
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Block time on {format(selectedDate, 'MMMM d, yyyy')}
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <select
                      value={blockStartTime}
                      onChange={(e) => setBlockStartTime(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    >
                      {Array.from({ length: 10 }, (_, i) => {
                        const hour = 8 + i;
                        const time = `${String(hour).padStart(2, '0')}:00`;
                        return <option key={time} value={time}>{formatTime(time)}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <select
                      value={blockEndTime}
                      onChange={(e) => setBlockEndTime(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    >
                      {Array.from({ length: 10 }, (_, i) => {
                        const hour = 9 + i;
                        const time = `${String(hour).padStart(2, '0')}:00`;
                        return <option key={time} value={time}>{formatTime(time)}</option>;
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="e.g., Lunch break, Personal event"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  />
                </div>

                {blockStartTime >= blockEndTime && (
                  <p className="text-sm text-red-600">End time must be after start time</p>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUnavailablePeriod}
                  disabled={blockStartTime >= blockEndTime}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Block Time
                </button>
              </div>
            </div>
          </div>
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
            <p className="text-gray-600 mt-1">View and manage your appointments and availability</p>
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
              <span className="w-3 h-3 rounded-full bg-red-400 mr-2"></span>
              <span className="text-gray-600">Unavailable</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-orange-300 mr-2"></span>
              <span className="text-gray-600">Buffer ({AGENT_BUFFER_HOURS}hr post-viewing)</span>
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
                const unavailablePeriods = getUnavailablePeriodsForDate(day);
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
                      {dayAppointments.slice(0, 2).map(appt => (
                        <div
                          key={appt.id}
                          className={`text-xs p-1 rounded truncate ${getStatusBgColor(appt.status)}`}
                          title={`${formatTime(appt.startTime)} - ${getProperty(appt.propertyId)?.title}`}
                        >
                          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${getStatusColor(appt.status)}`}></span>
                          {formatTime(appt.startTime)}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{dayAppointments.length - 2} more
                        </div>
                      )}
                      {unavailablePeriods.length > 0 && (
                        <div className="text-xs p-1 rounded bg-red-100 text-red-700">
                          {unavailablePeriods.length} blocked
                        </div>
                      )}
                      {blockedSlots.length > 0 && dayAppointments.length === 0 && unavailablePeriods.length === 0 && (
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

        {/* Block Time Modal */}
        {renderBlockModal()}
      </div>
    </div>
  );
}
