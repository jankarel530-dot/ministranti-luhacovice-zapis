import { Mass, Ministrant } from '../types';
import { formatShortCzechDate, getRankBadgeStyle } from './helpers';

export function exportMassesToPDF(
  masses: Mass[],
  ministrantsMap: Map<string, Ministrant>,
  monthLabel: string = 'Všechny měsíce',
  parishName: string = 'Luhačovice'
) {
  // Create printable HTML document
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Prosím povolte vyskakovací okna (pop-up) pro vygenerování PDF.');
    return;
  }

  const sorted = [...masses].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  const todayStr = new Date().toLocaleDateString('cs-CZ');

  const rowsHtml = sorted
    .map((mass, idx) => {
      const serverNames = mass.assignments
        .map((a) => ministrantsMap.get(a.serverId)?.name)
        .filter(Boolean)
        .join(', ');

      const rankStyle = getRankBadgeStyle(mass.rank);

      return `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 11px;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold; whitespace: nowrap;">
            ${formatShortCzechDate(mass.date)}<br/>
            <span style="color: #047857; font-size: 11px;">⏱ ${mass.time}</span>
          </td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">
            <span style="font-size: 9px; text-transform: uppercase; padding: 2px 5px; border-radius: 4px; font-weight: bold; background-color: #f1f5f9; color: #334155;">
              ${rankStyle.label}
            </span>
            <div style="font-weight: bold; font-size: 12px; margin-top: 3px;">${mass.title}</div>
            ${mass.note ? `<div style="font-style: italic; color: #64748b; font-size: 10px;">${mass.note}</div>` : ''}
          </td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 600;">
            ${serverNames || '<span style="color: #94a3b8; font-style: italic;">Obsazeno 0 ministrantů</span>'}
          </td>
        </tr>
      `;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <title>Rozpis ministrantů - Farnost ${parishName}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; }
        .header { text-align: center; border-bottom: 2px solid #047857; padding-bottom: 12px; margin-bottom: 16px; }
        .header h1 { margin: 0; font-size: 22px; color: #065f46; text-transform: uppercase; letter-spacing: 1px; }
        .header p { margin: 4px 0 0 0; font-size: 12px; color: #475569; font-weight: bold; }
        .meta { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-bottom: 12px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #047857; color: #ffffff; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #047857; }
        .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 15px; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; font-weight: bold; color: #065f46;">📄 Náhled rozpisu do PDF</span>
        <button onclick="window.print()" style="background-color: #047857; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">
          🖨️ Vytisknout / Uložit jako PDF
        </button>
      </div>

      <div class="header">
        <h1>MINISTRANTI LUHAČOVICE</h1>
        <p>Oficiální rozpis oltářní služby • Kostel Svaté Rodiny, ${parishName}</p>
      </div>

      <div class="meta">
        <span>Období: <strong>${monthLabel}</strong></span>
        <span>Počet mší: <strong>${masses.length}</strong></span>
        <span>Vygenerováno: <strong>${todayStr}</strong></span>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 130px;">Datum a čas</th>
            <th>Mše svatá / Liturgie</th>
            <th>Přihlášení ministranti</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="3" style="text-align:center; padding:20px; color:#64748b;">Žádné mše v tomto období.</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        Rozpis mší svatých a služeb ministrantů • Farnost Luhačovice
      </div>

      <script>
        // Auto trigger print dialog after small render delay
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

export function exportMinistrantsToPDF(
  ministrants: Ministrant[],
  parishName: string = 'Luhačovice'
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Prosím povolte vyskakovací okna (pop-up) pro vygenerování PDF.');
    return;
  }

  const todayStr = new Date().toLocaleDateString('cs-CZ');

  const rowsHtml = ministrants
    .map(
      (m, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 11px;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">#${idx + 1}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px; color: #0f172a;">${m.name}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 600; color: #047857;">${m.phone || '-'}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center;">
            <span style="padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; ${m.isActive ? 'background-color: #dcfce7; color: #166534;' : 'background-color: #f1f5f9; color: #64748b;'}">
              ${m.isActive ? 'Aktivní' : 'Neaktivní'}
            </span>
          </td>
        </tr>
      `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <title>Seznam ministrantů - Farnost ${parishName}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; }
        .header { text-align: center; border-bottom: 2px solid #047857; padding-bottom: 12px; margin-bottom: 16px; }
        .header h1 { margin: 0; font-size: 22px; color: #065f46; text-transform: uppercase; letter-spacing: 1px; }
        .header p { margin: 4px 0 0 0; font-size: 12px; color: #475569; font-weight: bold; }
        .meta { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-bottom: 12px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #047857; color: #ffffff; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #047857; }
        .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 15px; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; font-weight: bold; color: #065f46;">📄 Náhled seznamu ministrantů</span>
        <button onclick="window.print()" style="background-color: #047857; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">
          🖨️ Vytisknout / Uložit jako PDF
        </button>
      </div>

      <div class="header">
        <h1>MINISTRANTI LUHAČOVICE</h1>
        <p>Seznam ministrantů a kontakty • Kostel Svaté Rodiny, ${parishName}</p>
      </div>

      <div class="meta">
        <span>Celkem ministrantů: <strong>${ministrants.length}</strong></span>
        <span>Vygenerováno: <strong>${todayStr}</strong></span>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th>Jméno a příjmení</th>
            <th>Telefonní kontakt</th>
            <th style="width: 90px; text-align: center;">Stav</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        Farnost Luhačovice • Důvěrný seznam kontaktů ministrantů
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
