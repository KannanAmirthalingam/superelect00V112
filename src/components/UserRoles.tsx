import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  Eye, 
  Edit, 
  Plus,
  Trash2,
  UserCheck,
  UserX,
  Settings,
  X,
  Save
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { User } from '../types';

export const UserRoles: React.FC = () => {
  const [users, setUsers] = useState(dataService.getUsers());
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const refreshUsers = () => {
    setUsers(dataService.getUsers());
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Mill Supervisor': return 'bg-blue-100 text-blue-800';
      case 'Service Partner': return 'bg-green-100 text-green-800';
      case 'Viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'Admin':
        return [
          'Full system access',
          'User management',
          'Master data management',
          'All reports and analytics',
          'System configuration'
        ];
      case 'Mill Supervisor':
        return [
          'Create service requests',
          'View board status',
          'Mill-specific reports',
          'Update board information'
        ];
      case 'Service Partner':
        return [
          'Update service status',
          'View assigned boards',
          'Service reports',
          'Update repair progress'
        ];
      case 'Viewer':
        return [
          'View-only access',
          'Basic reports',
          'Dashboard viewing'
        ];
      default:
        return [];
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const UserForm: React.FC<{ 
    user?: User; 
    onClose: () => void; 
    onSave: (user: User) => void;
  }> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      email: user?.email || '',
      name: user?.name || '',
      role: user?.role || 'Viewer' as User['role'],
      status: user?.status || 'Active' as User['status'],
      mill: user?.mill || '',
      servicePartner: user?.servicePartner || ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);

      try {
        const userData: User = {
          id: user?.id || Date.now().toString(),
          ...formData,
          lastLogin: user?.lastLogin,
          createdAt: user?.createdAt || new Date()
        };

        if (user) {
          dataService.updateUser(user.id, formData);
        } else {
          dataService.addUser(userData);
        }

        onSave(userData);
        onClose();
      } catch (error) {
        console.error('Failed to save user:', error);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {user ? 'Edit User' : 'Add New User'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select 
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as User['role']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Admin">Admin</option>
                  <option value="Mill Supervisor">Mill Supervisor</option>
                  <option value="Service Partner">Service Partner</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as User['status']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {formData.role === 'Mill Supervisor' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Mill</label>
                <input
                  type="text"
                  value={formData.mill}
                  onChange={(e) => setFormData({...formData, mill: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mill 1 - Production Unit A"
                />
              </div>
            )}

            {formData.role === 'Service Partner' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Partner Company</label>
                <input
                  type="text"
                  value={formData.servicePartner}
                  onChange={(e) => setFormData({...formData, servicePartner: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Super Electronics"
                />
              </div>
            )}

            {/* Role Permissions Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Role Permissions</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {getRolePermissions(formData.role).map((permission, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                    {permission}
                  </li>
                ))}
              </ul>
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
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {user ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const handleSaveUser = (userData: User) => {
    refreshUsers();
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      dataService.deleteUser(userId);
      refreshUsers();
    }
  };

  const toggleUserStatus = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      dataService.updateUser(userId, {
        status: user.status === 'Active' ? 'Inactive' : 'Active'
      });
      refreshUsers();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Roles & Permissions</h2>
          <p className="text-gray-600 mt-1">Manage user access and permissions</p>
        </div>
        <button
          onClick={() => setShowUserForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'Admin').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Mill Supervisors</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'Mill Supervisor').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Service Partners</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'Service Partner').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-gray-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Viewers</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'Viewer').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Mill Supervisor">Mill Supervisor</option>
            <option value="Service Partner">Service Partner</option>
            <option value="Viewer">Viewer</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.mill || user.servicePartner || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`transition-colors ${
                          user.status === 'Active' 
                            ? 'text-red-600 hover:text-red-800' 
                            : 'text-green-600 hover:text-green-800'
                        }`}
                        title={user.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                      >
                        {user.status === 'Active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete User"
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

      {/* Role Permissions Reference */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Role Permissions Reference</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Admin', 'Mill Supervisor', 'Service Partner', 'Viewer'].map((role) => (
              <div key={role} className="border border-gray-200 rounded-lg p-4">
                <h4 className={`font-medium mb-3 inline-flex px-2 py-1 text-sm rounded-full ${getRoleColor(role)}`}>
                  {role}
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {getRolePermissions(role).map((permission, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2 mt-2 flex-shrink-0"></div>
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Form Modals */}
      {showUserForm && (
        <UserForm 
          onClose={() => setShowUserForm(false)} 
          onSave={handleSaveUser}
        />
      )}
      {editingUser && (
        <UserForm 
          user={editingUser}
          onClose={() => setEditingUser(null)} 
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
};