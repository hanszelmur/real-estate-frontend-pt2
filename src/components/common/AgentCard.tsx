import type { Agent } from '../../types';
import { generateStars, getInitials } from '../../utils/helpers';

interface AgentCardProps {
  agent: Agent;
  selected?: boolean;
  onSelect?: (agent: Agent) => void;
  showSelectButton?: boolean;
}

export default function AgentCard({ agent, selected, onSelect, showSelectButton = true }: AgentCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-blue-300'
      }`}
    >
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {getInitials(agent.name)}
        </div>
        
        {/* Info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">{agent.name}</h4>
            {agent.isOnVacation && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                On Vacation
              </span>
            )}
          </div>
          
          <div className="flex items-center mt-1">
            <span className="text-yellow-500 text-sm">{generateStars(agent.rating)}</span>
            <span className="text-gray-500 text-sm ml-2">({agent.rating.toFixed(1)})</span>
          </div>
          
          <p className="text-gray-500 text-sm mt-1">
            {agent.salesCount} properties sold
          </p>
        </div>
      </div>

      {showSelectButton && onSelect && !agent.isOnVacation && (
        <button
          onClick={() => onSelect(agent)}
          className={`mt-3 w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            selected
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {selected ? 'Selected' : 'Select Agent'}
        </button>
      )}
    </div>
  );
}
