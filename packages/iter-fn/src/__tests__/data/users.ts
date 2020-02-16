export interface User { name: string, role: string }
export interface Role { name: string }

export const aliceUser: User = { name: "alice", role: "admin" };
export const bobUser: User = { name: "bob", role: "user" };
export const daveUser: User = { name: "dave", role: "user" };
export const users: User[] = [aliceUser, bobUser, daveUser];

export const adminRole: Role = { name: "admin" };
export const userRole: Role = { name: "user" };
export const guestRole: Role = { name: "guest" };
export const roles: Role[] = [adminRole, userRole, guestRole];
