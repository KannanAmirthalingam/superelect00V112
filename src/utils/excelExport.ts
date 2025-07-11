import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Board, Mill, ServicePartner } from '../types';
import { format } from 'date-fns';

export const exportToExcel = {
  // Export boards data
  boards: (boards: Board[], filename: string = 'boards-report') => {
    const data = boards.map(board => ({
      'Board ID': board.boardId,
      'Status': board.currentStatus,
      'Current Location': board.currentLocation,
      'Mill Assigned': board.millAssigned,
      'Warranty Status': board.warrantyStatus,
      'Purchase Date': format(board.purchaseDate, 'yyyy-MM-dd'),
      'Warranty Expiry': format(board.warrantyExpiry, 'yyyy-MM-dd'),
      'Substitute Board': board.substituteBoard || 'N/A',
      'Service History Count': board.serviceHistory.length,
      'Created Date': format(board.createdAt, 'yyyy-MM-dd HH:mm'),
      'Last Updated': format(board.updatedAt, 'yyyy-MM-dd HH:mm')
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Boards');

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    worksheet['!cols'] = colWidths;

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  },

  // Export service report
  serviceReport: (boards: Board[], mills: Mill[], servicePartners: ServicePartner[]) => {
    const workbook = XLSX.utils.book_new();

    // Boards Summary Sheet
    const boardsData = boards.map(board => ({
      'Board ID': board.boardId,
      'Status': board.currentStatus,
      'Current Location': board.currentLocation,
      'Mill Assigned': board.millAssigned,
      'Warranty Status': board.warrantyStatus,
      'Purchase Date': format(board.purchaseDate, 'yyyy-MM-dd'),
      'Warranty Expiry': format(board.warrantyExpiry, 'yyyy-MM-dd'),
      'Substitute Board': board.substituteBoard || 'N/A',
      'Last Updated': format(board.updatedAt, 'yyyy-MM-dd HH:mm')
    }));

    const boardsSheet = XLSX.utils.json_to_sheet(boardsData);
    XLSX.utils.book_append_sheet(workbook, boardsSheet, 'Boards Summary');

    // Service Status Sheet
    const serviceData = boards
      .filter(board => 
        board.currentStatus === 'Sent for Service' || 
        board.currentStatus === 'In Repair' || 
        board.currentStatus === 'Repaired'
      )
      .map(board => ({
        'Board ID': board.boardId,
        'Mill': board.millAssigned,
        'Service Partner': board.currentLocation,
        'Status': board.currentStatus,
        'Substitute Board': board.substituteBoard || 'N/A',
        'Service Date': format(board.updatedAt, 'yyyy-MM-dd'),
        'Days in Service': Math.floor((new Date().getTime() - board.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
      }));

    if (serviceData.length > 0) {
      const serviceSheet = XLSX.utils.json_to_sheet(serviceData);
      XLSX.utils.book_append_sheet(workbook, serviceSheet, 'Service Status');
    }

    // Mills Sheet
    const millsData = mills.map(mill => {
      const millBoards = boards.filter(b => b.millAssigned === mill.name);
      const activeBoards = millBoards.filter(b => b.currentStatus === 'In Use').length;
      const inService = millBoards.filter(b => 
        b.currentStatus === 'Sent for Service' || b.currentStatus === 'In Repair'
      ).length;

      return {
        'Mill Name': mill.name,
        'Location': mill.location,
        'Contact Person': mill.contactPerson,
        'Phone': mill.phone,
        'Total Boards': millBoards.length,
        'Active Boards': activeBoards,
        'In Service': inService,
        'Service Rate %': millBoards.length > 0 ? ((inService / millBoards.length) * 100).toFixed(1) : '0'
      };
    });

    const millsSheet = XLSX.utils.json_to_sheet(millsData);
    XLSX.utils.book_append_sheet(workbook, millsSheet, 'Mills Summary');

    // Service Partners Sheet
    const partnersData = servicePartners.map(partner => {
      const partnerBoards = boards.filter(b => b.currentLocation === partner.name);
      
      return {
        'Partner Name': partner.name,
        'Contact Person': partner.contactPerson,
        'Phone': partner.phone,
        'Email': partner.email,
        'Address': partner.address,
        'Rating': partner.rating,
        'Avg Repair Time (days)': partner.avgRepairTime,
        'Current Services': partnerBoards.length
      };
    });

    const partnersSheet = XLSX.utils.json_to_sheet(partnersData);
    XLSX.utils.book_append_sheet(workbook, partnersSheet, 'Service Partners');

    // Warranty Report Sheet
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const warrantyData = boards.map(board => {
      const daysToExpiry = Math.floor((board.warrantyExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      let warrantyAlert = 'Active';
      
      if (daysToExpiry < 0) {
        warrantyAlert = 'Expired';
      } else if (daysToExpiry <= 30) {
        warrantyAlert = 'Expiring Soon';
      }

      return {
        'Board ID': board.boardId,
        'Mill': board.millAssigned,
        'Warranty Status': board.warrantyStatus,
        'Purchase Date': format(board.purchaseDate, 'yyyy-MM-dd'),
        'Warranty Expiry': format(board.warrantyExpiry, 'yyyy-MM-dd'),
        'Days to Expiry': daysToExpiry,
        'Alert': warrantyAlert
      };
    });

    const warrantySheet = XLSX.utils.json_to_sheet(warrantyData);
    XLSX.utils.book_append_sheet(workbook, warrantySheet, 'Warranty Report');

    // Auto-size all columns
    [boardsSheet, millsSheet, partnersSheet, warrantySheet].forEach(sheet => {
      if (sheet['!ref']) {
        const range = XLSX.utils.decode_range(sheet['!ref']);
        const colWidths = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          let maxWidth = 10;
          for (let R = range.s.r; R <= range.e.r; ++R) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = sheet[cellAddress];
            if (cell && cell.v) {
              maxWidth = Math.max(maxWidth, cell.v.toString().length);
            }
          }
          colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
        }
        sheet['!cols'] = colWidths;
      }
    });

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `SMW-Complete-Report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  },

  // Export custom report
  customReport: (data: any[], sheetName: string, filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Auto-size columns
    if (data.length > 0) {
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      worksheet['!cols'] = colWidths;
    }

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  }
};