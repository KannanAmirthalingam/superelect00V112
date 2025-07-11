import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  User,
  FileText,
  ArrowRight,
  Loader,
  X
} from 'lucide-react';
import { useBoards, useMills, useServicePartners } from '../hooks/useFirebaseData';
import { format } from 'date-fns';

interface ServiceRequest {
  id: string;
  boardId: string;
  millName: string;
  issueReported: string;
  servicePartner: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  dateRequested: string;
  expectedCompletion: string;
  substituteBoard?: string;
  priority: 'High' | 'Medium' | 'Low';
}

export const ServiceManagement: React.FC = () => {
  const { boards, updateBoard } = useBoards();
  const { mills } = useMills();
  const { servicePartners } = useServicePartners();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showServiceForm, setShowServiceForm] = useState(false);

  // Generate service requests from boards that are in service
  const generateServiceRequests = (): ServiceRequest[] => {
    return boards
      .filter(board => 
        board.currentStatus === 'Sent for Service' || 
        board.currentStatus === 'In Repair' || 
        board.currentStatus === 'Repaired'
      )
      .map(board => {
        const mill = mills.find(m => m.name === board.millAssigned);
        const partner = servicePartners.find(p => p.name === board.currentLocation);
        
        return {
          id: board.id,
          boardId: board.boardId,
          millName: board.millAssigned,
          issueReported: getIssueForBoard(board.boardId),
          servicePartner: board.currentLocation,
          status: board.currentStatus === 'Sent for Service' ? 'Pending' as const :
                  board.currentStatus === 'In Repair' ? 'In Progress' as const :
                  'Completed' as const,
          dateRequested: format(board.updatedAt, 'yyyy-MM-dd'),
          expectedCompletion: format(
            new Date(board.updatedAt.getTime() + (partner?.avgRepairTime || 7) * 24 * 60 * 60 * 1000),
            'yyyy-MM-dd'
          ),
          substituteBoard: board.substituteBoard,
          priority: getPriorityForBoard(board.boardId)
        };
      });
  };

  const getIssueForBoard = (boardId: string): string => {
    const issues = [
      'Power supply failure',
      'Communication error',
      'Display malfunction',
      'Sensor calibration issue',
      'Memory corruption',
      'Temperature sensor fault',
      'Control circuit failure',
      'Software update required'
    ];
    const index = boardId.charCodeAt(boardId.length - 1) % issues.length;
    return issues[index];
  };

  const getPriorityForBoard = (boardId: string): 'High' | 'Medium' | 'Low' => {
    const priorities: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low'];
    const index = boardId.charCodeAt(boardId.length - 1) % 3;
    return priorities[index];
  };

  const serviceRequests = generateServiceRequests();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = serviceRequests.filter(request => {
    const matchesSearch = request.boardId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.millName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.servicePartner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const ServiceRequestForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [formData, setFormData] = useState({
      boardId: '',
      issueDescription: '',
      servicePartner: '',
      priority: 'Medium' as 'High' | 'Medium' | 'Low',
      substituteBoard: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const availableBoards = boards.filter(b => b.currentStatus === 'In Use');
    const availableSubstitutes = boards.filter(b => 
      b.boardId.startsWith('SMW-S-') && b.currentStatus === 'In Use' && !b.substituteBoard
    );

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);

      try {
        const selectedBoard = boards.find(b => b.boardId === formData.boardId);
        if (selectedBoard) {
          await updateBoard(selectedBoard.id, {
            currentStatus: 'Sent for Service',
            currentLocation: formData.servicePartner,
            substituteBoard: formData.substituteBoard || undefined,
            updatedAt: new Date()
          });
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
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Create Service Request</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Board ID</label>
              <select 
                required
                value={formData.boardId}
                onChange={(e) => setFormData({...formData, boardId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Board</option>
                {availableBoards.map(board => (
                  <option key={board.id} value={board.boardId}>
                    {board.boardId} - {board.millAssigned}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
              <textarea
                required
                value={formData.issueDescription}
                onChange={(e) => setFormData({...formData, issueDescription: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe the issue..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Partner</label>
              <select 
                required
                value={formData.servicePartner}
                onChange={(e) => setFormData({...formData, servicePartner: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Partner</option>
                {servicePartners.map(partner => (
                  <option key={partner.id} value={partner.name}>{partner.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select 
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Substitute Board (Optional)</label>
              <select 
                value={formData.substituteBoard}
                onChange={(e) => setFormData({...formData, substituteBoard: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Substitute</option>
                {availableSubstitutes.map(board => (
                  <option key={board.id} value={board.boardId}>{board.boardId}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {submitting && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                Create Request
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const updateServiceStatus = async (requestId: string, newStatus: 'In Progress' | 'Completed') => {
    try {
      const board = boards.find(b => b.id === requestId);
      if (board) {
        const statusMap = {
          'In Progress': 'In Repair' as const,
          'Completed': 'Repaired' as const
        };
        
        await updateBoard(requestId, {
          currentStatus: statusMap[newStatus],
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to update service status:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Service Management</h2>
        <button
          onClick={() => setShowServiceForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Service Request
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search service requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Service Requests */}
      <div className="grid gap-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{request.boardId}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)}`}>
                      {request.priority}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      <span>{request.millName}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Requested: {request.dateRequested}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Expected: {request.expectedCompletion}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      <span>Partner: {request.servicePartner}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <FileText className="h-4 w-4 mr-2" />
                      <span>Issue Description:</span>
                    </div>
                    <p className="text-sm text-gray-900 ml-6">{request.issueReported}</p>
                  </div>

                  {request.substituteBoard && (
                    <div className="flex items-center text-sm text-blue-600">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>Substitute Board: {request.substituteBoard}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2">
                  {request.status === 'Pending' && (
                    <button 
                      onClick={() => updateServiceStatus(request.id, 'In Progress')}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Start Service"
                    >
                      <Clock className="h-4 w-4" />
                    </button>
                  )}
                  {request.status === 'In Progress' && (
                    <button 
                      onClick={() => updateServiceStatus(request.id, 'Completed')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Mark Complete"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors">
                    <FileText className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Service Requests</h3>
            <p className="text-gray-500">No service requests match your current filters.</p>
          </div>
        )}
      </div>

      {/* Service Request Form Modal */}
      {showServiceForm && <ServiceRequestForm onClose={() => setShowServiceForm(false)} />}
    </div>
  );
};