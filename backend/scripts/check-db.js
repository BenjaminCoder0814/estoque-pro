import {PrismaClient} from "@prisma/client";
const p = new PrismaClient();
p.product.findMany({orderBy:{category:'asc'}}).then(r => {
  console.log(JSON.stringify(r, null, 2));
  return p.$disconnect();
}).catch(e => { console.error(e.message); p.$disconnect(); });
