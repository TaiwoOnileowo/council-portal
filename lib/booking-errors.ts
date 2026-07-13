export class RouteFullyBookedError extends Error {
  constructor() {
    super("This departure time is fully booked.");
    this.name = "RouteFullyBookedError";
  }
}
