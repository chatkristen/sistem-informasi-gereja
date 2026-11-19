import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  header: string;
  key: string;
  format?: (value: any, row?: any) => string;
}

export function exportToExcel(
  filename: string,
  sheetName: string,
  data: any[],
  columns: ExportColumn[]
) {
  const formattedData = data.map((row) => {
    const obj: Record<string, any> = {};
    columns.forEach((col) => {
      const val = row[col.key];
      obj[col.header] = col.format ? col.format(val, row) : (val !== undefined && val !== null ? val : '');
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPDF(
  title: string,
  subtitle: string,
  data: any[],
  columns: ExportColumn[],
  filename: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
) {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  // Church Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 32, 70); // Navy 900
  doc.text('GEREJA KRISTEN KASIH ANUGERAH', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Jl. Kasih Anugerah No. 7, Jakarta Pusat | Telp: (021) 555-0192', doc.internal.pageSize.getWidth() / 2, 21, { align: 'center' });

  doc.setDrawColor(212, 175, 55); // Gold
  doc.setLineWidth(0.5);
  doc.line(14, 25, doc.internal.pageSize.getWidth() - 14, 25);

  // Document Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(title.toUpperCase(), 14, 34);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(`${subtitle} | Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 14, 39);

  // Table
  const headers = [columns.map((c) => c.header)];
  const body = data.map((row) =>
    columns.map((col) => {
      const val = row[col.key];
      return col.format ? col.format(val, row) : (val !== undefined && val !== null ? String(val) : '-');
    })
  );

  autoTable(doc, {
    startY: 44,
    head: headers,
    body: body,
    theme: 'striped',
    headStyles: {
      fillColor: [11, 32, 70], // Navy
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      cellPadding: 2.5,
      overflow: 'linebreak',
    },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${filename}.pdf`);
}
