import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency, getInitials, generateStars } from '../utils/helpers';
import BookingModal from '../components/booking/BookingModal';
import EditPropertyModal from '../components/common/EditPropertyModal';
import ImageGallery from '../components/common/ImageGallery';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProperty, currentUser, getAppointmentsByProperty, getAgent } = useApp();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const property = getProperty(id || '');

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h2>
          <Link to="/properties" className="text-blue-600 hover:underline">
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  // Get assigned agent for this property
  const assignedAgent = property.assignedAgentId ? getAgent(property.assignedAgentId) : undefined;
  
  // Check if user can edit this property
  const canEdit = currentUser && (
    currentUser.role === 'admin' || 
    (currentUser.role === 'agent' && property.assignedAgentId === currentUser.id)
  );

  const existingAppointments = getAppointmentsByProperty(property.id);
  const hasExistingViewer = existingAppointments.some(a => a.status !== 'cancelled');

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 5000);
  };

  const statusBadge = {
    available: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    sold: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Success message */}
      {bookingSuccess && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">Booking Confirmed!</p>
              <p className="text-sm">View your appointment in your dashboard.</p>
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>

      {/* Property header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Image Gallery */}
          <div className="relative">
            {/* Status Badge - positioned absolutely over the gallery */}
            <div className="absolute top-4 right-4 z-10">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${statusBadge[property.status]}`}>
                {property.status}
              </span>
            </div>
            {/* Edit Button for agents/admins */}
            {canEdit && (
              <button
                onClick={() => setShowEditModal(true)}
                className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 text-blue-600 rounded-md text-sm font-medium flex items-center shadow-sm hover:shadow transition-all"
                title="Edit Property"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Property
              </button>
            )}
            {/* Display gallery if multiple images, otherwise single image */}
            <div className="p-4">
              <ImageGallery 
                images={property.imageUrls && property.imageUrls.length > 0 
                  ? property.imageUrls 
                  : [property.imageUrl]} 
                title={property.title} 
              />
            </div>
          </div>

          {/* Info */}
          <div className="p-6 pt-2">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-grow">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                <p className="text-gray-600 mb-4">
                  {property.address}, {property.city}
                </p>
                <p className="text-3xl font-bold text-blue-700">
                  {formatCurrency(property.price)}
                </p>
              </div>

              {/* Booking CTA */}
              <div className="mt-6 lg:mt-0 lg:ml-8">
                {property.status === 'sold' ? (
                  <div className="text-center p-4 bg-gray-100 rounded-lg">
                    <p className="text-gray-600 font-medium">This property has been sold</p>
                  </div>
                ) : currentUser ? (
                  currentUser.role === 'customer' ? (
                    <div>
                      <button
                        onClick={() => setShowBookingModal(true)}
                        className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Schedule a Viewing
                      </button>
                      {hasExistingViewer && property.firstViewerCustomerId !== currentUser.id && (
                        <p className="mt-2 text-sm text-yellow-600">
                          ⚠️ Another customer has priority for this property
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Login as a customer to book a viewing
                    </p>
                  )
                ) : (
                  <Link
                    to="/login"
                    className="block w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
                  >
                    Login to Book
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Property details */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-600 leading-relaxed">{property.description}</p>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Race Logic Notice - Only shown to non-owners */}
            {hasExistingViewer && property.status === 'pending' && 
             currentUser && currentUser.role === 'customer' && 
             property.firstViewerCustomerId !== currentUser.id && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-1">Priority Notice</h3>
                    <p className="text-yellow-700 text-sm">
                      This property is currently being viewed by another customer who has priority purchase rights. 
                      You may still schedule a viewing, but you can only purchase if the first viewer declines.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Property specs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Details</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bedrooms</span>
                  <span className="font-medium">{property.bedrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bathrooms</span>
                  <span className="font-medium">{property.bathrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Floor Area</span>
                  <span className="font-medium">{property.sqft} sqm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location</span>
                  <span className="font-medium">{property.city}</span>
                </div>
              </div>
            </div>

            {/* Assigned Agent with Ratings */}
            {assignedAgent && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Listing Agent</h2>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {getInitials(assignedAgent.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-gray-900">{assignedAgent.name}</p>
                    <div className="flex items-center">
                      <span className="text-yellow-500">{generateStars(assignedAgent.rating)}</span>
                      <span className="ml-2 text-gray-600">{assignedAgent.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-sm text-gray-500">{assignedAgent.salesCount} properties sold</p>
                  </div>
                </div>
                
                {/* Latest Reviews */}
                {assignedAgent.latestRatings.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Reviews</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {assignedAgent.latestRatings.slice(0, 3).map(rating => (
                        <div key={rating.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{rating.customerName}</span>
                            <span className="text-yellow-500 text-sm">{generateStars(rating.rating)}</span>
                          </div>
                          {rating.comment && (
                            <p className="text-sm text-gray-600">{rating.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Booking info */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-blue-800 mb-2">How Booking Works</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start">
                  <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">1</span>
                  Choose an agent or let us assign one
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">2</span>
                  Select an available time slot
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">3</span>
                  Confirm your booking
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">4</span>
                  Change agent anytime from your dashboard
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          property={property}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Edit Property Modal */}
      {showEditModal && (
        <EditPropertyModal
          property={property}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
