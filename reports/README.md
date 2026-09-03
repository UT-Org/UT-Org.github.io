# ABC Tutoring analytics report

`ABC-Tutoring-Analytics-Report.xlsx` is a shareable Excel workbook containing:

- a customer-facing KPI summary;
- a booking funnel;
- tutor, subject, and traffic-source breakdowns;
- an event-data worksheet suitable for PostHog exports;
- a data dictionary; and
- the tutor directory.

The bundled rows are clearly labeled illustrative synthetic data. They must not
be presented as real customer activity. Generate a fresh workbook with:

```powershell
npm.cmd run report:build
```

Before reporting live performance, replace the illustrative rows on **Event
Data** with a PostHog export and retain the `Synthetic traffic` field so demo
traffic stays separate from real visitors.
