import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Property } from '../../types';
import { formatCurrency, truncateText } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';
import EditPropertyModal from './EditPropertyModal';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const { currentUser } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Check if user can edit this property
  const canEdit = currentUser && (
    currentUser.role === 'admin' || 
    (currentUser.role === 'agent' && property.assignedAgentId === currentUser.id)
  );

  const statusBadge = {
    available: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    sold: 'bg-red-100 text-red-800',
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEditModal(true);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 relative">
        <Link to={`/properties/${property.id}`}>
          <div className="relative">
            <img
              src={property.imageUrl}
              alt={property.title}
              className="w-full h-48 object-cover"
            />
            <span
              className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge[property.status]}`}
            >
              {property.status}
            </span>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">
              {property.title}
            </h3>
            <p className="text-gray-500 text-sm mb-2">
              {property.address}, {property.city}
            </p>
            <p className="text-blue-700 font-bold text-xl mb-3">
              {formatCurrency(property.price)}
            </p>
            <p className="text-gray-600 text-sm mb-3">
              {truncateText(property.description, 100)}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {property.bedrooms} beds
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                {property.bathrooms} baths
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                {property.sqft} sqm
              </span>
            </div>
          </div>
        </Link>
        
        {/* Edit Button for agents/admins */}
        {canEdit && (
          <button
            onClick={handleEditClick}
            className="absolute top-3 left-3 px-2 py-1 bg-white bg-opacity-90 hover:bg-opacity-100 text-blue-600 rounded-full text-xs font-semibold flex items-center shadow-sm hover:shadow transition-all"
            title="Edit Property"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        )}
      </div>

      {/* Edit Property Modal */}
      {showEditModal && (
        <EditPropertyModal
          property={property}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
