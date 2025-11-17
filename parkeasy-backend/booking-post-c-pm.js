// Parse the response body as JSON
const responseBodyJson = pm.response.json();

// Check that the status code is 201
pm.test('Status code is 201', function () {
  pm.response.to.have.status(201);
});

// Check that the response has a booking property
pm.test('Response has booking property', function () {
  pm.expect(responseBodyJson).to.have.property('booking');
});

// Check that the booking has required fields
pm.test('Booking has required fields', function () {
  const booking = responseBodyJson.booking;
  pm.expect(booking).to.have.property('_id');
  pm.expect(booking).to.have.property('userId');
  pm.expect(booking).to.have.property('parkingLotId');
  pm.expect(booking).to.have.property('vehicleType');
  pm.expect(booking).to.have.property('vehicleNumber');
  pm.expect(booking).to.have.property('startTime');
  pm.expect(booking).to.have.property('endTime');
  pm.expect(booking).to.have.property('duration');
  pm.expect(booking).to.have.property('totalPrice');
  pm.expect(booking).to.have.property('status', 'active');
});

// Check that the response time is less than 2000ms
pm.test('Response time is less than 2000ms', function () {
  pm.expect(pm.response.responseTime).to.be.below(2000);
});

// Set the booking ID as an environment variable for future requests
pm.test('Set booking ID environment variable', function () {
  const booking = responseBodyJson.booking;
  pm.environment.set('bookingId', booking._id);
});