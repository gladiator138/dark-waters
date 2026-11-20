# Data Preprocessing Log: CDM Datathon-2026, Theme 6.2

## Source 1: Middle East weekly conflict events (up to week of 27 Jun 2026)
149,825 rows, one per Week x Country x Province x Event type x Sub-event type.

| Check / step | Result |
|---|---|
| Duplicate keys | 0 |
| Non-positive Events or negative Fatalities | 0 |
| Missing values | Only Population_Exposure (30,965 rows, 20.7%). Left blank, not imputed; flagged in `Pop_Exposure_Missing` |
| Uneven coverage | Countries enter the data at different dates (Yemen Dec 2014, most Dec 2015, Syria Dec 2016). Trend analysis restricted to Jan 2017 onward (`Full_Coverage_Period`) |
| Partial final month | June 2026 data ends 27 Jun; flagged `Partial_Month` |
| Derived fields | Year, Month, Quarter, Sub_Region, Is_Maritime (Indian Ocean / Mediterranean events), Is_Violent, Is_Strike (air/drone + shelling/missile) |
| Monthly panel | Complete Country x Month grid Jan 2017 to Jun 2026, zero-filled (17 countries x 114 months = 1,938 rows) for trend and forecasting |
| Reconciliation | Panel totals equal source totals: 572,743 events and 453,217 fatalities (2017 onward) |

## Source 2: Sentinel-1 SAR vessel detections, 1 to 14 Mar 2026
107,257 detections across 2,836 radar scenes, global coverage despite the file name.

| Check / step | Result |
|---|---|
| Duplicates (scene + position) | 0 |
| Presence score | All between 0.70 and 1.00; no filtering needed |
| Timestamp | " UTC" text suffix removed and parsed to datetime; Date and Hour_UTC derived |
| Dark vessel definition | `Is_Dark` = radar detection with no matching AIS broadcast (category "unmatched", 42,455 rows) |
| Rejected AIS candidates | 13,566 dark rows carried a candidate MMSI with a match score of about 0. MMSI blanked; flagged `MMSI_Candidate_Rejected` |
| Fishing vs non-fishing | `Likely_Fishing` = fishing score of 0.5 or more. Dark vessels split into "likely fishing" (often small artisanal boats that aren't required to carry AIS) and "non-fishing" (the security-relevant group) |
| Size class | Length binned: <25 m, 25 to 100 m, 100 to 200 m, >200 m |
| Maritime zones | 13 approximate bounding boxes (chokepoints first, then seas, then remaining Indian Ocean; everything else is "Rest of World"). Boxes are approximations, not legal boundaries |
| Hotspot grid | 1 degree x 1 degree cells; `Reliable` = 20 or more detections, to avoid ranking cells on tiny samples |
| Flag state | MID (first 3 digits of a 9-digit MMSI) extracted for AIS-visible vessels |

## Caveats to state in the report
- SAR data covers only two weeks, so it describes where vessels go dark, not how that has changed over time.
- Zone boxes are approximate, and near-shore zones mix territorial waters with the open sea.
- A high dark share near India is mostly small fishing craft (only 3.5% of detections there are dark non-fishing vessels), so it isn't evidence of hostile activity on its own.
