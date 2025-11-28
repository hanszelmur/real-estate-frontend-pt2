import { useState } from 'react';
import { useApp } from '../context/AppContext';
import PropertyCard from '../components/common/PropertyCard';
import AddPropertyModal from '../components/common/AddPropertyModal';

export default function PropertiesPage() {
  const { properties, currentUser } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [bedroomFilter, setBedroomFilter] = useState<string>('all');
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);

  // Check if user is customer (or not logged in - public view)
  const isCustomerView = !currentUser || currentUser.role === 'customer';
  
  // Check if user can add properties (agents and admins only)
  const canAddProperty = currentUser && (currentUser.role === 'agent' || currentUser.role === 'admin');

  // Filter properties - hide sold properties from customer view
  const filteredProperties = properties.filter(property => {
    // Hide sold properties from customers/public view
    if (isCustomerView && property.status === 'sold') return false;
    
    // Status filter (only show sold option for agents/admins)
    if (statusFilter !== 'all' && property.status !== statusFilter) return false;
    
    // Price range filter
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number);
      if (max && (property.price < min || property.price > max)) return false;
      if (!max && property.price < min) return false;
    }
    
    // Bedroom filter
    if (bedroomFilter !== 'all') {
      const beds = parseInt(bedroomFilter, 10);
      if (bedroomFilter.includes('+')) {
        if (property.bedrooms < beds) return false;
      } else {
        if (property.bedrooms !== beds) return false;
      }
    }
    
    return true;
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <section className="bg-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Our Properties</h1>
              <p className="text-blue-200">
                Discover your perfect property in Davao City and surrounding areas
              </p>
            </div>
            {canAddProperty && (
              <button
                onClick={() => setShowAddPropertyModal(true)}
                className="flex items-center px-4 py-2 bg-white text-blue-800 rounded-md hover:bg-blue-50 font-medium transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Property
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white shadow-sm py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                {/* Only show Sold option for agents/admins */}
                {!isCustomerView && <option value="sold">Sold</option>}
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              >
                <option value="all">Any Price</option>
                <option value="0-5000000">Under ₱5M</option>
                <option value="5000000-10000000">₱5M - ₱10M</option>
                <option value="10000000-20000000">₱10M - ₱20M</option>
                <option value="20000000-50000000">₱20M - ₱50M</option>
                <option value="50000000">Above ₱50M</option>
              </select>
            </div>

            {/* Bedroom Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
              <select
                value={bedroomFilter}
                onChange={(e) => setBedroomFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              >
                <option value="all">Any</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3 Bedrooms</option>
                <option value="4">4 Bedrooms</option>
                <option value="5+">5+ Bedrooms</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setPriceRange('all');
                  setBedroomFilter('all');
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Property Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gray-600 mb-6">
            Showing {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'}
          </p>

          {filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-500">Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Add Property Modal */}
      {showAddPropertyModal && (
        <AddPropertyModal
          onClose={() => setShowAddPropertyModal(false)}
        />
      )}
    </div>
  );
}
