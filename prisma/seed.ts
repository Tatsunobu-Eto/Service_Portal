import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding departments (massive scale)...");

  // 既存のデータをクリーンアップ（依存関係順）
  await prisma.permissionRequest.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.department.deleteMany();

  const businessUnits = [
    "営業本部", "技術本部", "管理本部", "製造本部", "海外事業本部", 
    "R&D本部", "マーケティング本部", "カスタマーサクセス本部", "DX推進本部", "法務・コンプライアンス本部"
  ];
  
  let totalCount = 0;

  for (const buName of businessUnits) {
    const bu = await prisma.department.create({
      data: { name: buName },
    });
    totalCount++;

    // 各本部に5つの部を作成
    for (let i = 1; i <= 5; i++) {
      const deptName = `${buName} 第${i}部`;
      const dept = await prisma.department.create({
        data: { 
          name: deptName,
          parentId: bu.id 
        },
      });
      totalCount++;

      // 各部にさらに10の課を作成
      for (let j = 1; j <= 10; j++) {
        const sectionName = `${deptName} 第${j}課`;
        const section = await prisma.department.create({
          data: {
            name: sectionName,
            parentId: dept.id
          }
        });
        totalCount++;

        // 各課にさらに2つのチームを作成
        // 10本部 * 5部 * 10課 * 2チーム = 1000チーム
        // + 10本部 + 50部 + 500課 = 合計1560部署
        for (let k = 1; k <= 2; k++) {
          const teamName = `${sectionName} チーム${String.fromCharCode(64 + k)}`;
          await prisma.department.create({
            data: {
              name: teamName,
              parentId: section.id
            }
          });
          totalCount++;
        }
      }
    }
  }

  console.log(`Departments seeded successfully. Total: ${totalCount} departments.`);

  // サービスとロールの初期データ
  const services = ["在庫管理システム", "人事評価システム", "経費精算システム", "顧客管理CRM", "社内Wiki", "勤怠管理システム"];
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
