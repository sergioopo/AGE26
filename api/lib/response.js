export function send(response, status, data) {
  response.status(status).json(data);
}
