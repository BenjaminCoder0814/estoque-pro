// Express 4 não encaminha promises rejeitadas para o middleware de erro:
// sem este wrapper, uma falha do Prisma vira unhandledRejection e o Node 20 derruba o processo.
export function ah(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
