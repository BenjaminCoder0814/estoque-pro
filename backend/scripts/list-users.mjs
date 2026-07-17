import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const u = await p.user.findMany({ select: { id:true, email:true, name:true, role:true, active:true }});
console.log(u);
await p.$disconnect();
