import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building, 
  Users, 
  Phone, 
  Mail, 
  MapPin,
  Star,
  Clock,
  Save,
  X,
  Loader
} from 'lucide-react';
import { useMills, useServicePartners } from '../hooks/useFirebaseData';
import { millService, servicePartnerService } from '../services/firebaseService';
import { Mill, ServicePartner } from '../types';

export const MasterData: React.FC = () => {
  const { mills, loading: millsLoading } = useMills();
  const { servicePartners, loading: partnersLoading } = useServicePartners();
  
  const [activeTab, setActiveTab] = useState<'mills' | 'partners'>('mills');
  const [showMillForm, setShowMillForm] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [editingMill, setEditingMill] = useState<Mill | null>(null);
  const [editingPartner, setEditingPartner] = useState<ServicePartner | null>(null);

  const loading = millsLoading || partnersLoading;

  const MillForm: React.FC<{ 
    mill?: Mill; 
    onClose: () => void; 
    onSave: () => void;
  }> = ({ mill, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      name: mill?.name || '',
      location: mill?.location || '',
      contactPerson: mill?.contactPerson || '',
      phone: mill?.phone || ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);

      try {
        if (mill) {
          await millService.update(mill.id, formData);
        } else {
          await millService.add(formData);
        }
        onSave();
        onClose();
      } catch (error) {
        console.error('Failed to save mill:', error);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">
            {mill ? 'Edit Mill' : 'Add New Mill'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mill Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mill 5 - Production Unit E"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Industrial Area, Sector 5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                type="text"
                required
                value={formData.contactPerson}
                onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., +91-9876543214"
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
                {submitting && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                {mill ? 'Update' : 'Add'} Mill
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const PartnerForm: React.FC<{ 
    partner?: ServicePartner; 
    onClose: () => void; 
    onSave: () => void;
  }> = ({ partner, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      name: partner?.name || '',
      contactPerson: partner?.contactPerson || '',
      phone: partner?.phone || '',
      email: partner?.email || '',
      address: partner?.address || '',
      rating: partner?.rating || 4.0,
      avgRepairTime: partner?.avgRepairTime || 5
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);

      try {
        if (partner) {
          await servicePartnerService.update(partner.id, formData);
        } else {
          await servicePartnerService.add(formData);
        }
        onSave();
        onClose();
      } catch (error) {
        console.error('Failed to save service partner:', error);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {partner ? 'Edit Service Partner' : 'Add New Service Partner'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., TechRepair Solutions"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                type="text"
                required
                value={formData.contactPerson}
                onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Jane Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., +91-9876543225"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., contact@techrepair.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Complete address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  required
                  value={formData.rating}
                  onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avg Repair Time (days)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.avgRepairTime}
                  onChange={(e) => setFormData({...formData, avgRepairTime: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
                {partner ? 'Update' : 'Add'} Partner
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const deleteMill = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this mill?')) {
      try {
        await millService.delete(id);
      } catch (error) {
        console.error('Failed to delete mill:', error);
      }
    }
  };

  const deletePartner = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this service partner?')) {
      try {
        await servicePartnerService.delete(id);
      } catch (error) {
        console.error('Failed to delete service partner:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading master data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Master Data Management</h2>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('mills')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'mills'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building className="h-4 w-4 inline mr-2" />
              Mills ({mills.length})
            </button>
            <button
              onClick={() => setActiveTab('partners')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'partners'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Service Partners ({servicePartners.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'mills' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Mills Management</h3>
                <button
                  onClick={() => setShowMillForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Mill
                </button>
              </div>

              <div className="grid gap-4">
                {mills.map((mill) => (
                  <div key={mill.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">{mill.name}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {mill.location}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {mill.contactPerson}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {mill.phone}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingMill(mill)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteMill(mill.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'partners' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Service Partners Management</h3>
                <button
                  onClick={() => setShowPartnerForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service Partner
                </button>
              </div>

              <div className="grid gap-4">
                {servicePartners.map((partner) => (
                  <div key={partner.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{partner.name}</h4>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-sm font-medium">{partner.rating}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {partner.contactPerson}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {partner.phone}
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {partner.email}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {partner.avgRepairTime} days avg
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          {partner.address}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingPartner(partner)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deletePartner(partner.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showMillForm && (
        <MillForm 
          onClose={() => setShowMillForm(false)} 
          onSave={() => window.location.reload()}
        />
      )}
      {editingMill && (
        <MillForm 
          mill={editingMill}
          onClose={() => setEditingMill(null)} 
          onSave={() => window.location.reload()}
        />
      )}
      {showPartnerForm && (
        <PartnerForm 
          onClose={() => setShowPartnerForm(false)} 
          onSave={() => window.location.reload()}
        />
      )}
      {editingPartner && (
        <PartnerForm 
          partner={editingPartner}
          onClose={() => setEditingPartner(null)} 
          onSave={() => window.location.reload()}
        />
      )}
    </div>
  );
};