import { useState } from 'react';
import type { Agent } from '../../types';
import { useApp } from '../../context/AppContext';
import { getInitials } from '../../utils/helpers';

interface AgentRatingModalProps {
  agent: Agent | undefined;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * AgentRatingModal - Modal for customers to rate agents after a completed viewing.
 * 
 * Displays:
 * - Agent info (name, current rating)
 * - 1-5 star rating selector
 * - Optional feedback textarea
 * 
 * Access: Only available to customers for completed appointments (status: 'done' or 'completed')
 */
export default function AgentRatingModal({
  agent,
  onClose,
  onSuccess,
}: AgentRatingModalProps) {
  const { currentUser, addAgentRating } = useApp();
  
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!agent || !currentUser) {
      setError('Unable to submit rating. Please try again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      addAgentRating(
        agent.id,
        currentUser.id,
        currentUser.name,
        rating,
        comment.trim()
      );

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch {
      setError('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStar = (starNumber: number) => {
    const isActive = (hoverRating || rating) >= starNumber;
    
    return (
      <button
        key={starNumber}
        type="button"
        onClick={() => setRating(starNumber)}
        onMouseEnter={() => setHoverRating(starNumber)}
        onMouseLeave={() => setHoverRating(0)}
        className={`p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded ${
          isActive ? 'text-yellow-400' : 'text-gray-300'
        }`}
        aria-label={`Rate ${starNumber} star${starNumber > 1 ? 's' : ''}`}
      >
        <svg
          className="w-8 h-8"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </button>
    );
  };

  const getRatingLabel = () => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return labels[hoverRating || rating] || '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="rating-modal-title">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
          role="button"
          aria-label="Close modal"
          tabIndex={-1}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          {/* Header */}
          <div className="bg-yellow-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 id="rating-modal-title" className="text-xl font-semibold text-white">
                Rate Your Experience
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Agent Info */}
            {agent && (
              <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {getInitials(agent.name)}
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900">{agent.name}</p>
                  <p className="text-sm text-gray-500">
                    Current Rating: {agent.rating.toFixed(1)} ★
                  </p>
                </div>
              </div>
            )}

            {/* Star Rating */}
            <div className="mb-6 text-center">
              <p className="text-sm text-gray-600 mb-3">How was your viewing experience?</p>
              <div className="flex justify-center space-x-1">
                {[1, 2, 3, 4, 5].map(renderStar)}
              </div>
              <p className="mt-2 text-sm font-medium text-yellow-600 h-5">
                {getRatingLabel()}
              </p>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                Feedback (optional)
              </label>
              <textarea
                id="feedback"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm p-3 border"
                placeholder="Share your experience with this agent..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
