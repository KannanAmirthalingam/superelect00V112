import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  Trash2,
  CircuitBoard,
  Calendar,
  MapPin,
  Clock,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { Board } from '../types';
import { format } from 'date-fns';

export const BoardManagement: React.FC = () => {
  const [boards, setBoards] = useState(dataService.getBoards());
  const mills = dataService.getMills();
  const servicePartners = dataService.getServicePartners();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);

  const refreshBoards = () => {
    setBoards(dataService.getBoards());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Use': return 'bg-green-100 text-green-800';
      case 'Sent for Service': return 'bg-orange-100 text-orange-800';
      case 'In Repair': return 'bg-yellow-100 text-yellow-800';
      case 'Repaired': return 'bg-blue-100 text-blue-800';
      case 'Replaced': return 'bg-purple-100 text-purple-800';
      case 'Returned': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWarrantyColor = (status: string) => {
    switch (status) {
      case 'Under Service Warranty': return 'text-green-600';
      case 'Under Replacement Warranty': return 'text-blue-600';
      case 'Out of Warranty': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredBoards = boards.filter(board => {
    const matchesSearch = board.boardId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         board.currentLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         board.millAssigned.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || board.currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const AddBoardForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [formData, setFormData] = useState({
      boardId: '',
      millAssigned: '',
      purchaseDate: '',
      warrantyPeriod: '12'
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);

      try {
        const purchaseDate = new Date(formData.purchaseDate);
        const warrantyExpiry = new Date(purchaseDate);
        warrantyExpiry.setMonth(warrantyExpiry.getMonth() + parseInt(formData.warrantyPeriod));

        const newBoard: Omit<Board, 'id'> = {
          boardId: formData.boardId,
          currentStatus: 'In Use',
          currentLocation: formData.millAssigned,
          millAssigned: formData.millAssigned,
          warrantyStatus: 'Under Service Warranty',
          warrantyExpiry,
          purchaseDate,
          serviceHistory: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        dataService.addBoard(newBoard);
        refreshBoards();
        onClose();
      } catch (error) {
        console.error('Failed to add board:', error);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Add New Board</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Board ID</label>
              <input
                type="text"
                required
                value={formData.boardId}
                onChange={(e) => setFormData({...formData, boardId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., SMW-B-006"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mill Assignment</label>
              <select 
                required
                value={formData.millAssigned}
                onChange={(e) => setFormData({...formData, millAssigned: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Mill</option>
                {mills.map(mill => (
                  <option key={mill.id} value={mill.name}>{mill.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input
                type="date"
                required
                value={formData.purchaseDate}
                onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Period (months)</label>
              <input
                type="number"
                required
                value={formData.warrantyPeriod}
                onChange={(e) => setFormData({...formData, warrantyPeriod: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12"
              />
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
                <Save className="h-4 w-4 mr-2" />
                Add Board
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const EditBoardForm: React.FC<{ board: Board; onClose: () => void }> = ({ board, onClose }) => {
    const [formData, setFormData] = useState({
      currentStatus: board.currentStatus,
      currentLocation: board.currentLocation,
      millAssigned: board.millAssigned,
      warrantyStatus: board.warrantyStatus,
      substituteBoard: board.substituteBoard || ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);

      try {
        dataService.updateBoard(board.id, {
          ...formData,
          substituteBoard: formData.substituteBoard || undefined,
          updatedAt: new Date()
        });
        refreshBoards();
        onClose();
      } catch (error) {
        console.error('Failed to update board:', error);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Edit Board - {board.boardId}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={formData.currentStatus}
                onChange={(e) => setFormData({...formData, currentStatus: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="In Use">In Use</option>
                <option value="Sent for Service">Sent for Service</option>
                <option value="In Repair">In Repair</option>
                <option value="Repaired">Repaired</option>
                <option value="Replaced">Replaced</option>
                <option value="Returned">Returned</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
              <input
                type="text"
                value={formData.currentLocation}
                onChange={(e) => setFormData({...formData, currentLocation: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mill Assignment</label>
              <select 
                value={formData.millAssigned}
                onChange={(e) => setFormData({...formData, millAssigned: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {mills.map(mill => (
                  <option key={mill.id} value={mill.name}>{mill.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Status</label>
              <select 
                value={formData.warrantyStatus}
                onChange={(e) => setFormData({...formData, warrantyStatus: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Under Service Warranty">Under Service Warranty</option>
                <option value="Under Replacement Warranty">Under Replacement Warranty</option>
                <option value="Out of Warranty">Out of Warranty</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Substitute Board</label>
              <input
                type="text"
                value={formData.substituteBoard}
                onChange={(e) => setFormData({...formData, substituteBoard: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., SMW-S-004"
              />
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
                <Save className="h-4 w-4 mr-2" />
                Update Board
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const BoardDetailsModal: React.FC<{ board: Board; onClose: () => void }> = ({ board, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Board Details - {board.boardId}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Status</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(board.currentStatus)}`}>
              {board.currentStatus}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Current Location</label>
            <p className="text-sm text-gray-900">{board.currentLocation}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Mill Assigned</label>
            <p className="text-sm text-gray-900">{board.millAssigned}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Warranty Status</label>
            <p className={`text-sm font-medium ${getWarrantyColor(board.warrantyStatus)}`}>
              {board.warrantyStatus}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Purchase Date</label>
            <p className="text-sm text-gray-900">{format(board.purchaseDate, 'MMM dd, yyyy')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Warranty Expiry</label>
            <p className="text-sm text-gray-900">{format(board.warrantyExpiry, 'MMM dd, yyyy')}</p>
          </div>
          {board.substituteBoard && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Substitute Board</label>
              <p className="text-sm text-gray-900">{board.substituteBoard}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-500">Service History</label>
            <p className="text-sm text-gray-900">{board.serviceHistory.length} services</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Last Updated</label>
            <p className="text-sm text-gray-900">{format(board.updatedAt, 'MMM dd, yyyy HH:mm')}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const handleDeleteBoard = (boardId: string) => {
    if (window.confirm('Are you sure you want to delete this board?')) {
      dataService.deleteBoard(boardId);
      refreshBoards();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Board Management</h2>
          <p className="text-gray-600 mt-1">Manage all electronic boards and their status</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Board
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <CircuitBoard className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Boards</p>
              <p className="text-2xl font-bold text-gray-900">{boards.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {boards.filter(b => b.currentStatus === 'In Use').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">In Service</p>
              <p className="text-2xl font-bold text-gray-900">
                {boards.filter(b => b.currentStatus === 'Sent for Service' || b.currentStatus === 'In Repair').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Warranty Expiring</p>
              <p className="text-2xl font-bold text-gray-900">
                {boards.filter(b => {
                  const thirtyDaysFromNow = new Date();
                  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                  return b.warrantyExpiry <= thirtyDaysFromNow && b.warrantyExpiry > new Date();
                }).length}
              </p>
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
              placeholder="Search boards by ID, location, or mill..."
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
              <option value="In Use">In Use</option>
              <option value="Sent for Service">Sent for Service</option>
              <option value="In Repair">In Repair</option>
              <option value="Repaired">Repaired</option>
              <option value="Replaced">Replaced</option>
              <option value="Returned">Returned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Boards Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Board ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mill
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warranty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Substitute
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBoards.map((board) => (
                <tr key={board.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CircuitBoard className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{board.boardId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(board.currentStatus)}`}>
                      {board.currentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{board.currentLocation}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {board.millAssigned}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs font-medium ${getWarrantyColor(board.warrantyStatus)}`}>
                      {board.warrantyStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {board.substituteBoard || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedBoard(board)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setEditingBoard(board)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Edit Board"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteBoard(board.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete Board"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddForm && <AddBoardForm onClose={() => setShowAddForm(false)} />}
      {editingBoard && <EditBoardForm board={editingBoard} onClose={() => setEditingBoard(null)} />}
      {selectedBoard && <BoardDetailsModal board={selectedBoard} onClose={() => setSelectedBoard(null)} />}
    </div>
  );
};