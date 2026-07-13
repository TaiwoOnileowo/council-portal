import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import type { ExportFilters } from "@/modules/transport/transport.types";

type BookingRow = {
  id: string;
  reference: string;
  passengerName: string;
  passengerPhone: string;
  parentsPhone: string;
  hall: string;
  roomNumber: string;
  routeName: string;
  direction: "LEAVING" | "RETURNING";
  fare: number;
  commission: number;
  destinationAddress: string | null;
  stopName: string | null;
  departureAt: string | null;
  createdAt: string;
};

type Props = {
  businessName: string;
  bookings: BookingRow[];
  filters: ExportFilters;
  generatedAt: string;
  logoPath: string;
};

const ACCENT = "#6B1E3D";
const ACCENT_BG = "#faf0f4";
const MUTED = "#9a9490";
const TEXT = "#1a1714";
const TEXT2 = "#4a4540";
const BORDER = "#e2ddd8";
const SURFACE = "#ffffff";
const BG = "#f7f5f0";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: TEXT,
    paddingHorizontal: 36,
    paddingTop: 32,
    paddingBottom: 44,
    backgroundColor: SURFACE,
  },
  watermark: {
    position: "absolute",
    top: 197,
    left: 345,
    opacity: 0.05,
    width: 150,
    height: 150,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  accentBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: ACCENT,
    marginRight: 8,
    alignSelf: "stretch",
  },
  businessName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    color: TEXT,
    marginBottom: 2,
  },
  reportTitle: {
    fontSize: 10,
    color: TEXT2,
  },
  metaRight: {
    alignItems: "flex-end",
  },
  metaLabel: {
    fontSize: 7,
    color: MUTED,
    marginBottom: 1,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 8,
    color: TEXT2,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 14,
  },
  filterChip: {
    backgroundColor: ACCENT_BG,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 7.5,
    color: ACCENT,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  statBoxAccent: {
    backgroundColor: ACCENT_BG,
    borderColor: "#e8c0cf",
  },
  statValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: TEXT,
    marginBottom: 2,
  },
  statValueAccent: {
    color: ACCENT,
  },
  statLabel: {
    fontSize: 7,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  table: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableRowAlt: {
    backgroundColor: BG,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  colHeader: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cell: {
    fontSize: 8,
    color: TEXT,
  },
  cellSub: {
    fontSize: 7,
    color: MUTED,
    marginTop: 1.5,
  },
  colPassenger: { width: 128 },
  colPhone: { width: 90 },
  colRoute: { width: 118 },
  colDirection: { width: 60 },
  colDeparture: { width: 95 },
  colBooked: { width: 72 },
  colHall: { width: 86 },
  colFare: { width: 60, alignItems: "flex-end" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: MUTED,
  },
  footerAccent: {
    fontSize: 7,
    color: ACCENT,
    fontFamily: "Helvetica-Bold",
  },
});

function buildFilterChips(filters: ExportFilters): string[] {
  const chips: string[] = [];
  if (filters.direction !== "all")
    chips.push(filters.direction === "LEAVING" ? "Leaving" : "Returning");
  if (filters.route !== "all") chips.push(`Route: ${filters.route}`);
  if (filters.bookingDateFrom || filters.bookingDateTo) {
    const from = filters.bookingDateFrom
      ? format(new Date(filters.bookingDateFrom), "MMM d, yyyy")
      : "—";
    const to = filters.bookingDateTo
      ? format(new Date(filters.bookingDateTo), "MMM d, yyyy")
      : "—";
    chips.push(`Booked: ${from} – ${to}`);
  }
  if (filters.departureDateFrom || filters.departureDateTo) {
    const from = filters.departureDateFrom
      ? format(new Date(filters.departureDateFrom), "MMM d, yyyy")
      : "—";
    const to = filters.departureDateTo
      ? format(new Date(filters.departureDateTo), "MMM d, yyyy")
      : "—";
    chips.push(`Departure: ${from} – ${to}`);
  }
  return chips;
}

export function BookingReportDocument({
  businessName,
  bookings,
  filters,
  generatedAt,
  logoPath,
}: Props) {
  const chips = buildFilterChips(filters);
  const totalFare = bookings.reduce((sum, b) => sum + b.fare, 0);
  const totalCommission = bookings.reduce((sum, b) => sum + b.commission, 0);
  const netRevenue = totalFare - totalCommission;

  return (
    <Document title={`${businessName} — Booking Report`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Image src={logoPath} style={styles.watermark} fixed />

        <View style={styles.header} fixed>
          <View style={{ flexDirection: "row", alignItems: "stretch" }}>
            <View>
              <Text style={styles.businessName}>{businessName}</Text>
              <Text style={styles.reportTitle}>Booking Report</Text>
            </View>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaLabel}>Generated</Text>
            <Text style={styles.metaValue}>
              {format(new Date(generatedAt), "d MMM yyyy, h:mm a")}
            </Text>
          </View>
        </View>

        {chips.length > 0 && (
          <View style={styles.filterRow}>
            {chips.map((chip) => (
              <Text key={chip} style={styles.filterChip}>
                {chip}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{bookings.length}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              NGN {totalFare.toLocaleString("en-NG")}
            </Text>
            <Text style={styles.statLabel}>Gross Revenue</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              NGN {totalCommission.toLocaleString("en-NG")}
            </Text>
            <Text style={styles.statLabel}>Platform Commission</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxAccent]}>
            <Text style={[styles.statValue, styles.statValueAccent]}>
              NGN {netRevenue.toLocaleString("en-NG")}
            </Text>
            <Text style={styles.statLabel}>Net Revenue</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow} fixed>
            <Text style={[styles.colHeader, styles.colPassenger]}>
              Passenger
            </Text>
            <Text style={[styles.colHeader, styles.colPhone]}>Phone</Text>
            <Text style={[styles.colHeader, styles.colRoute]}>Route</Text>
            <Text style={[styles.colHeader, styles.colDirection]}>
              Direction
            </Text>
            <Text style={[styles.colHeader, styles.colDeparture]}>
              Departure
            </Text>
            <Text style={[styles.colHeader, styles.colBooked]}>Booked On</Text>
            <Text style={[styles.colHeader, styles.colHall]}>Hall / Room</Text>
            <Text style={[styles.colHeader, styles.colFare]}>Fare</Text>
          </View>

          {bookings.map((b, i) => (
            <View
              key={b.id}
              style={[
                styles.tableRow,
                i % 2 !== 0 ? styles.tableRowAlt : {},
                i === bookings.length - 1 ? styles.tableRowLast : {},
              ]}
              wrap={false}
            >
              <View style={styles.colPassenger}>
                <Text style={styles.cell}>{b.passengerName}</Text>
                <Text style={styles.cellSub}>{b.reference}</Text>
              </View>
              <View style={styles.colPhone}>
                <Text style={styles.cell}>{b.passengerPhone}</Text>
                <Text style={styles.cellSub}>Guardian: {b.parentsPhone}</Text>
              </View>
              <View style={styles.colRoute}>
                <Text style={styles.cell}>{b.routeName}</Text>
                {b.stopName && (
                  <Text style={styles.cellSub}>Stop: {b.stopName}</Text>
                )}
                {b.destinationAddress && (
                  <Text style={styles.cellSub}>{b.destinationAddress}</Text>
                )}
              </View>
              <Text style={[styles.cell, styles.colDirection]}>
                {b.direction === "LEAVING" ? "Leaving" : "Returning"}
              </Text>
              <Text style={[styles.cell, styles.colDeparture]}>
                {b.departureAt
                  ? format(new Date(b.departureAt), "d MMM · h:mm a")
                  : "—"}
              </Text>
              <Text style={[styles.cell, styles.colBooked]}>
                {format(new Date(b.createdAt), "d MMM yyyy")}
              </Text>
              <Text style={[styles.cell, styles.colHall]}>
                {b.hall} / {b.roomNumber}
              </Text>
              <Text style={[styles.cell, styles.colFare]}>
                NGN {b.fare.toLocaleString("en-NG")}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerAccent}>
            Council Portal Covenant University
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
