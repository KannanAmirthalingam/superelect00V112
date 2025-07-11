import React, { useState } from 'react';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  BarChart3,
  FileText,
  Loader,
  FileSpreadsheet
} from 'lucide-react';
import { useBoards, useMills, useServicePartners } from '../hooks/useFirebaseData';
import { format, subDays, isAfter, isBefore } from 'date-fns';
import { exportToExcel } from '../utils/excelExport';

export const Reports: React.FC = () => {
  const { boards, loading: boardsLoading } = useBoards();
  const { mills, loading: millsLoading } = useMills();
  const { servicePartners, loading: partnersLoading } = useServicePartners();
  
  const [dateRange, setDateRange] = useState('last30days');
  const [reportType, setReportType] = useState('overview');

  const loading = boardsLoading || millsLoading || partnersLoading;

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'last7days':
        return { start: subDays(now, 7), end: now };
      case 'last30days':
        return { start: subDays(now, 30), end: now };
      case 'last90days':
        return { start: subDays(now, 90), end: now };
      case 'last12months':
        return { start: subDays(now, 365), end: now };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const calculateReportData = () => {
    const { start, end } = getDateRange();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Filter boards within date range
    const filteredBoards = boards.filter(board => 
      isAfter(board.updatedAt, start) && isBefore(board.updatedAt, end)
    );

    // Overview metrics
    const totalServices = filteredBoards.filter(b => 
      b.currentStatus === 'Sent for Service' || 
      b.currentStatus === 'In Repair' || 
      b.currentStatus === 'Repaired'
    ).length;

    const completedServices = filteredBoards.filter(b => b.currentStatus === 'Repaired').length;
    const completionRate = totalServices > 0 ? (completedServices / totalServices) * 100 : 0;

    // Calculate average repair time (mock calculation)
    const avgRepairTime = servicePartners.reduce((sum, partner) => sum + partner.avgRepairTime, 0) / servicePartners.length;

    const substituteUsage = boards.filter(b => b.substituteBoard).length;

    // Vendor performance
    const vendorPerformance = servicePartners.map(partner => {
      const partnerBoards = boards.filter(b => b.currentLocation === partner.name);
      return {
        name: partner.name,
        services: partnerBoards.length,
        avgTime: partner.avgRepairTime,
        rating: partner.rating
      };
    });

    // Warranty status
    const warrantyStatus = {
      underWarranty: boards.filter(b => 
        b.warrantyStatus === 'Under Service Warranty' || 
        b.warrantyStatus === 'Under Replacement Warranty'
      ).length,
      expired: boards.filter(b => b.warrantyStatus === 'Out of Warranty').length,
      expiringSoon: boards.filter(b => 
        b.warrantyExpiry <= thirtyDaysFromNow && b.warrantyExpiry > now
      ).length
    };

    // Mill performance
    const millPerformance = mills.map(mill => {
      const millBoards = boards.filter(b => b.millAssigned === mill.name);
      const activeBoards = millBoards.filter(b => b.currentStatus === 'In Use').length;
      const inService = millBoards.filter(b => 
        b.currentStatus === 'Sent for Service' || b.currentStatus === 'In Repair'
      ).length;
      
      return {
        ...mill,
        totalBoards: millBoards.length,
        activeBoards,
        inService,
        serviceRate: millBoards.length > 0 ? (inService / millBoards.length) * 100 : 0
      };
    });

    return {
      overview: {
        totalServices,
        avgRepairTime: Math.round(avgRepairTime * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        substituteUsage
      },
      vendors: vendorPerformance,
      warranty: warrantyStatus,
      mills: millPerformance
    };
  };

  const reportData = calculateReportData();

  const ReportCard: React.FC<{
    title: string;
    value: string | number;
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

  const exportReport = () => {
    const reportContent = {
      generatedAt: new Date().toISOString(),
      dateRange,
      reportType,
      data: reportData
    };

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smw-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToExcelReport = () => {
    exportToExcel.serviceReport(boards, mills, servicePartners);
  };

  const exportBoardsOnly = () => {
    exportToExcel.boards(boards, 'boards-report');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <div className="flex space-x-3">
          <button 
            onClick={exportBoardsOnly}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Boards Excel
          </button>
          <button 
            onClick={exportToExcelReport}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Complete Excel
          </button>
          <button 
            onClick={exportReport}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="last7days">Last 7 days</option>
              <option value="last30days">Last 30 days</option>
              <option value="last90days">Last 90 days</option>
              <option value="last12months">Last 12 months</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-gray-400" />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="overview">Overview</option>
              <option value="detailed">Detailed Analysis</option>
              <option value="vendor">Vendor Performance</option>
              <option value="warranty">Warranty Report</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard
          title="Total Services"
          value={reportData.overview.totalServices}
          icon={<FileText className="h-6 w-6" />}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <ReportCard
          title="Avg Repair Time"
          value={`${reportData.overview.avgRepairTime} days`}
          icon={<Clock className="h-6 w-6" />}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <ReportCard
          title="Completion Rate"
          value={`${reportData.overview.completionRate}%`}
          icon={<CheckCircle className="h-6 w-6" />}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <ReportCard
          title="Substitute Usage"
          value={reportData.overview.substituteUsage}
          icon={<TrendingUp className="h-6 w-6" />}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Vendor Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Vendor Performance</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Vendor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Services</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Avg Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Rating</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.vendors.map((vendor, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900 font-medium">{vendor.name}</td>
                    <td className="py-3 px-4 text-gray-600">{vendor.services}</td>
                    <td className="py-3 px-4 text-gray-600">{vendor.avgTime} days</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1 text-gray-900 font-medium">{vendor.rating}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        vendor.rating >= 4.5 ? 'bg-green-100 text-green-800' :
                        vendor.rating >= 4.0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {vendor.rating >= 4.5 ? 'Excellent' :
                         vendor.rating >= 4.0 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mill Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Mill Performance</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportData.mills.map((mill) => (
              <div key={mill.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <h4 className="font-medium text-gray-900 mb-3">{mill.name}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Boards:</span>
                    <span className="font-medium">{mill.totalBoards}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Active Boards:</span>
                    <span className="font-medium text-green-600">{mill.activeBoards}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">In Service:</span>
                    <span className="font-medium text-orange-600">{mill.inService}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Service Rate:</span>
                    <span className="font-medium">{mill.serviceRate.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center text-xs text-gray-500">
                    <span>Contact: {mill.contactPerson}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warranty Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Warranty Status Overview</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{reportData.warranty.underWarranty}</div>
              <div className="text-sm text-gray-500">Under Warranty</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{reportData.warranty.expiringSoon}</div>
              <div className="text-sm text-gray-500">Expiring Soon</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{reportData.warranty.expired}</div>
              <div className="text-sm text-gray-500">Expired</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity Log</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {boards
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 10)
              .map((board, index) => (
                <div key={board.id} className="flex items-center space-x-3 py-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      Board {board.boardId} - {board.currentStatus} at {board.currentLocation}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(board.updatedAt, 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};