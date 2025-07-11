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
  Loader
} from 'lucide-react';
import { useBoards, useMills, useServicePartners } from '../hooks/useFirebaseData';
import { format } from 'date-fns';

interface DashboardStats {
  totalBoards: number;
  inService: number;
  inRepair: number;
  substituteActive: number;
  overdueReturns: number;
  warrantyExpiring: number;
}

export const Dashboard: React.FC = () => {
  const { boards, loading: boardsLoading } = useBoards();
  const { mills, loading: millsLoading } = useMills();
  const { servicePartners, loading: partnersLoading } = useServicePartners();

  const loading = boardsLoading || millsLoading || partnersLoading;

  const calculateStats = (): DashboardStats => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      totalBoards: boards.length,
      inService: boards.filter(b => b.currentStatus === 'Sent for Service').length,
      inRepair: boards.filter(b => b.currentStatus === 'In Repair').length,
      substituteActive: boards.filter(b => b.substituteBoard).length,
      overdueReturns: boards.filter(b => 
        b.currentStatus === 'Repaired' && 
        new Date(b.updatedAt).getTime() < now.getTime() - 7 * 24 * 60 * 60 * 1000
      ).length,
      warrantyExpiring: boards.filter(b => 
        b.warrantyExpiry <= thirtyDaysFromNow && b.warrantyExpiry > now
      ).length
    };
  };

  const stats = calculateStats();

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
  }> = ({ title, value, icon, color, bgColor }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <div className={`${color}`}>{icon}</div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  const getRecentActivities = () => {
    return boards
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map(board => ({
        id: board.id,
        type: board.currentStatus === 'Sent for Service' ? 'service' : 
              board.currentStatus === 'Repaired' ? 'return' :
              board.substituteBoard ? 'substitute' : 'warranty',
        message: `Board ${board.boardId} - ${board.currentStatus} at ${board.currentLocation}`,
        time: format(new Date(board.updatedAt), 'MMM dd, yyyy HH:mm')
      }));
  };

  const getMillStatus = () => {
    return mills.map(mill => {
      const millBoards = boards.filter(b => b.millAssigned === mill.name);
      const activeBoards = millBoards.filter(b => b.currentStatus === 'In Use').length;
      const inService = millBoards.filter(b => b.currentStatus === 'Sent for Service' || b.currentStatus === 'In Repair').length;
      const substitutes = millBoards.filter(b => b.substituteBoard).length;

      return {
        ...mill,
        activeBoards,
        inService,
        substitutes
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  const recentActivities = getRecentActivities();
  const millStatus = getMillStatus();

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Boards"
          value={stats.totalBoards}
          icon={<CircuitBoard className="h-6 w-6" />}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="In Service"
          value={stats.inService}
          icon={<Wrench className="h-6 w-6" />}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatCard
          title="In Repair"
          value={stats.inRepair}
          icon={<Clock className="h-6 w-6" />}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
        />
        <StatCard
          title="Substitute Active"
          value={stats.substituteActive}
          icon={<TrendingUp className="h-6 w-6" />}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Overdue Returns"
          value={stats.overdueReturns}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <StatCard
          title="Warranty Expiring"
          value={stats.warrantyExpiring}
          icon={<Calendar className="h-6 w-6" />}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'service' ? 'bg-orange-100' :
                    activity.type === 'return' ? 'bg-green-100' :
                    activity.type === 'substitute' ? 'bg-blue-100' :
                    'bg-purple-100'
                  }`}>
                    {activity.type === 'service' && <Wrench className="h-4 w-4 text-orange-600" />}
                    {activity.type === 'return' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {activity.type === 'substitute' && <CircuitBoard className="h-4 w-4 text-blue-600" />}
                    {activity.type === 'warranty' && <Calendar className="h-4 w-4 text-purple-600" />}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent activities
            </div>
          )}
        </div>
      </div>

      {/* Mill Status Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Mill Status Overview</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {millStatus.map((mill) => (
              <div key={mill.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{mill.name}</h4>
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Active Boards:</span>
                    <span className="font-medium">{mill.activeBoards}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">In Service:</span>
                    <span className="font-medium text-orange-600">{mill.inService}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Substitutes:</span>
                    <span className="font-medium text-blue-600">{mill.substitutes}</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center text-xs text-gray-500">
                    <span>Contact: {mill.contactPerson}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service Partners Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Service Partners Performance</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servicePartners.map((partner) => (
              <div key={partner.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{partner.name}</h4>
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 text-sm font-medium">{partner.rating}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Avg Repair Time:</span>
                    <span className="font-medium">{partner.avgRepairTime} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Contact:</span>
                    <span className="font-medium">{partner.contactPerson}</span>
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