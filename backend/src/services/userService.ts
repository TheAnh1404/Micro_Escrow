import { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface ConnectWalletInput {
  address: string;
  name?: string;
  avatarUrl?: string;
  email?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  avatarUrl?: string;
  role?: UserRole;
}

export class UserService {
  /**
   * Kết nối ví: Tự động đăng ký người dùng mới nếu chưa tồn tại, hoặc lấy thông tin người dùng hiện tại.
   */
  static async connectWallet(input: ConnectWalletInput) {
    const address = input.address.trim();

    const user = await prisma.user.upsert({
      where: { address },
      update: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.avatarUrl ? { avatarUrl: input.avatarUrl } : {}),
        ...(input.email ? { email: input.email } : {}),
      },
      create: {
        address,
        name: input.name || null,
        avatarUrl: input.avatarUrl || null,
        email: input.email || null,
      },
    });

    return user;
  }

  /**
   * Lấy thông tin người dùng theo địa chỉ ví.
   */
  static async getUserByAddress(address: string) {
    const user = await prisma.user.findUnique({
      where: { address: address.trim() },
      include: {
        _count: {
          select: {
            clientDeals: true,
            freelancerDeals: true,
          },
        },
      },
    });

    return user;
  }

  /**
   * Cập nhật Hồ sơ Người dùng (Name, Avatar, Email, Role).
   */
  static async updateUserProfile(address: string, input: UpdateUserInput) {
    const user = await prisma.user.update({
      where: { address: address.trim() },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
      },
    });

    return user;
  }
}
