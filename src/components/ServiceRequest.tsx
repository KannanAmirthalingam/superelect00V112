import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Send, 
  AlertCircle,
  Calendar,
  User,
  FileText,
  Loader,
  X,
  CheckCircle
} from 'lucide-react';
import { useBoards, useMills, useServicePartners } from '../hooks/useFirebaseData';
import { Board } from '../types';
import { format } from 'date-fns';

export const ServiceRequest: React.FC = () => {
  const { boards, updateBoard, loading } = useBoards();
  const { mills } = useMills();
  const { servicePartners } = useServicePartners();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [millFilter, setMillFilter] = useState('all');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  // Get boards that are available for service (In Use status)
  const availableBoards = boards.filter(board => board.currentStatus === 'In Use');

  const filteredBoards = availableBoards.filter(board => {
    const matchesSearch = board.boardId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         board.millAssigned.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMill = millFilter === 'all' || board.millAssigned === millFilter;
    return matchesSearch && matchesMill;
  });

  const ServiceRequestForm: React.FC<{ 
    board?: Board; 
    onClose: () => void; 
  }> = ({ board, onClose }) => {
    const [formData, setFormData] = useState({
      boardId: board?.boardId || '',
      millName: board?.millAssigned || '',
      issueDescription: '',
      servicePartner: '',
      priority: 'Medium' as 'High' | 'Medium' | 'Low',
      substituteBoard: '',
      expectedDays: '7'
    });
    const [submitting, setSubmitting] = useState(false);

    // Get available substitute boards (boards with SMW-S- prefix that are not in use)
    const availableSubstitutes = boards.filter(b => 
      b.boardId.startsWith('SMW-S-') && 
      b.currentStatus === 'In Use' && 
      !boards.some(board => board.substituteBoard === b.boardId)
    );

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);

      try {
        const selectedBoard = boards.find(b => b.boardId === formData.boardId);
        if (selectedBoard) {
          // Update the main board status
          await updateBoard(selectedBoard.id, {
            currentStatus: 'Sent for Service',
            currentLocation: formData.servicePartner,
            substituteBoard: formData.substituteBoard || undefined,
            updatedAt: new Date()
          });

          // If substitute board is assigned, update its status
          if (formData.substituteBoard) {
            const substituteBoard = boards.find(b => b.boardId === formData.substituteBoard);
            if (substituteBoard) {
              await updateBoard(substituteBoard.id, {
                currentLocation: formData.millName,
                updatedAt: new Date()
              });
            }
          }
        }
        onClose();
      } catch (error) {
        console.error('Failed to create service request:', error);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Create Service Request</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Board ID</label>
                <select 
                  required
                  value={formData.boardId}
                  onChange={(e) => {
                    const selectedBoard = boards.find(b => b.boardId === e.target.value);
                    setFormData({
                      ...formData, 
                      boardId: e.target.value,
                      millName: selectedBoard?.millAssigned || ''
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Board</option>
                  {availableBoards.map(board => (
                    <option key={board.id} value={board.boardId}>
                      {board.boardId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mill Name</label>
                <input
                  type="text"
                  value={formData.millName}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Issue Description</label>
              <textarea
                required
                value={formData.issueDescription}
                onChange={(e) => setFormData({...formData, issueDescription: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe the issue in detail..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Partner</label>
                <select 
                  required
                  value={formData.servicePartner}
                  onChange={(e) => setFormData({...formData, servicePartner: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Service Partner</option>
                  {servicePartners.map(partner => (
                    <option key={partner.id} value={partner.name}>
                      {partner.name} (Avg: {partner.avgRepairTime} days)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select 
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Substitute Board (Optional)</label>
                <select 
                  value={formData.substituteBoard}
                  onChange={(e) => setFormData({...formData, substituteBoard: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Substitute Required</option>
                  {availableSubstitutes.map(board => (
                    <option key={board.id} value={board.boardId}>
                      {board.boardId} - Available
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Service Days</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.expectedDays}
                  onChange={(e) => setFormData({...formData, expectedDays: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Service Request Summary</h4>
                  <div className="mt-2 text-sm text-blue-800">
                    <p>• Board <strong>{formData.boardId}</strong> will be sent to <strong>{formData.servicePartner}</strong></p>
                    <p>• Mill: <strong>{formData.millName}</strong></p>
                    {formData.substituteBoard && (
                      <p>• Substitute board <strong>{formData.substituteBoard}</strong> will be deployed</p>
                    )}
                    <p>• Expected return in <strong>{formData.expectedDays} days</strong></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.boardId || !formData.servicePartner}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
              >
                {submitting && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Create Service Request
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const BoardCard: React.FC<{ board: Board }> = ({ board }) => {
    const getWarrantyColor = (status: string) => {
      switch (status) {
        case 'Under Service Warranty': return 'text-green-600 bg-green-50';
        case 'Under Replacement Warranty': return 'text-blue-600 bg-blue-50';
        case 'Out of Warranty': return 'text-red-600 bg-red-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{board.boardId}</h3>
            <p className="text-sm text-gray-600">{board.millAssigned}</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              Available
            </span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getWarrantyColor(board.warrantyStatus)}`}>
              {board.warrantyStatus}
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Purchased: {format(board.purchaseDate, 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Warranty expires: {format(board.warrantyExpiry, 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FileText className="h-4 w-4 mr-2" />
            <span>Service history: {board.serviceHistory.length} times</span>
          </div>
        </div>

        <button
          onClick={() => setSelectedBoard(board)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <Send className="h-4 w-4 mr-2" />
          Send for Service
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading boards...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Request</h2>
          <p className="text-gray-600 mt-1">Create outward service requests for electronic boards</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-900">{availableBoards.length} Boards Available</p>
              <p className="text-xs text-blue-700">Ready for service requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Board ID or Mill name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={millFilter}
              onChange={(e) => setMillFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Mills</option>
              {mills.map(mill => (
                <option key={mill.id} value={mill.name}>{mill.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Available Boards Grid */}
      {filteredBoards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBoards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Boards Available</h3>
          <p className="text-gray-500">
            {searchTerm || millFilter !== 'all' 
              ? 'No boards match your current filters.' 
              : 'All boards are currently in service or not available for service requests.'
            }
          </p>
        </div>
      )}

      {/* Service Request Form Modal */}
      {selectedBoard && (
        <ServiceRequestForm 
          board={selectedBoard}
          onClose={() => setSelectedBoard(null)} 
        />
      )}
      {showRequestForm && (
        <ServiceRequestForm 
          onClose={() => setShowRequestForm(false)} 
        />
      )}
    </div>
  );
};