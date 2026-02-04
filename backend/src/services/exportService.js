/**
 * ========================================================================
 * EXPORT SERVICE
 * ========================================================================
 * 
 * Handles generation of PDF reports, CSV exports, and Excel workbooks
 */

import PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';
import ExcelJS from 'exceljs';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import pool from '../utils/db.js';
import * as trafficLightService from './trafficLightService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chart configuration
const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
  width: 500, 
  height: 300,
  backgroundColour: 'white'
});

/**
 * Generate PDF report for a reporting period
 * @param {number} periodId - Reporting period ID
 * @param {object} options - Report options (includeCharts, includeDetails, etc.)
 * @returns {Promise<Buffer>} PDF buffer
 */
// Helper for drawing lines
const drawLine = (doc, y) => {
  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, y).lineTo(545, y).stroke();
};

const COLORS = {
  primary: '#0f172a', // Midnight Navy
  secondary: '#64748b', // Slate Gray
  accent: '#10b981', // Growth Green
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  text: '#334155',
  lightText: '#94a3b8',
  bgLight: '#f8fafc'
};

export async function generatePDFReport(periodId, options = {}) {
  const {
    includeDetails = true,
    includeBreakdown = true,
    companyLogo = null,
    language = 'en'
  } = options;

  const validLang = ['en', 'de'].includes(language) ? language : 'en';

  const t = {
    en: {
      reportTitle: 'GHG Emissions Report',
      period: 'Reporting Period',
      generated: 'Generated on',
      page: 'Page',
      summary: 'Executive Summary',
      totalTitle: 'Total Emissions',
      scopeBreakdown: 'Scope Breakdown',
      activityBreakdown: 'Activity Breakdown',
      metrics: 'Key Metrics',
      recommendations: 'Recommendations',
      audit: 'Audit Trail',
      disclaimer: 'This report follows the GHG Protocol Corporate Standard.',
      scope1: 'Scope 1 (Direct)',
      scope2: 'Scope 2 (Indirect - Energy)',
      scope3: 'Scope 3 (Indirect - Value Chain)',
      status: 'Status',
      industry: 'Industry',
      gwp: 'GWP Standard',
      ar5: 'IPCC AR5',
      scoreGreen: 'Strong Performance',
      scoreYellow: 'Needs Improvement',
      scoreRed: 'Critical Action Required',
      scoreGreenDesc: 'Your company demonstrates leadership in emissions management.',
      scoreYellowDesc: 'Your company has identified areas for improvement.',
      scoreRedDesc: 'Immediate action is recommended to align with standards.',
      improvements: 'Priority Improvements'
    },
    de: {
      reportTitle: 'THG-Emissionsbericht',
      period: 'Berichtszeitraum',
      generated: 'Erstellt am',
      page: 'Seite',
      summary: 'Zusammenfassung',
      totalTitle: 'Gesamtemissionen',
      scopeBreakdown: 'Scope-Aufschlüsselung',
      activityBreakdown: 'Aktivitätsaufschlüsselung',
      metrics: 'Wichtige Kennzahlen',
      recommendations: 'Empfehlungen',
      audit: 'Audit-Protokoll',
      disclaimer: 'Dieser Bericht folgt dem GHG Protocol Corporate Standard.',
      scope1: 'Scope 1 (Direkt)',
      scope2: 'Scope 2 (Indirekt - Energie)',
      scope3: 'Scope 3 (Indirekt - Wertschöpfung)',
      status: 'Status',
      industry: 'Branche',
      gwp: 'GWP-Standard',
      ar5: 'IPCC AR5',
      scoreGreen: 'Starke Leistung',
      scoreYellow: 'Verbesserungswürdig',
      scoreRed: 'Kritischer Handlungsbedarf',
      scoreGreenDesc: 'Ihr Unternehmen zeigt Führungsstärke im Emissionsmanagement.',
      scoreYellowDesc: 'Ihr Unternehmen hat Verbesserungsbereiche identifiziert.',
      scoreRedDesc: 'Sofortige Maßnahmen werden empfohlen.',
      improvements: 'Priorisierte Verbesserungen'
    }
  };

  const text = t[validLang];

  // Fetch Data
  const periodQuery = await pool.query(
    `SELECT rp.*, c.name as company_name, c.industry, c.address 
     FROM reporting_periods rp 
     JOIN companies c ON rp.company_id = c.id 
     WHERE rp.id = $1`,
    [periodId]
  );

  if (periodQuery.rows.length === 0) throw new Error('Reporting period not found');
  const period = periodQuery.rows[0];

  const emissionsQuery = await pool.query(
    `SELECT 
       SUM(
         CASE 
           WHEN activity_type IN ('electricity', 'steam') THEN market_based_co2e_mt
           ELSE co2e_metric_tons
         END
       ) as total_emissions,
       SUM((co2_kg / 1000.0)) as total_co2,
       SUM((ch4_g / 1000000.0)) as total_ch4,
       SUM((n2o_g / 1000000.0)) as total_n2o,
       activity_type,
       COUNT(*) as activity_count
     FROM emission_calculations
     WHERE reporting_period_id = $1
     GROUP BY activity_type
     ORDER BY total_emissions DESC`,
    [periodId]
  );

  const emissions = emissionsQuery.rows;
  const totalEmissions = emissions.reduce((sum, row) => sum + parseFloat(row.total_emissions || 0), 0);

  // Fetch Scope 2 Split Data
  const scope2Query = await pool.query(
    `SELECT 
       SUM(ec.location_based_co2e_mt) as location_based,
       SUM(ec.market_based_co2e_mt) as market_based
     FROM emission_calculations ec
     WHERE ec.reporting_period_id = $1
       AND ec.activity_type IN ('electricity', 'steam')`,
    [periodId]
  );
  
  const scope2Split = {
    location: parseFloat(scope2Query.rows[0]?.location_based || 0),
    market: parseFloat(scope2Query.rows[0]?.market_based || 0)
  };

  const trafficLightScore = await trafficLightService.calculateTrafficLightScore(periodId, options.companyMetrics || {});

  // PDF Setup
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    autoFirstPage: true
  });
  
  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Use async IIFE to allow await inside Promise
    (async () => {
      try {
        // --- Header Structure ---
    const drawHeader = () => {
      // Top Bar
      doc.rect(0, 0, 595.28, 60).fill(COLORS.primary); // Full width header
      
      // Logo / Company Name
      if (companyLogo) {
          // doc.image(companyLogo, 50, 15, { height: 30 }); // Placeholder for logical logo logic
      }
      doc.fontSize(18).fillColor('white').font('Helvetica-Bold')
         .text('AURIXON', 50, 22);
      
      // Report Title (Right aligned)
      doc.fontSize(12).font('Helvetica')
         .text(text.reportTitle, 400, 25, { width: 145, align: 'right' });
    };

    // --- Footer Structure ---
    const drawFooter = () => {
      const bottom = doc.page.height - 40;
      doc.moveTo(50, bottom).lineTo(545, bottom).strokeColor('#e2e8f0').lineWidth(1).stroke();
      
      doc.fontSize(8).fillColor(COLORS.lightText)
         .text(period.company_name, 50, bottom + 10);
         
      doc.text(`${text.generated}: ${new Date().toLocaleDateString()}`, 0, bottom + 10, { align: 'right', width: 545 });
    };

    // Draw Header on first page
    drawHeader();

    // --- Title Section ---
    doc.moveDown(4); // Space after header
    
    // Company Title
    doc.fillColor(COLORS.primary).fontSize(26).font('Helvetica-Bold')
       .text(period.company_name, { align: 'left' });
    
    doc.moveDown(0.2);
    doc.fillColor(COLORS.secondary).fontSize(12).font('Helvetica')
       .text(`${text.industry}: ${period.industry || 'N/A'}`, { align: 'left' });

    doc.moveDown(0.5);

    // Disclaimer standard
    let standardText = 'This report follows the GHG Protocol Corporate Standard.';
    if (options.reportType === 'csrd') standardText = 'This report is aligned with CSRD (Corporate Sustainability Reporting Directive) requirements.';
    if (options.reportType === 'iso') standardText = 'This report follows ISO 14064-1:2018 standards.';

    doc.fillColor(COLORS.secondary).fontSize(8).font('Helvetica-Oblique')
       .text(standardText, { align: 'left' });
    
    doc.moveDown(1.5);

    // Period Box
    const boxTop = doc.y;
    doc.roundedRect(50, boxTop, 495, 50, 5).fill(COLORS.bgLight);
    
    doc.fillColor(COLORS.text).fontSize(10).font('Helvetica-Bold')
       .text(text.period.toUpperCase(), 70, boxTop + 12);
    
    doc.fillColor(COLORS.primary).fontSize(12).font('Helvetica')
       .text(period.period_label, 70, boxTop + 28);
       
    const startDate = period.period_start_date || period.start_date;
    const endDate = period.period_end_date || period.end_date;
    doc.text(`${new Date(startDate).toLocaleDateString(validLang === 'de' ? 'de-DE' : 'en-US')} - ${new Date(endDate).toLocaleDateString(validLang === 'de' ? 'de-DE' : 'en-US')}`, 300, boxTop + 28, { align: 'right', width: 220 });

    doc.moveDown(4);

    // --- Executive Summary Scores ---
    doc.fillColor(COLORS.primary).fontSize(16).font('Helvetica-Bold').text(text.summary);
    doc.moveDown(0.5);
    drawLine(doc, doc.y);
    doc.moveDown(1.5);

    const scoreY = doc.y;
    
    // Total Emissions Card
    doc.roundedRect(50, scoreY, 235, 130, 8).fill('#f1f5f9');
    doc.fillColor(COLORS.secondary).fontSize(10).font('Helvetica-Bold')
       .text(text.totalTitle.toUpperCase(), 70, scoreY + 20);
    
    doc.fillColor(COLORS.primary).fontSize(28).font('Helvetica-Bold')
       .text(totalEmissions.toFixed(2), 70, scoreY + 45);
       
    doc.fillColor(COLORS.secondary).fontSize(12).font('Helvetica')
       .text('MT CO2e', 70, scoreY + 80);

    // Traffic Light Card with Visual Indicator
    const cardColor = trafficLightScore.overall === 'green' ? '#ecfdf5' : 
                      trafficLightScore.overall === 'yellow' ? '#fffbeb' : '#fef2f2';
    const borderColor = trafficLightScore.overall === 'green' ? COLORS.success : 
                        trafficLightScore.overall === 'yellow' ? COLORS.warning : COLORS.danger;
    
    doc.roundedRect(310, scoreY, 235, 130, 8).fill(cardColor);
    doc.strokeColor(borderColor).lineWidth(2).roundedRect(310, scoreY, 235, 130, 8).stroke();
    
    // Draw Traffic Light Visual (3 circles)
    const lightX = 330;
    const lightY = scoreY + 25;
    const lightRadius = 8;
    const lightSpacing = 25;
    
    // Red light
    doc.circle(lightX, lightY, lightRadius)
       .fill(trafficLightScore.overall === 'red' ? COLORS.danger : '#cccccc');
    
    // Yellow light
    doc.circle(lightX, lightY + lightSpacing, lightRadius)
       .fill(trafficLightScore.overall === 'yellow' ? COLORS.warning : '#cccccc');
    
    // Green light
    doc.circle(lightX, lightY + lightSpacing * 2, lightRadius)
       .fill(trafficLightScore.overall === 'green' ? COLORS.success : '#cccccc');
    
    const ratingTitle = trafficLightScore.overall === 'green' ? text.scoreGreen :
                        trafficLightScore.overall === 'yellow' ? text.scoreYellow : text.scoreRed;
    
    doc.fillColor(borderColor).fontSize(14).font('Helvetica-Bold')
       .text(ratingTitle.toUpperCase(), 355, scoreY + 20);
       
    // Short description
    const ratingDesc = trafficLightScore.overall === 'green' ? text.scoreGreenDesc :
                       trafficLightScore.overall === 'yellow' ? text.scoreYellowDesc : text.scoreRedDesc;
                       
    doc.fillColor(COLORS.text).fontSize(10).font('Helvetica')
       .text(ratingDesc, 355, scoreY + 55, { width: 170 });

    doc.moveDown(9);

    // --- Scope Breakdown (Detailed) ---
    doc.fillColor(COLORS.primary).fontSize(14).font('Helvetica-Bold').text(text.scopeBreakdown);
    doc.moveDown(0.5);
    
    // Explicit Scope 2 Split Table
    const tableTop = doc.y;
    doc.rect(50, tableTop, 495, 25).fill(COLORS.bgLight);
    doc.fillColor(COLORS.secondary).fontSize(9).font('Helvetica-Bold');
    doc.text('Scope / Category', 60, tableTop + 8);
    doc.text('Emissions (MT CO2e)', 400, tableTop + 8, { width: 100, align: 'right' });
    
    let currentY = tableTop + 30;
    
    // Scope 1
    doc.fillColor(COLORS.text).fontSize(10).font('Helvetica-Bold').text(text.scope1, 60, currentY);
    // Don't have exact Scope 1 sum here easily without summing `emissions` array, but traffic light service has it? 
    // We'll calculate it from `emissions` array for accuracy.
    const s1ActivityTypes = [
      'stationary_combustion', 'mobile_sources', 
      'refrigeration_ac', 'refrigeration_ac_material_balance', 'refrigeration_ac_simplified_material_balance', 'refrigeration_ac_screening_method', 
      'fire_suppression', 'fire_suppression_material_balance', 'fire_suppression_simplified_material_balance', 'fire_suppression_screening_method', 
      'purchased_gases'
    ];
    const s1Total = emissions.filter(e => s1ActivityTypes.includes(e.activity_type))
                             .reduce((sum, e) => sum + parseFloat(e.total_emissions), 0);
    doc.font('Helvetica').text(s1Total.toFixed(3), 400, currentY, { align: 'right', width: 100 });
    drawLine(doc, currentY + 15);
    currentY += 25;

    // Scope 2 (Location)
    doc.font('Helvetica-Bold').text('Scope 2 (Location Based)', 60, currentY);
    doc.font('Helvetica').text(scope2Split.location.toFixed(3), 400, currentY, { align: 'right', width: 100 });
    drawLine(doc, currentY + 15);
    currentY += 25;

    // Scope 2 (Market)
    doc.font('Helvetica-Bold').text('Scope 2 (Market Based)', 60, currentY);
    doc.font('Helvetica').text(scope2Split.market.toFixed(3), 400, currentY, { align: 'right', width: 100 });
    drawLine(doc, currentY + 15);
    currentY += 25;

    // Scope 3
    const s2ActivityTypes = ['electricity', 'steam'];
    const s3Total = emissions.filter(e => !s1ActivityTypes.includes(e.activity_type) && !s2ActivityTypes.includes(e.activity_type))
                             .reduce((sum, e) => sum + parseFloat(e.total_emissions), 0);
    doc.font('Helvetica-Bold').text(text.scope3, 60, currentY);
    doc.font('Helvetica').text(s3Total.toFixed(3), 400, currentY, { align: 'right', width: 100 });
    
    doc.moveDown(3);

    // --- Charts Section (if includeCharts is enabled) ---
    const includeCharts = options.includeCharts !== false;
    
    if (includeCharts && emissions.length > 0) {
      // Check if we need a new page for charts
      if (doc.y > 500) {
        doc.addPage();
        drawHeader();
        doc.moveDown(4);
      }

      doc.fillColor(COLORS.primary).fontSize(16).font('Helvetica-Bold').text('Emissions Visualizations');
      doc.moveDown(0.5);
      drawLine(doc, doc.y);
      doc.moveDown(1.5);

      try {
        // Generate Scope Breakdown Pie Chart
        const scopeChartConfig = {
          type: 'doughnut',
          data: {
            labels: ['Scope 1', 'Scope 2 (Market)', 'Scope 3'],
            datasets: [{
              data: [s1Total, scope2Split.market, s3Total],
              backgroundColor: [
                '#10b981', // Green for Scope 1
                '#06b6d4', // Cyan for Scope 2
                '#8b5cf6'  // Purple for Scope 3
              ],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  font: { size: 12, family: 'Arial' },
                  padding: 15,
                  usePointStyle: true
                }
              },
              title: {
                display: true,
                text: 'Emissions by Scope',
                font: { size: 16, weight: 'bold', family: 'Arial' },
                padding: { bottom: 20 }
              }
            }
          }
        };

        const scopeChartBuffer = await chartJSNodeCanvas.renderToBuffer(scopeChartConfig);
        const chartY = doc.y;
        doc.image(scopeChartBuffer, 50, chartY, { width: 230, height: 150 });

        // Generate Top Emissions Sources Bar Chart
        const topEmissions = emissions.slice(0, 5); // Top 5 sources
        const barChartConfig = {
          type: 'bar',
          data: {
            labels: topEmissions.map(e => e.activity_type.replace(/_/g, ' ').toUpperCase().substring(0, 15)),
            datasets: [{
              label: 'MT CO₂e',
              data: topEmissions.map(e => parseFloat(e.total_emissions)),
              backgroundColor: '#06b6d4',
              borderRadius: 4
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: 'Top 5 Emission Sources',
                font: { size: 16, weight: 'bold', family: 'Arial' },
                padding: { bottom: 20 }
              }
            },
            scales: {
              x: {
                beginAtZero: true,
                ticks: { font: { size: 10 } },
                grid: { color: '#e5e7eb' }
              },
              y: {
                ticks: { font: { size: 10 } },
                grid: { display: false }
              }
            }
          }
        };

        const barChartBuffer = await chartJSNodeCanvas.renderToBuffer(barChartConfig);
        doc.image(barChartBuffer, 310, chartY, { width: 240, height: 150 });

        doc.moveDown(12);

      } catch (chartError) {
        console.error('[ExportService] Chart generation error:', chartError);
        // Continue without charts if generation fails
        doc.fillColor(COLORS.secondary).fontSize(10).font('Helvetica-Oblique')
           .text('Charts could not be generated', { align: 'center' });
        doc.moveDown(2);
      }
    }

    // --- Detailed Data (only add new page if we have breakdown content) ---
    const hasBreakdownContent = includeBreakdown && emissions.length > 0;
    const hasRecommendations = trafficLightScore.recommendations && trafficLightScore.recommendations.length > 0;
    
    // Check if we need a new page (if current page has less than 200 points remaining)
    if (hasBreakdownContent || hasRecommendations) {
      if (doc.y > 600) {
        doc.addPage();
        drawHeader();
        doc.moveDown(4);
      }
    }

    if (hasBreakdownContent) {
      doc.fillColor(COLORS.primary).fontSize(16).font('Helvetica-Bold').text(text.activityBreakdown);
      doc.moveDown(0.5);
      drawLine(doc, doc.y);
      doc.moveDown(1);
      
      // Table Header
      const tableTop2 = doc.y;
      doc.rect(50, tableTop2, 495, 25).fill(COLORS.bgLight);
      doc.fillColor(COLORS.secondary).fontSize(9).font('Helvetica-Bold');
      doc.text('Activity Type', 60, tableTop2 + 8);
      doc.text('Emissions (MT CO2e)', 350, tableTop2 + 8, { width: 100, align: 'right' });
      doc.text('% Total', 470, tableTop2 + 8, { width: 60, align: 'right' });
      
      doc.moveDown(2);
      
      // Table Rows
      emissions.forEach((row, i) => {
          const y = doc.y;
          
          // Row background for alternate rows
          if (i % 2 === 1) {
              doc.rect(50, y - 5, 495, 20).fill('#f8fafc');
          }
          
          doc.fillColor(COLORS.text).fontSize(10).font('Helvetica').text(row.activity_type, 60, y);
          
          const val = parseFloat(row.total_emissions);
          const percent = totalEmissions > 0 ? ((val / totalEmissions) * 100).toFixed(1) : 0;
          
          doc.text(val.toFixed(3), 350, y, { width: 100, align: 'right' });
          doc.text(`${percent}%`, 470, y, { width: 60, align: 'right' });
          
          doc.moveDown(1.2);
          
          // Check for page break
          if (doc.y > 700) { // Roughly 1 inch from bottom
              doc.addPage();
              drawHeader();
              doc.moveDown(4);
          }
      });
    }
    
    doc.moveDown(2);

    // --- Detailed Activity Entries by Scope (NEW SECTION) ---
    if (includeDetails) {
      // Fetch all individual activity entries with their calculation results
      const entriesQuery = await pool.query(
        `SELECT 
           ec.id,
           ec.activity_type,
           ec.activity_id,
           ec.co2e_metric_tons,
           COALESCE(ec.location_based_co2e_mt, 0) as location_based_co2e_mt,
           COALESCE(ec.market_based_co2e_mt, 0) as market_based_co2e_mt,
           ec.co2_kg,
           ec.ch4_g,
           ec.n2o_g,
           ec.calculation_metadata,
           ec.created_at
         FROM emission_calculations ec
         WHERE ec.reporting_period_id = $1
         ORDER BY ec.activity_type, ec.created_at`,
        [periodId]
      );

      const entries = entriesQuery.rows;

      if (entries.length > 0) {
        // Start new page for detailed entries
        doc.addPage();
        drawHeader();
        doc.moveDown(4);

        doc.fillColor(COLORS.primary).fontSize(18).font('Helvetica-Bold')
           .text('Detailed Activity Entries', { align: 'center' });
        doc.moveDown(0.5);
        doc.fillColor(COLORS.secondary).fontSize(10).font('Helvetica')
           .text('Complete listing of all emission sources with individual calculations', { align: 'center' });
        doc.moveDown(1.5);
        drawLine(doc, doc.y);
        doc.moveDown(1.5);

        // Group entries by scope
        const scopeGroups = {
          scope1: { 
            title: 'SCOPE 1 — DIRECT EMISSIONS',
            subtitle: 'Emissions from owned or controlled sources',
            types: [
              'stationary_combustion', 'mobile_sources', 
              'refrigeration_ac', 'refrigeration_ac_material_balance', 'refrigeration_ac_simplified_material_balance', 'refrigeration_ac_screening_method', 
              'fire_suppression', 'fire_suppression_material_balance', 'fire_suppression_simplified_material_balance', 'fire_suppression_screening_method', 
              'purchased_gases'
            ],
            entries: [],
            color: '#10b981'
          },
          scope2: { 
            title: 'SCOPE 2 — INDIRECT EMISSIONS (ENERGY)',
            subtitle: 'Emissions from purchased electricity, steam, heating, and cooling',
            types: ['electricity', 'steam'],
            entries: [],
            color: '#06b6d4'
          },
          scope3: { 
            title: 'SCOPE 3 — OTHER INDIRECT EMISSIONS',
            subtitle: 'All other indirect emissions in the value chain',
            types: [], // Everything else
            entries: [],
            color: '#8b5cf6'
          }
        };

        // Categorize entries
        entries.forEach(entry => {
          if (scopeGroups.scope1.types.includes(entry.activity_type)) {
            scopeGroups.scope1.entries.push(entry);
          } else if (scopeGroups.scope2.types.includes(entry.activity_type)) {
            scopeGroups.scope2.entries.push(entry);
          } else {
            scopeGroups.scope3.entries.push(entry);
          }
        });

        // Render each scope section
        for (const [scopeKey, scope] of Object.entries(scopeGroups)) {
          if (scope.entries.length === 0) continue;

          // Check for page break
          if (doc.y > 650) {
            doc.addPage();
            drawHeader();
            doc.moveDown(4);
          }

          // Scope Header
          doc.roundedRect(50, doc.y, 495, 40, 5).fill(scope.color);
          doc.fillColor('white').fontSize(12).font('Helvetica-Bold')
             .text(scope.title, 60, doc.y + 8);
          doc.fillColor('white').fontSize(9).font('Helvetica')
             .text(scope.subtitle, 60, doc.y + 22);
          doc.moveDown(3);

          // Calculate scope total
          let scopeTotal = 0;
          if (scopeKey === 'scope2') {
            scopeTotal = scope.entries.reduce((sum, e) => sum + parseFloat(e.market_based_co2e_mt || e.co2e_metric_tons || 0), 0);
          } else {
            scopeTotal = scope.entries.reduce((sum, e) => sum + parseFloat(e.co2e_metric_tons || 0), 0);
          }

          // Entries table header
          const tableTop = doc.y;
          doc.rect(50, tableTop, 495, 22).fill(COLORS.bgLight);
          doc.fillColor(COLORS.secondary).fontSize(8).font('Helvetica-Bold');
          doc.text('SOURCE', 55, tableTop + 7);
          doc.text('TYPE', 180, tableTop + 7);
          doc.text('CO₂e (MT)', 380, tableTop + 7, { width: 70, align: 'right' });
          doc.text('METHOD', 455, tableTop + 7, { width: 85, align: 'right' });
          doc.moveDown(1.5);

          // Entry rows
          scope.entries.forEach((entry, idx) => {
            if (doc.y > 720) {
              doc.addPage();
              drawHeader();
              doc.moveDown(4);
            }

            const rowY = doc.y;
            if (idx % 2 === 0) {
              doc.rect(50, rowY - 2, 495, 18).fill('#f8fafc');
            }

            const emissions = scopeKey === 'scope2' 
              ? parseFloat(entry.market_based_co2e_mt || entry.co2e_metric_tons || 0)
              : parseFloat(entry.co2e_metric_tons || 0);

            // Extract meaningful info from calculation_metadata
            const meta = entry.calculation_metadata || {};
            const sourceId = meta.source_id || meta.vehicle_id || meta.equipment_id || entry.activity_id?.substring(0, 8) || 'Entry';
            const quantity = meta.quantity || meta.amount || meta.distance || meta.consumption || '';
            const unit = meta.unit || meta.fuel_unit || '';
            const methodLabel = quantity && unit ? `${quantity} ${unit}` : 'Calculated';

            doc.fillColor(COLORS.text).fontSize(8).font('Helvetica');
            doc.text(sourceId, 55, rowY, { width: 120, ellipsis: true });
            doc.text(entry.activity_type.replace(/_/g, ' '), 180, rowY, { width: 190, ellipsis: true });
            doc.text(emissions.toFixed(4), 380, rowY, { width: 70, align: 'right' });
            doc.text(methodLabel, 455, rowY, { width: 85, align: 'right' });

            doc.moveDown(0.9);
          });

          // Scope subtotal
          doc.moveDown(0.5);
          doc.roundedRect(320, doc.y, 225, 25, 3).fill(scope.color + '20');
          doc.fillColor(scope.color).fontSize(10).font('Helvetica-Bold')
             .text(`Scope Total: ${scopeTotal.toFixed(3)} MT CO₂e`, 330, doc.y + 7);
          doc.moveDown(2.5);
        }

        // Summary box at the bottom
        if (doc.y > 650) {
          doc.addPage();
          drawHeader();
          doc.moveDown(4);
        }

        doc.roundedRect(50, doc.y, 495, 60, 8).fill(COLORS.primary);
        const summaryY = doc.y;
        doc.fillColor('white').fontSize(10).font('Helvetica')
           .text('TOTAL CARBON FOOTPRINT', 70, summaryY + 12);
        doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
           .text(`${totalEmissions.toFixed(2)} MT CO₂e`, 70, summaryY + 28);
        
        doc.fillColor('white').fontSize(8).font('Helvetica')
           .text(`Based on ${entries.length} activity entries`, 350, summaryY + 20);
        doc.text(`Calculated: ${new Date().toLocaleDateString()}`, 350, summaryY + 35);
        
        doc.moveDown(5);
      }
    }

    doc.moveDown(2);

    // --- Recommendations Section ---
    if (trafficLightScore.recommendations && trafficLightScore.recommendations.length > 0) {
        doc.fillColor(COLORS.primary).fontSize(16).font('Helvetica-Bold').text(text.recommendations);
        doc.moveDown(0.5);
        drawLine(doc, doc.y);
        doc.moveDown(1);
        
        trafficLightScore.recommendations.forEach((rec, i) => {
            const y = doc.y;
            // Bullet point
            doc.circle(60, y + 4, 3).fill(COLORS.accent);
            doc.fillColor(COLORS.text).fontSize(10).font('Helvetica')
               .text(rec, 80, y, { width: 450 });
            doc.moveDown(0.8);
        });
    }

    // Add footer to last page
    drawFooter();

    doc.end();
      } catch (error) {
        reject(error);
      }
    })();
  });
}

/**
 * Generate CSV export for a reporting period
 * @param {number} periodId - Reporting period ID
 * @param {string} exportPath - Path to save CSV file
 * @returns {Promise<string>} Path to generated CSV file
 */
export async function generateCSVExport(periodId, exportPath) {
  // Fetch all calculations
  const query = await pool.query(
    `SELECT 
       cr.id,
       cr.activity_type,
       cr.co2e_metric_tons as total_emissions,
       (cr.co2_kg / 1000.0) as co2,
       (cr.ch4_g / 1000000.0) as ch4,
       (cr.n2o_g / 1000000.0) as n2o,
       cr.calculation_metadata as input_data,
       cr.created_at as calculated_at,
       u.email as calculated_by
     FROM emission_calculations cr
     LEFT JOIN users u ON cr.calculated_by = u.id::text
     WHERE cr.reporting_period_id = $1
     ORDER BY cr.created_at DESC`,
    [periodId]
  );

  if (query.rows.length === 0) {
    throw new Error('No calculations found for this period');
  }

  const csvWriter = createObjectCsvWriter({
    path: exportPath,
    header: [
      { id: 'id', title: 'Calculation ID' },
      { id: 'activity_type', title: 'Activity Type' },
      { id: 'total_emissions', title: 'Total Emissions (MT CO2e)' },
      { id: 'co2', title: 'CO2 (MT)' },
      { id: 'ch4', title: 'CH4 (MT)' },
      { id: 'n2o', title: 'N2O (MT)' },
      { id: 'calculated_at', title: 'Calculated At' },
      { id: 'calculated_by', title: 'Calculated By' }
    ]
  });

  await csvWriter.writeRecords(query.rows);
  return exportPath;
}

/**
 * Generate Excel workbook with multiple sheets
 * @param {number} periodId - Reporting period ID
 * @param {string} exportPath - Path to save Excel file
 * @returns {Promise<string>} Path to generated Excel file
 */
export async function generateExcelExport(periodId, exportPath) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AURIXON';
  workbook.created = new Date();

  // Fetch period data
  const periodQuery = await pool.query(
    `SELECT rp.*, c.name as company_name 
     FROM reporting_periods rp 
     JOIN companies c ON rp.company_id = c.id 
     WHERE rp.id = $1`,
    [periodId]
  );

  if (periodQuery.rows.length === 0) {
    throw new Error('Reporting period not found');
  }

  const period = periodQuery.rows[0];

  // Sheet 1: Summary
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 30 }
  ];

  summarySheet.addRows([
    { metric: 'Company', value: period.company_name },
    { metric: 'Period Name', value: period.period_label },
    { metric: 'Start Date', value: period.start_date },
    { metric: 'End Date', value: period.end_date },
    { metric: 'Status', value: period.status }
  ]);

  // Fetch aggregated emissions from emission_calculations table
  const emissionsQuery = await pool.query(
    `SELECT 
       SUM(co2e_metric_tons) as total_emissions,
       activity_type,
       COUNT(*) as activity_count
     FROM emission_calculations
     WHERE reporting_period_id = $1
     GROUP BY activity_type`,
    [periodId]
  );

  const totalEmissions = emissionsQuery.rows.reduce((sum, row) => 
    sum + parseFloat(row.total_emissions || 0), 0
  );

  summarySheet.addRow({ metric: '', value: '' });
  summarySheet.addRow({ metric: 'Total Emissions (MT CO2e)', value: totalEmissions.toFixed(2) });
  summarySheet.addRow({ metric: 'Activity Types', value: emissionsQuery.rows.length });

  // Apply styling to summary sheet
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };

  // Sheet 2: Emissions by Activity Type
  const breakdownSheet = workbook.addWorksheet('Emissions Breakdown');
  breakdownSheet.columns = [
    { header: 'Activity Type', key: 'activity_type', width: 30 },
    { header: 'Total Emissions (MT CO2e)', key: 'total_emissions', width: 25 },
    { header: 'Activity Count', key: 'activity_count', width: 15 },
    { header: 'Percentage', key: 'percentage', width: 15 }
  ];

  emissionsQuery.rows.forEach(row => {
    breakdownSheet.addRow({
      activity_type: row.activity_type,
      total_emissions: parseFloat(row.total_emissions).toFixed(2),
      activity_count: row.activity_count,
      percentage: `${(parseFloat(row.total_emissions) / totalEmissions * 100).toFixed(1)}%`
    });
  });

  breakdownSheet.getRow(1).font = { bold: true };
  breakdownSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF70AD47' }
  };

  // Sheet 3: Detailed Calculations
  const detailsQuery = await pool.query(
    `SELECT 
       cr.id,
       cr.activity_type,
       cr.co2e_metric_tons as total_emissions,
       (cr.co2_kg / 1000.0) as co2,
       (cr.ch4_g / 1000000.0) as ch4,
       (cr.n2o_g / 1000000.0) as n2o,
       cr.calculation_metadata,
       cr.created_at as calculated_at,
       u.email as calculated_by
     FROM emission_calculations cr
     LEFT JOIN users u ON cr.calculated_by::text = u.id::text
     WHERE cr.reporting_period_id = $1
     ORDER BY cr.created_at DESC`,
    [periodId]
  );

  const detailsSheet = workbook.addWorksheet('Detailed Calculations');
  // Dynamic columns based on metadata?
  // We'll add standard detailed columns and fill them if data exists
  detailsSheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Activity Type', key: 'activity_type', width: 25 },
    { header: 'Total Emissions (MT CO2e)', key: 'total_emissions', width: 25 },
    { header: 'CO2 (MT)', key: 'co2', width: 15 },
    { header: 'CH4 (MT)', key: 'ch4', width: 15 },
    { header: 'N2O (MT)', key: 'n2o', width: 15 },
    { header: 'Standard', key: 'standard', width: 15 },
    { header: 'Factor Version', key: 'factor_version', width: 20 },
    { header: 'Location Based (MT)', key: 'loc_mt', width: 15 },
    { header: 'Market Based (MT)', key: 'mkt_mt', width: 15 },
    { header: 'Calculated At', key: 'calculated_at', width: 20 },
    { header: 'Calculated By', key: 'calculated_by', width: 30 }
  ];

  detailsQuery.rows.forEach(row => {
    // Parse metadata safely
    const meta = row.calculation_metadata || {};
    
    // Add row with parsed metadata
    detailsSheet.addRow({
        ...row,
        standard: meta.standard || 'GHG Protocol',
        factor_version: meta.factorVersion || 'SIMPLIFIED_2024',
        loc_mt: meta.location_based?.total_co2e_mt || row.total_emissions,
        mkt_mt: meta.market_based?.total_co2e_mt || row.total_emissions
    });
  });

  detailsSheet.getRow(1).font = { bold: true };
  detailsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFC000' }
  };

  // Save workbook
  await workbook.xlsx.writeFile(exportPath);
  return exportPath;
}

/**
 * Clean up old export files
 * @param {string} directory - Directory containing export files
 * @param {number} maxAgeHours - Maximum age in hours before deletion
 */
export async function cleanupOldExports(directory, maxAgeHours = 24) {
  const files = fs.readdirSync(directory);
  const now = Date.now();
  const maxAge = maxAgeHours * 60 * 60 * 1000;

  for (const file of files) {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtimeMs;

    if (age > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`[ExportService] Deleted old export: ${file}`);
    }
  }
}

/** * Get RGB color for traffic light score (for PDFKit)
 * @param {string} score - 'green', 'yellow', or 'red'
 * @returns {string} RGB color string
 */
function getTrafficLightRGB(score) {
  switch (score) {
    case 'green':
      return '#10b981'; // Emerald green
    case 'yellow':
      return '#f59e0b'; // Amber yellow
    case 'red':
      return '#ef4444'; // Red
    default:
      return '#6b7280'; // Gray
  }
}

/** * Get PDF color for traffic light score
 * @param {string} score - 'green', 'yellow', or 'red'
 * @returns {string} Hex color code
 */
function getTrafficLightColor(score) {
  switch (score) {
    case 'green':
      return '#28a745';
    case 'yellow':
      return '#ffc107';
    case 'red':
      return '#dc3545';
    default:
      return '#6c757d';
  }
}

export default {
  generatePDFReport,
  generateCSVExport,
  generateExcelExport,
  cleanupOldExports
};
