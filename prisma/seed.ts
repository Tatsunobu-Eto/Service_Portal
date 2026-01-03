import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding departments...");

  // 既存の部署を削除
  await prisma.department.deleteMany();

  const businessUnits = ["営業本部", "技術本部", "管理本部", "製造本部", "海外事業本部"];
  
  for (const buName of businessUnits) {
    const bu = await prisma.department.create({
      data: { name: buName },
    });

    // 各本部に3つの部を作成
    for (let i = 1; i <= 3; i++) {
      const deptName = `${buName} 第${i}部`;
      const dept = await prisma.department.create({
        data: { 
          name: deptName,
          parentId: bu.id 
        },
      });

      // 各部にさらに複数の課を作成 (合計100以上にするため調整)
      // 5本部 * 3部 * 7課 = 105部署
      for (let j = 1; j <= 7; j++) {
        const sectionName = `${deptName} 第${j}課`;
        await prisma.department.create({
          data: {
            name: sectionName,
            parentId: dept.id
          }
        });
      }
    }
  }

  console.log("Departments seeded successfully.");

  // サービスとロールの初期データ（未登録の場合のみ）
  const services = ["在庫管理システム", "人事評価システム", "経費精算システム"];
  for (const name of services) {
    await prisma.service.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name}の利用権限` },
    });
  }

  const roles = ["一般", "管理者", "システム管理者"];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
