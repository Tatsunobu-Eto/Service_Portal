import { prisma } from "@/serverside/db/prisma";
import { DepartmentWithChildren } from "@/serverside/types";
import { Role, Service } from "@prisma/client";

/**
 * 組織・部署マスター管理サービス
 */

/**
 * 利用可能なすべてのサービスを取得します。
 */
export async function getAllServices(): Promise<Service[]> {
  return await prisma.service.findMany();
}

/**
 * 利用可能なロールを取得します（システム管理者を除く）。
 */
export async function getAllRoles(): Promise<Role[]> {
  return await prisma.role.findMany({
    where: {
      name: { not: "システム管理者" },
    },
  });
}

/**
 * 階層構造を持った全部署を取得します。
 */
export async function getDepartmentTree(): Promise<DepartmentWithChildren[]> {
  const allDepartments = await prisma.department.findMany();

  const buildTree = (parentId: string | null): DepartmentWithChildren[] => {
    return allDepartments
      .filter((dept) => dept.parentId === parentId)
      .map((dept) => ({
        ...dept,
        children: buildTree(dept.id),
      }));
  };

  return buildTree(null);
}
