import "server-only";

import { isIP } from "node:net";

const trustedClientIpHeader = "x-forwarded-for";

function normalizeIpv4(value: string) {
  const parts = value.split(".");

  if (
    parts.length !== 4 ||
    parts.some((part) => !/^(0|[1-9]\d{0,2})$/.test(part))
  ) {
    return null;
  }

  const octets = parts.map(Number);

  if (octets.some((octet) => octet > 255)) return null;

  return octets.join(".");
}

function normalizeIpv4MappedIpv6(value: string) {
  const mapped = value.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);

  if (!mapped) return null;

  const high = Number.parseInt(mapped[1], 16);
  const low = Number.parseInt(mapped[2], 16);

  return [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
}

function normalizeIpv6(value: string) {
  if (isIP(value) !== 6 || value.includes("%")) return null;

  try {
    const hostname = new URL(`http://[${value}]`).hostname;
    const normalized = hostname.slice(1, -1).toLowerCase();

    return normalizeIpv4MappedIpv6(normalized) ?? normalized;
  } catch {
    return null;
  }
}

export function getTrustedClientIdentity(request: Request) {
  const header = request.headers.get(trustedClientIpHeader);

  if (header === null) return null;

  const value = header.trim();

  if (!value || value.includes(",")) return null;

  return normalizeIpv4(value) ?? normalizeIpv6(value);
}
