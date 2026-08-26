declare module "../dist/server/server.js" {
  interface EdgeHandler {
    fetch(request: Request, env: unknown, ctx: unknown): Response | Promise<Response>;
  }
  const handler: EdgeHandler;
  export default handler;
}
