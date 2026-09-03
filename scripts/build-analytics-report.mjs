#!/usr/bin/env node

import ExcelJS from "exceljs";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "reports", "ABC-Tutoring-Analytics-Report.xlsx");

const tutors = [
  ["elena-torres", "Elena Torres", "Math", "Grades 3-8", 45],
  ["marcus-reed", "Marcus Reed", "Math", "Grades 6-12", 52],
  ["maya-chen", "Maya Chen", "Math", "Grades 6-12", 55],
  ["arjun-patel", "Arjun Patel", "Science", "Grades 6-12", 50],
  ["claire-bennett", "Claire Bennett", "Reading", "Grades K-6", 40],
  ["noah-williams", "Noah Williams", "Math", "Grades K-5", 42],
];

const scenarios = [
  "bounce",
  "tutor_view",
  "tutor_view",
  "availability_abandon",
  "availability_abandon",
  "details_abandon",
  "completed_booking",
  "completed_booking",
];
const sources = ["direct", "google", "facebook", "newsletter"];

const colors = {
  navy: "FF183B56",
  blue: "FF3178C6",
  paleBlue: "FFEAF4FB",
  green: "FF3A8D73",
  paleGreen: "FFE8F5EF",
  gold: "FFE6A84A",
  paleGold: "FFFFF4D8",
  coral: "FFE97863",
  paleCoral: "FFFFECE8",
  gray: "FF64748B",
  paleGray: "FFF1F5F9",
  white: "FFFFFFFF",
};

function addTitle(sheet, title, subtitle, lastColumn) {
  sheet.mergeCells(`A1:${lastColumn}1`);
  sheet.getCell("A1").value = title;
  sheet.getCell("A1").font = { size: 20, bold: true, color: { argb: colors.white } };
  sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.navy } };
  sheet.getCell("A1").alignment = { vertical: "middle" };
  sheet.getRow(1).height = 34;
  sheet.mergeCells(`A2:${lastColumn}2`);
  sheet.getCell("A2").value = subtitle;
  sheet.getCell("A2").font = { italic: true, color: { argb: colors.gray } };
  sheet.getCell("A2").alignment = { wrapText: true, vertical: "middle" };
  sheet.getRow(2).height = 32;
}

function styleHeader(row) {
  row.font = { bold: true, color: { argb: colors.white } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.blue } };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 28;
}

function addBorders(sheet, range) {
  const [start, end] = range.split(":");
  const startCell = sheet.getCell(start);
  const endCell = sheet.getCell(end);
  for (let row = startCell.row; row <= endCell.row; row += 1) {
    for (let col = startCell.col; col <= endCell.col; col += 1) {
      sheet.getCell(row, col).border = {
        top: { style: "thin", color: { argb: "FFD7E0E8" } },
        left: { style: "thin", color: { argb: "FFD7E0E8" } },
        bottom: { style: "thin", color: { argb: "FFD7E0E8" } },
        right: { style: "thin", color: { argb: "FFD7E0E8" } },
      };
    }
  }
}

function buildIllustrativeEvents() {
  const rows = [];
  const baseTime = Date.UTC(2026, 8, 3, 12, 0, 0);
  const runId = "illustrative_demo_25";

  function addEvent(visitor, eventName, context = {}) {
    rows.push({
      eventTime: new Date(baseTime + visitor * 60_000 + rows.length * 1000),
      eventName,
      visitorId: `demo-visitor-${String(visitor + 1).padStart(2, "0")}`,
      tutorId: context.tutorId || "",
      tutorName: context.tutorName || "",
      subject: context.subject || "",
      sessionFormat: context.sessionFormat || "",
      bookingStage: context.bookingStage || "",
      source: sources[visitor % sources.length],
      synthetic: true,
      runId,
      dataStatus: "Illustrative sample—not a PostHog export",
    });
  }

  for (let visitor = 0; visitor < 25; visitor += 1) {
    const scenario = scenarios[visitor % scenarios.length];
    const tutor = tutors[visitor % tutors.length];
    const context = {
      tutorId: tutor[0],
      tutorName: tutor[1],
      subject: tutor[2],
      sessionFormat: visitor % 2 === 0 ? "Online" : "In person",
    };
    addEvent(visitor, "simulation_session_started");
    addEvent(visitor, "$pageview");
    if (scenario === "bounce") continue;
    addEvent(visitor, "tutor_list_filtered", context);
    addEvent(visitor, "subject_interest", context);
    if (scenario === "tutor_view") {
      addEvent(visitor, "tutor_profile_viewed", context);
      continue;
    }
    addEvent(visitor, "tutor_availability_viewed", { ...context, bookingStage: "availability" });
    if (scenario === "availability_abandon") {
      addEvent(visitor, "booking_abandoned", { ...context, bookingStage: "availability" });
      continue;
    }
    addEvent(visitor, "booking_details_viewed", { ...context, bookingStage: "details" });
    if (scenario === "details_abandon") {
      addEvent(visitor, "booking_abandoned", { ...context, bookingStage: "details" });
      continue;
    }
    addEvent(visitor, "booking_completed", { ...context, bookingStage: "complete" });
  }
  return rows;
}

const workbook = new ExcelJS.Workbook();
workbook.creator = "ABC Tutoring";
workbook.subject = "Shareable website and booking analytics report";
workbook.title = "ABC Tutoring Analytics Report";
workbook.company = "ABC Tutoring";
workbook.created = new Date();
workbook.modified = new Date();
workbook.calcProperties.fullCalcOnLoad = true;

const readMe = workbook.addWorksheet("Start Here", {
  views: [{ state: "frozen", ySplit: 3, showGridLines: false }],
});
addTitle(
  readMe,
  "ABC Tutoring — Analytics Report",
  "A customer-friendly workbook for website interest, tutor demand, and booking conversion.",
  "F",
);
readMe.columns = [
  { width: 23 }, { width: 29 }, { width: 29 }, { width: 29 }, { width: 20 }, { width: 20 },
];
readMe.getCell("A4").value = "IMPORTANT DATA NOTE";
readMe.getCell("A4").font = { bold: true, color: { argb: colors.navy } };
readMe.getCell("A4").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.paleGold } };
readMe.mergeCells("A5:F6");
readMe.getCell("A5").value =
  "The Event Data sheet currently contains 25 clearly labeled illustrative synthetic visitors so the report is useful immediately. It is not real customer activity. Replace those rows with a PostHog CSV export before reporting real performance.";
readMe.getCell("A5").alignment = { wrapText: true, vertical: "middle" };
readMe.getCell("A5").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.paleGold } };
readMe.getRow(5).height = 28;
readMe.getRow(6).height = 28;

const instructions = [
  ["1", "Open the report", "Use KPI Summary for the high-level story and the detail sheets for tutor, subject, funnel, and source performance."],
  ["2", "Export PostHog data", "In PostHog, export the tracked events for the reporting period as CSV."],
  ["3", "Paste into Event Data", "Keep the same column order. Never add parent email, student name, or other personal information."],
  ["4", "Separate demo traffic", "Use Synthetic traffic = TRUE for demonstrations and FALSE for real reporting."],
  ["5", "Share safely", "Share KPI and detail tabs with Dana. Retain the data-status note and date range so the numbers cannot be mistaken for live results."],
];
readMe.getRow(8).values = ["Step", "Action", "What to do"];
styleHeader(readMe.getRow(8));
instructions.forEach((row) => readMe.addRow(row));
readMe.getColumn(3).width = 76;
for (let row = 9; row <= 13; row += 1) readMe.getRow(row).height = 38;
addBorders(readMe, "A8:C13");

readMe.getRow(15).values = ["Sharing rule", "Recommendation"];
styleHeader(readMe.getRow(15));
[
  ["Customer dashboard", "Filter Synthetic traffic to FALSE."],
  ["Demo dashboard", "Filter Synthetic traffic to TRUE."],
  ["One simulation", "Filter Simulation run ID to the ID printed by the simulator."],
  ["Privacy", "No parent or student personally identifiable information is captured in this workbook."],
].forEach((row) => readMe.addRow(row));
addBorders(readMe, "A15:B19");

const eventData = workbook.addWorksheet("Event Data", {
  views: [{ state: "frozen", ySplit: 1, showGridLines: false }],
  autoFilter: "A1:L1",
});
eventData.columns = [
  { header: "Event time", key: "eventTime", width: 21 },
  { header: "Event name", key: "eventName", width: 29 },
  { header: "Visitor/session ID", key: "visitorId", width: 22 },
  { header: "Tutor ID", key: "tutorId", width: 20 },
  { header: "Tutor name", key: "tutorName", width: 21 },
  { header: "Subject", key: "subject", width: 14 },
  { header: "Session format", key: "sessionFormat", width: 17 },
  { header: "Booking stage", key: "bookingStage", width: 17 },
  { header: "Traffic source", key: "source", width: 17 },
  { header: "Synthetic traffic", key: "synthetic", width: 18 },
  { header: "Simulation run ID", key: "runId", width: 25 },
  { header: "Data status", key: "dataStatus", width: 38 },
];
styleHeader(eventData.getRow(1));
buildIllustrativeEvents().forEach((event) => eventData.addRow(event));
eventData.getColumn(1).numFmt = "yyyy-mm-dd hh:mm:ss";
eventData.addTable({
  name: "EventDataTable",
  ref: "A1",
  headerRow: true,
  style: { theme: "TableStyleMedium2", showRowStripes: true },
  columns: eventData.columns.map((column) => ({ name: column.header })),
  rows: eventData.getRows(2, eventData.rowCount - 1).map((row) => row.values.slice(1)),
});

const summary = workbook.addWorksheet("KPI Summary", {
  views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
});
addTitle(
  summary,
  "ABC Tutoring — KPI Summary",
  "Illustrative synthetic data is shown separately from real visitor data. Update Event Data to refresh formulas.",
  "E",
);
summary.columns = [
  { width: 31 }, { width: 17 }, { width: 17 }, { width: 17 }, { width: 42 },
];
summary.getRow(4).values = ["Metric", "Real visitors", "Synthetic demo", "Combined", "Meaning"];
styleHeader(summary.getRow(4));
const kpis = [
  ["Website visits", "$pageview", "Landing-page visits"],
  ["Tutor profiles viewed", "tutor_profile_viewed", "Direct tutor-profile interest"],
  ["Availability viewed", "tutor_availability_viewed", "Visitors who opened a tutor's schedule"],
  ["Booking details reached", "booking_details_viewed", "Visitors who progressed to the information form"],
  ["Bookings completed", "booking_completed", "Prototype booking confirmations"],
  ["Bookings abandoned", "booking_abandoned", "Booking flows closed before completion"],
];
kpis.forEach(([label, eventName, meaning], index) => {
  const row = index + 5;
  summary.getCell(row, 1).value = label;
  summary.getCell(row, 2).value = { formula: `COUNTIFS('Event Data'!$B$2:$B$10000,"${eventName}",'Event Data'!$J$2:$J$10000,FALSE)` };
  summary.getCell(row, 3).value = { formula: `COUNTIFS('Event Data'!$B$2:$B$10000,"${eventName}",'Event Data'!$J$2:$J$10000,TRUE)` };
  summary.getCell(row, 4).value = { formula: `B${row}+C${row}` };
  summary.getCell(row, 5).value = meaning;
});
summary.getCell("A12").value = "Visit-to-booking conversion";
summary.getCell("B12").value = { formula: "IFERROR(B9/B5,0)" };
summary.getCell("C12").value = { formula: "IFERROR(C9/C5,0)" };
summary.getCell("D12").value = { formula: "IFERROR(D9/D5,0)" };
summary.getCell("E12").value = "Completed bookings divided by website visits";
for (const cell of ["B12", "C12", "D12"]) summary.getCell(cell).numFmt = "0.0%";
summary.getRow(12).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.paleGreen } };
addBorders(summary, "A4:E12");

const funnel = workbook.addWorksheet("Booking Funnel", {
  views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
});
addTitle(funnel, "Booking Funnel", "Use the Real column for customer reporting and Synthetic for demonstrations.", "F");
funnel.columns = [
  { width: 8 }, { width: 29 }, { width: 28 }, { width: 15 }, { width: 15 }, { width: 23 },
];
funnel.getRow(4).values = ["Step", "Stage", "PostHog event", "Real", "Synthetic", "Synthetic step rate"];
styleHeader(funnel.getRow(4));
const stages = [
  [1, "Website visit", "$pageview"],
  [2, "Subject interest", "subject_interest"],
  [3, "Tutor profile viewed", "tutor_profile_viewed"],
  [4, "Availability viewed", "tutor_availability_viewed"],
  [5, "Booking details reached", "booking_details_viewed"],
  [6, "Booking completed", "booking_completed"],
];
stages.forEach(([step, label, eventName], index) => {
  const row = index + 5;
  funnel.getRow(row).values = [step, label, eventName];
  funnel.getCell(row, 4).value = { formula: `COUNTIFS('Event Data'!$B$2:$B$10000,C${row},'Event Data'!$J$2:$J$10000,FALSE)` };
  funnel.getCell(row, 5).value = { formula: `COUNTIFS('Event Data'!$B$2:$B$10000,C${row},'Event Data'!$J$2:$J$10000,TRUE)` };
  funnel.getCell(row, 6).value = index === 0 ? 1 : { formula: `IFERROR(E${row}/E${row - 1},0)` };
  funnel.getCell(row, 6).numFmt = "0.0%";
});
addBorders(funnel, "A4:F10");

const tutorPerformance = workbook.addWorksheet("Tutor Performance", {
  views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
});
addTitle(tutorPerformance, "Tutor Performance", "Counts below use synthetic demonstration events only until real PostHog data is imported.", "G");
tutorPerformance.columns = [
  { width: 20 }, { width: 22 }, { width: 15 }, { width: 17 }, { width: 17 }, { width: 17 }, { width: 19 },
];
tutorPerformance.getRow(4).values = ["Tutor ID", "Tutor", "Subject", "Profile views", "Availability views", "Bookings", "Booking rate"];
styleHeader(tutorPerformance.getRow(4));
tutors.forEach((tutor, index) => {
  const row = index + 5;
  tutorPerformance.getRow(row).values = [tutor[0], tutor[1], tutor[2]];
  tutorPerformance.getCell(row, 4).value = { formula: `COUNTIFS('Event Data'!$B$2:$B$10000,"tutor_profile_viewed",'Event Data'!$D$2:$D$10000,A${row},'Event Data'!$J$2:$J$10000,TRUE)` };
  tutorPerformance.getCell(row, 5).value = { formula: `COUNTIFS('Event Data'!$B$2:$B$10000,"tutor_availability_viewed",'Event Data'!$D$2:$D$10000,A${row},'Event Data'!$J$2:$J$10000,TRUE)` };
  tutorPerformance.getCell(row, 6).value = { formula: `COUNTIFS('Event Data'!$B$2:$B$10000,"booking_completed",'Event Data'!$D$2:$D$10000,A${row},'Event Data'!$J$2:$J$10000,TRUE)` };
  tutorPerformance.getCell(row, 7).value = { formula: `IFERROR(F${row}/(D${row}+E${row}),0)` };
  tutorPerformance.getCell(row, 7).numFmt = "0.0%";
});
addBorders(tutorPerformance, "A4:G10");

const subjectPerformance = workbook.addWorksheet("Subject Interest", {
  views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
});
addTitle(subjectPerformance, "Subject Interest", "Shows what families browse and which subjects lead to bookings.", "E");
subjectPerformance.columns = [
  { width: 20 }, { width: 22 }, { width: 22 }, { width: 20 }, { width: 42 },
];
subjectPerformance.getRow(4).values = ["Subject", "Interest events", "Availability views", "Bookings", "Interpretation"];
styleHeader(subjectPerformance.getRow(4));
["Math", "Science", "Reading"].forEach((subject, index) => {
  const row = index + 5;
  subjectPerformance.getCell(row, 1).value = subject;
  subjectPerformance.getCell(row, 2).value = { formula: `COUNTIFS('Event Data'!$B$2:$B$10000,"subject_interest",'Event Data'!$F$2:$F$10000,A${row},'Event Data'!$J$2:$J$10000,TRUE)` };
  subjectPerformance.getCell(row, 3).value = { formula: `COUNTIFS('Event Data'!$B$2:$B$10000,"tutor_availability_viewed",'Event Data'!$F$2:$F$10000,A${row},'Event Data'!$J$2:$J$10000,TRUE)` };
  subjectPerformance.getCell(row, 4).value = { formula: `COUNTIFS('Event Data'!$B$2:$B$10000,"booking_completed",'Event Data'!$F$2:$F$10000,A${row},'Event Data'!$J$2:$J$10000,TRUE)` };
  subjectPerformance.getCell(row, 5).value = "Compare interest with bookings to identify unmet demand.";
});
addBorders(subjectPerformance, "A4:E7");

const sourcesSheet = workbook.addWorksheet("Traffic Sources", {
  views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
});
addTitle(sourcesSheet, "Traffic Sources", "UTM source data helps Dana understand which outreach channels produce bookings.", "E");
sourcesSheet.columns = [
  { width: 20 }, { width: 18 }, { width: 18 }, { width: 19 }, { width: 48 },
];
sourcesSheet.getRow(4).values = ["Source", "Visits", "Bookings", "Conversion rate", "Recommended use"];
styleHeader(sourcesSheet.getRow(4));
sources.forEach((source, index) => {
  const row = index + 5;
  sourcesSheet.getCell(row, 1).value = source;
  sourcesSheet.getCell(row, 2).value = { formula: `COUNTIFS('Event Data'!$B$2:$B$10000,"$pageview",'Event Data'!$I$2:$I$10000,A${row},'Event Data'!$J$2:$J$10000,TRUE)` };
  sourcesSheet.getCell(row, 3).value = { formula: `COUNTIFS('Event Data'!$B$2:$B$10000,"booking_completed",'Event Data'!$I$2:$I$10000,A${row},'Event Data'!$J$2:$J$10000,TRUE)` };
  sourcesSheet.getCell(row, 4).value = { formula: `IFERROR(C${row}/B${row},0)` };
  sourcesSheet.getCell(row, 4).numFmt = "0.0%";
  sourcesSheet.getCell(row, 5).value = "Compare volume and conversion before changing marketing effort.";
});
addBorders(sourcesSheet, "A4:E8");

const dictionary = workbook.addWorksheet("Data Dictionary", {
  views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
});
addTitle(dictionary, "PostHog Data Dictionary", "Definitions make the workbook understandable when shared outside the development team.", "D");
dictionary.columns = [{ width: 31 }, { width: 23 }, { width: 66 }, { width: 28 }];
dictionary.getRow(4).values = ["Event/property", "Type", "Definition", "Used for"];
styleHeader(dictionary.getRow(4));
const definitions = [
  ["$pageview", "Event", "A visit to the ABC Tutoring page.", "Traffic and conversion denominator"],
  ["subject_interest", "Event", "A visitor selected a subject card.", "Subject demand"],
  ["tutor_profile_viewed", "Event", "A visitor opened more information about a tutor.", "Tutor popularity"],
  ["tutor_availability_viewed", "Event", "A visitor opened the tutor's scheduling flow.", "High-intent tutor interest"],
  ["booking_details_viewed", "Event", "A visitor continued from time selection to booking details.", "Funnel progression"],
  ["booking_completed", "Event", "The prototype showed a booking confirmation.", "Booking conversion"],
  ["booking_abandoned", "Event", "The booking modal closed before completion.", "Funnel abandonment"],
  ["contact_clicked", "Event", "A phone or email contact link was selected.", "Direct contact interest"],
  ["tutor_id / tutor_name", "Property", "Stable tutor identifier and readable tutor name.", "Tutor breakdown"],
  ["subject", "Property", "Math, Science, or Reading.", "Subject breakdown"],
  ["session_format", "Property", "Online or in person.", "Service-format demand"],
  ["synthetic_traffic", "Property", "TRUE for automated demonstrations; FALSE for real visitors.", "Data-quality separation"],
  ["simulation_run_id", "Property", "Unique identifier printed for each simulator execution.", "Single-run filtering"],
  ["Traffic source", "Property", "UTM source or direct traffic.", "Marketing attribution"],
];
definitions.forEach((row) => dictionary.addRow(row));
for (let row = 5; row <= dictionary.rowCount; row += 1) dictionary.getRow(row).height = 34;
addBorders(dictionary, `A4:D${dictionary.rowCount}`);

const directory = workbook.addWorksheet("Tutor Directory", {
  views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
});
addTitle(directory, "Tutor Directory", "Reference data used to interpret tutor IDs in PostHog exports.", "E");
directory.columns = [
  { width: 20 }, { width: 22 }, { width: 16 }, { width: 18 }, { width: 18 },
];
directory.getRow(4).values = ["Tutor ID", "Tutor", "Subject", "Grade levels", "Hourly rate"];
styleHeader(directory.getRow(4));
tutors.forEach((tutor) => directory.addRow(tutor));
directory.getColumn(5).numFmt = "$0.00";
addBorders(directory, "A4:E10");

for (const sheet of workbook.worksheets) {
  sheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
  };
  sheet.headerFooter.oddFooter = "ABC Tutoring • &D • Page &P of &N";
}

await mkdir(dirname(outputPath), { recursive: true });
await workbook.xlsx.writeFile(outputPath);
console.log(`Created ${outputPath}`);
