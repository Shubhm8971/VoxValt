import { Task } from '@/types';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';
import { format } from 'date-fns';

/**
 * Export tasks to CSV file
 */
export function exportTasksToCSV(tasks: Task[]): void {
  if (tasks.length === 0) {
    alert('No tasks to export');
    return;
  }

  // Prepare data for CSV
  const csvData = tasks.map((task) => ({
    Title: task.title,
    Description: task.description || '',
    Type: task.task_type || task.type || 'task',
    Status: task.completed ? 'Completed' : 'Pending',
    'Due Date': task.due_date ? format(new Date(task.due_date), 'MMM dd, yyyy') : '',
    'Created At': task.created_at ? format(new Date(task.created_at), 'MMM dd, yyyy HH:mm') : '',
  }));

  // Convert to CSV using PapaParse
  const csv = Papa.unparse(csvData);

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export tasks to PDF file
 */
export function exportTasksToPDF(tasks: Task[]): void {
  if (tasks.length === 0) {
    alert('No tasks to export');
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  const margin = 15;
  const maxWidth = pageWidth - 2 * margin;

  // Add title
  doc.setFontSize(16);
  doc.setTextColor(51, 51, 51);
  doc.text('VoxValt Tasks Report', margin, yPosition);
  yPosition += 10;

  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, margin, yPosition);
  yPosition += 10;

  // Add summary
  const completedCount = tasks.filter((t) => t.completed).length;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Total Tasks: ${tasks.length} | Completed: ${completedCount} | Pending: ${tasks.length - completedCount}`,
    margin,
    yPosition
  );
  yPosition += 12;

  // Add tasks
  doc.setFontSize(10);
  const lineHeight = 8;
  const checkPageBreak = () => {
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  tasks.forEach((task, index) => {
    checkPageBreak();

    // Task number and title
    doc.setTextColor(51, 51, 51);
    doc.setFont('helvetica', 'bold');
    const titleText = `${index + 1}. ${task.title}`;
    doc.text(titleText, margin, yPosition);
    yPosition += lineHeight;

    // Task details
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);

    // Type and Status
    const statusText = `Type: ${task.task_type || task.type || 'task'} | Status: ${task.completed ? 'Completed' : 'Pending'}`;
    doc.text(statusText, margin + 3, yPosition);
    yPosition += 5;

    // Description
    if (task.description) {
      const descLines = doc.splitTextToSize(task.description, maxWidth - 6);
      descLines.forEach((line: string) => {
        checkPageBreak();
        doc.text(line, margin + 3, yPosition);
        yPosition += 5;
      });
    }

    // Due date
    if (task.due_date) {
      const dueText = `Due: ${format(new Date(task.due_date), 'MMM dd, yyyy')}`;
      doc.text(dueText, margin + 3, yPosition);
      yPosition += 5;
    }

    // Created date
    const createdText = task.created_at ? `Created: ${format(new Date(task.created_at), 'MMM dd, yyyy HH:mm')}` : 'Created: N/A';
    doc.text(createdText, margin + 3, yPosition);
    yPosition += 8;

    // Separator
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
  });

  // Save PDF
  doc.save(`tasks-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
