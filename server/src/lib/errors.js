// The one error type routes throw. The error middleware turns it into the
// standard { error, fields } response.
export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
