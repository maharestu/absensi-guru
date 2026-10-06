const xlsx = require('xlsx');

const filePath = 'c:\\Users\\bdstd\\Downloads\\JADWAL KBM - PIKET TA.2026-2027.xlsx';
const wb = xlsx.readFile(filePath);

wb.SheetNames.forEach(sheetName => {
  console.log('\n========================================');
  console.log('SHEET:', sheetName);
  console.log('========================================');
  const ws = wb.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
  // Print ALL rows
  data.forEach((row, i) => {
    // Only print non-empty rows
    const filtered = row.filter(cell => cell !== null && cell !== undefined && cell !== '');
    if (filtered.length > 0) {
      console.log(`Row ${i}: ${JSON.stringify(row)}`);
    }
  });
});
