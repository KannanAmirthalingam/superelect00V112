import React from 'react';
import { 
  CircuitBoard, 
  Wrench, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  MapPin,
  Activity,
  Users,
  Building
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { format, differenceInDays } from 'date-fns';

export const Dashboard: React.FC = () => {
  const boards = dataService.getBoards();
  const mills = dataService.getMills();
  const servicePartners = dataService.getServicePartners();
  const stats = dataService.getDashboardStats();

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    description?: string;
  }> = ({ title, value, icon, color, bgColor, description }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <div className={`${color}`}>{icon}</div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        </div>
      </div>
    </div>
  );

  const getRecentActivities = () => {
    return boards
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8)
      .map(board => {
        const daysAgo = differenceInDays(new Date(), board.updatedAt);
        return {
          id: board.id,
          boardId: board.boardId,
          status: board.currentStatus,
          location: board.currentLocation,
          mill: board.millAssigned,
          substitute: board.substituteBoard,
          time: daysAgo === 0 ? 'Today' : `${daysAgo} days ago`,
          isOverdue: (board.currentStatus === 'Sent for Service' || board.currentStatus === 'In Repair') && daysAgo > 14
        };
      });
  };

  const getMillStatus = () => {
    return mills.map(mill => {
      const millBoards = boards.filter(b => b.millAssigned === mill.name);
      const activeBoards = millBoards.filter(b => b.currentStatus === 'In Use').length;
      const inService = millBoards.filter(b => 
        b.currentStatus === 'Sent for Service' || b.currentStatus === 'In Repair'
      ).length;
      const substitutes = millBoards.filter(b => b.substituteBoard).length;

      return {
        ...mill,
        totalBoards: millBoards.length,
        activeBoards,
        inService,
        substitutes,
        serviceRate: millBoards.length > 0 ? Math.round((inService / millBoards.length) * 100) : 0
      };
    });
  };

  const getServicePartnerStatus = () => {
    return servicePartners.map(partner => {
      const partnerBoards = boards.filter(b => b.currentLocation === partner.name);
      const currentServices = partnerBoards.filter(b => 
        b.currentStatus === 'Sent for Service' || b.currentStatus === 'In Repair'
      ).length;
      
      return {
        ...partner,
        currentServices,
        workload: currentServices > 3 ? 'High' : currentServices > 1 ? 'Medium' : 'Low'
      };
    });
  };

  const recentActivities = getRecentActivities();
  const millStatus = getMillStatus();
  const partnerStatus = getServicePartnerStatus();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Use': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Sent for Service': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'In Repair': return <Wrench className="h-4 w-4 text-blue-600" />;
      case 'Repaired': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <CircuitBoard className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SMW Dashboard</h1>
          <p className="text-gray-600 mt-1">Electronic Board Service Tracking Overview</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Boards"
          value={stats.totalBoards}
          icon={<CircuitBoard className="h-6 w-6" />}
          color="text-blue-600"
          bgColor="bg-blue-50"
          description="All registered boards"
        />
        <StatCard
          title="Active Boards"
          value={stats.activeBoards}
          icon={<CheckCircle className="h-6 w-6" />}
          color="text-green-600"
          bgColor="bg-green-50"
          description="Currently in use"
        />
        <StatCard
          title="In Service"
          value={stats.inService + stats.inRepair}
          icon={<Wrench className="h-6 w-6" />}
          color="text-orange-600"
          bgColor="bg-orange-50"
          description="Sent for repair/maintenance"
        />
        <StatCard
          title="Substitute Active"
          value={stats.substituteActive}
          icon={<TrendingUp className="h-6 w-6" />}
          color="text-purple-600"
          bgColor="bg-purple-50"
          description="Temporary replacements"
        />
      </div>

      {/* Alert Cards */}
      {(stats.overdueReturns > 0 || stats.warrantyExpiring > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.overdueReturns > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Overdue Returns</h3>
                  <p className="text-sm text-red-700">
                    {stats.overdueReturns} boards have been in service for more than 14 days
                  </p>
                </div>
              </div>
            </div>
          )}
          {stats.warrantyExpiring > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Warranty Expiring</h3>
                  <p className="text-sm text-yellow-700">
                    {stats.warrantyExpiring} boards have warranties expiring within 30 days
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            </div>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {recentActivities.map((activity) => (
              <div key={activity.id} className={`px-6 py-4 hover:bg-gray-50 ${activity.isOverdue ? 'bg-red-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(activity.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.boardId} - {activity.status}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.location} • {activity.mill}
                      </p>
                      {activity.substitute && (
                        <p className="text-xs text-blue-600">
                          Substitute: {activity.substitute}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${activity.isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {activity.time}
                    </p>
                    {activity.isOverdue && (
                      <p className="text-xs text-red-600">Overdue</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mill Status Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Building className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Mill Status Overview</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {millStatus.map((mill) => (
                <div key={mill.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{mill.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      mill.serviceRate > 30 ? 'bg-red-100 text-red-800' :
                      mill.serviceRate > 15 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {mill.serviceRate}% in service
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{mill.activeBoards}</div>
                      <div className="text-xs text-gray-500">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{mill.inService}</div>
                      <div className="text-xs text-gray-500">In Service</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{mill.substitutes}</div>
                      <div className="text-xs text-gray-500">Substitutes</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{mill.contactPerson} • {mill.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Service Partners Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Service Partners Performance</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {partnerStatus.map((partner) => (
              <div key={partner.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{partner.name}</h4>
                  <div className="flex items-center">
                    <span className="text-yellow-500 text-sm">★</span>
                    <span className="ml-1 text-sm font-medium">{partner.rating}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Current Services:</span>
                    <span className={`font-medium ${
                      partner.currentServices > 3 ? 'text-red-600' :
                      partner.currentServices > 1 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {partner.currentServices}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Avg Time:</span>
                    <span className="font-medium">{partner.avgRepairTime} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Workload:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      partner.workload === 'High' ? 'bg-red-100 text-red-800' :
                      partner.workload === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {partner.workload}
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {partner.contactPerson}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};