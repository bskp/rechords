import { Meteor } from "meteor/meteor";

export type Role = "admin" | "writer" | "user";
export type Theme = "bright" | "dark" | "auto";

export type RechordsProfile = {
  name?: string;
  theme?: Theme;
  role?: Role;
  darlings?: string[];
};

export type RechordsUser = Meteor.User & {
  profile: RechordsProfile;
};

const asObject = (value: unknown): Record<string, unknown> | undefined => {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  return undefined;
};

export const readProfile = (profile: unknown): RechordsProfile => {
  const obj = asObject(profile);
  if (!obj) return {};

  return {
    name: typeof obj.name === "string" ? obj.name : undefined,
    theme:
      obj.theme === "bright" || obj.theme === "dark" || obj.theme === "auto"
        ? obj.theme
        : undefined,
    role:
      obj.role === "admin" || obj.role === "writer" || obj.role === "user"
        ? obj.role
        : undefined,
    darlings:
      Array.isArray(obj.darlings) &&
      obj.darlings.every((value) => typeof value === "string")
        ? obj.darlings
        : undefined,
  };
};

export const getUser = () => Meteor.user() as RechordsUser | null;

export const getRoleByUserId = async (
  userId?: string | null,
): Promise<Role | undefined> => {
  if (!userId) return undefined;
  const user = await Meteor.users.findOneAsync({ _id: userId });
  return readProfile(user?.profile).role;
};

export const hasWritePermission = (role?: Role) =>
  role === "admin" || role === "writer";
