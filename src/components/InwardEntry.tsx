import React, { useState } from 'react';
import { 
  ArrowDownCircle, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Loader,
  X,
  Save
} from 'lucide-react';
import { useBoards, useMills, useServicePartners } from '../hooks/useFirebaseData';
import { Board } from '../types';
import { format, differenceInDays } from 'date-fns';

export const InwardEntry: React.FC = () => {
  const { boards, updateBoard, loading } = useBoards();
  const { mills } = useMills();
  const { servicePartners } = useServicePartners();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  // Get boards that are in service (Sent for Service, In Repair, Repaired)
  const serviceBoards = boards.filter(board => 
    board.currentStatus === 'Sent for Service' || 
    board.currentStatus === 'In Repair' || 
    board.currentStatus === 'Repaired'
  );

  const filteredBoards = serviceBoards.filter(board => {
    const matchesSearch = board.boardId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         board.millAssigned.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         board.currentLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || board.currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sent for Service': return 'bg-yellow-100 text-yellow-800';
      case 'In Repair': return 'bg-blue-100 text-blue-800';
      case 'Repaired': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (daysInService: number) => {
    if (daysInService > 14) return 'text-red-600';
    if (daysInService > 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  const InwardEntryForm: React.FC<{ 
    board: Board; 
    onClose: () => void; 
  }> = ({ board, onClose }) => {
    const [formData, setFormData] = useState({
      serviceResult: 'Repaired' as 'Repaired' | 'Replaced' | 'Not Repairable',
      serviceNotes: '',
      serviceCost: '',
      actualDays: '',
      returnSubstitute: board.substituteBoard ? true : false,
      newWarrantyPeriod: '',
      servicePartnerRating: '4'
    });
    const [submitting, setSubmitting] = useState(false);

    const daysInService = differenceInDays(new Date(), board.updatedAt);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);

      try {
        // Update main board status
        const newStatus = formData.serviceResult === 'Repaired' ? 'In Use' : 
                         formData.serviceResult === 'Replaced' ? 'Replaced' : 'Returned';
        
        const updates: Partial<Board> = {
          currentStatus: newStatus as any,
          currentLocation: board.millAssigned,
          updatedAt: new Date()
        };

        // If board was replaced, update warranty
        if (formData.serviceResult === 'Replaced' && formData.newWarrantyPeriod) {
          const warrantyExpiry = new Date();
          warrantyExpiry.setMonth(warrantyExpiry.getMonth() + parseInt(formData.newWarrantyPeriod));
          updates.warrantyExpiry = warrantyExpiry;
          updates.warrantyStatus = 'Under Replacement Warranty';
        }

        // Clear substitute board reference
        if (formData.returnSubstitute) {
          updates.substituteBoard = undefined;
        }

        await updateBoard(board.id, updates);

        // If substitute board was used, update its status back to available
        if (board.substituteBoard && formData.returnSubstitute) {
          const substituteBoard = boards.find(b => b.boardId === board.substituteBoard);
          if (substituteBoard) {
            await updateBoard(substituteBoard.id, {
              currentLocation: substituteBoard.millAssigned,
              updatedAt: new Date()
            });
          }
        }

        onClose();
      } catch (error) {
        console.error('Failed to process inward entry:', error);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Inward Entry - {board.boardId}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Board Info Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Mill:</span>
                <span className="ml-2 text-gray-900">{board.millAssigned}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Service Partner:</span>
                <span className="ml-2 text-gray-900">{board.currentLocation}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Days in Service:</span>
                <span className={`ml-2 font-medium ${getPriorityColor(daysInService)}`}>
                  {daysInService} days
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Current Status:</span>
                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(board.currentStatus)}`}>
                  {board.currentStatus}
                </span>
              </div>
              {board.substituteBoard && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Substitute Board:</span>
                  <span className="ml-2 text-blue-600 font-medium">{board.substituteBoard}</span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Result</label>
                <select 
                  required
                  value={formData.serviceResult}
                  onChange={(e) => setFormData({...formData, serviceResult: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Repaired">Repaired Successfully</option>
                  <option value="Replaced">Replaced with New Board</option>
                  <option value="Not Repairable">Not Repairable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Actual Service Days</label>
                <input
                  type="number"
                  value={formData.actualDays}
                  onChange={(e) => setFormData({...formData, actualDays: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={daysInService.toString()}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Notes</label>
              <textarea
                required
                value={formData.serviceNotes}
                onChange={(e) => setFormData({...formData, serviceNotes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe the service performed, issues found, and resolution..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.serviceCost}
                  onChange={(e) => setFormData({...formData, serviceCost: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Partner Rating</label>
                <select 
                  value={formData.servicePartnerRating}
                  onChange={(e) => setFormData({...formData, servicePartnerRating: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Below Average</option>
                  <option value="1">1 - Poor</option>
                </select>
              </div>
            </div>

            {formData.serviceResult === 'Replaced' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Warranty Period (months)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.newWarrantyPeriod}
                  onChange={(e) => setFormData({...formData, newWarrantyPeriod: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12"
                />
              </div>
            )}

            {board.substituteBoard && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="returnSubstitute"
                  checked={formData.returnSubstitute}
                  onChange={(e) => setFormData({...formData, returnSubstitute: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="returnSubstitute" className="ml-2 block text-sm text-gray-900">
                  Return substitute board <strong>{board.substituteBoard}</strong> to available pool
                </label>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Inward Entry Summary</h4>
                  <div className="mt-2 text-sm text-blue-800">
                    <p>• Board <strong>{board.boardId}</strong> will be marked as <strong>{formData.serviceResult}</strong></p>
                    <p>• Status will change to <strong>{formData.serviceResult === 'Repaired' ? 'In Use' : formData.serviceResult}</strong></p>
                    <p>• Board will return to <strong>{board.millAssigned}</strong></p>
                    {board.substituteBoard && formData.returnSubstitute && (
                      <p>• Substitute board <strong>{board.substituteBoard}</strong> will be returned to pool</p>
                    )}
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
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center transition-colors"
              >
                {submitting && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Process Inward Entry
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ServiceBoardCard: React.FC<{ board: Board }> = ({ board }) => {
    const daysInService = differenceInDays(new Date(), board.updatedAt);
    const servicePartner = servicePartners.find(p => p.name === board.currentLocation);
    const isOverdue = daysInService > (servicePartner?.avgRepairTime || 7);

    return (
      <div className={`bg-white rounded-lg shadow-sm border-2 p-6 hover:shadow-md transition-shadow ${
        isOverdue ? 'border-red-200' : 'border-gray-200'
      }`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{board.boardId}</h3>
            <p className="text-sm text-gray-600">{board.millAssigned}</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(board.currentStatus)}`}>
              {board.currentStatus}
            </span>
            {isOverdue && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                Overdue
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2" />
            <span>Service Partner: {board.currentLocation}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span className={getPriorityColor(daysInService)}>
              {daysInService} days in service
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Sent: {format(board.updatedAt, 'MMM dd, yyyy')}</span>
          </div>
          {board.substituteBoard && (
            <div className="flex items-center text-sm text-blue-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Substitute: {board.substituteBoard}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setSelectedBoard(board)}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          <ArrowDownCircle className="h-4 w-4 mr-2" />
          Process Inward Entry
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading service boards...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inward Entry</h2>
          <p className="text-gray-600 mt-1">Process boards returning from service</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-yellow-800">
              {serviceBoards.filter(b => b.currentStatus === 'Sent for Service').length}
            </div>
            <div className="text-xs text-yellow-700">Sent for Service</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-800">
              {serviceBoards.filter(b => b.currentStatus === 'In Repair').length}
            </div>
            <div className="text-xs text-blue-700">In Repair</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-800">
              {serviceBoards.filter(b => b.currentStatus === 'Repaired').length}
            </div>
            <div className="text-xs text-green-700">Ready for Return</div>
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
              placeholder="Search by Board ID, Mill, or Service Partner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Sent for Service">Sent for Service</option>
              <option value="In Repair">In Repair</option>
              <option value="Repaired">Ready for Return</option>
            </select>
          </div>
        </div>
      </div>

      {/* Service Boards Grid */}
      {filteredBoards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBoards.map((board) => (
            <ServiceBoardCard key={board.id} board={board} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <ArrowDownCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Boards in Service</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'No boards match your current filters.' 
              : 'No boards are currently in service or awaiting return.'
            }
          </p>
        </div>
      )}

      {/* Inward Entry Form Modal */}
      {selectedBoard && (
        <InwardEntryForm 
          board={selectedBoard}
          onClose={() => setSelectedBoard(null)} 
        />
      )}
    </div>
  );
};