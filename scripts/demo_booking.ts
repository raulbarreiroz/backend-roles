/**
 * Quick smoke against a running bookingd.
 * Usage: npm run demo   (server must be up)
 */
const base = process.env.BOOKING_URL || 'http://127.0.0.1:5200';

async function main() {
  const res = await fetch(`${base}/commands/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      flightId: 'IB-6401',
      seat: '12B',
      amountCents: 18600, // even → payment ok
      passenger: {
        fullName: 'Marta Demo',
        email: 'marta@example.com',
        documentId: 'Y998877',
      },
      bags: { pieces: 1, weightKg: 18 },
    }),
  });
  const booking = await res.json();
  console.log('booking:', booking);

  if (booking.bookingId) {
    await new Promise((r) => setTimeout(r, 50));
    const q = await fetch(`${base}/queries/bookings/${booking.bookingId}`);
    console.log('query:', await q.json());
  }
}

main().catch(console.error);
