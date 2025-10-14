import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// BigInt、Decimal and Date serialization tool function
export function serializeObj(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "bigint") {
    return Number(obj);
  }

  // Handle Date object
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle Prisma Decimal type
  if (
    typeof obj === "object" &&
    obj !== null &&
    "s" in obj &&
    "e" in obj &&
    "d" in obj
  ) {
    // This is the format of the Prisma Decimal object
    return parseFloat(obj.toString());
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeObj);
  }

  if (typeof obj === "object") {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeObj(value);
    }
    return serialized;
  }

  return obj;
}
