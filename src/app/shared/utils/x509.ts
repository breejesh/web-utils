/**
 * Minimal DER / X.509 v3 certificate decoder — enough to inspect real-world TLS certificates
 * (subject, issuer, validity, SANs, key, common extensions) without any dependencies.
 */

interface Node {
  tag: number;
  /** Absolute offset of the content bytes. */
  start: number;
  /** Absolute offset just past the content. */
  end: number;
  /** Absolute offset of the tag byte (for slicing full TLV). */
  offset: number;
  constructed: boolean;
}

export interface NameAttr {
  key: string;
  label: string;
  value: string;
}

export interface CertExtension {
  oid: string;
  name: string;
  critical: boolean;
  value: string;
}

export interface ParsedCertificate {
  version: number;
  serialHex: string;
  signatureAlgorithm: string;
  subject: NameAttr[];
  issuer: NameAttr[];
  subjectString: string;
  issuerString: string;
  notBefore: Date;
  notAfter: Date;
  keyAlgorithm: string;
  keySize?: number;
  curve?: string;
  sans: string[];
  isCA: boolean;
  selfSigned: boolean;
  keyUsage: string[];
  extKeyUsage: string[];
  extensions: CertExtension[];
  der: Uint8Array;
}

const NAME_OIDS: Record<string, [string, string]> = {
  '2.5.4.3': ['CN', 'Common name'],
  '2.5.4.6': ['C', 'Country'],
  '2.5.4.7': ['L', 'Locality'],
  '2.5.4.8': ['ST', 'State / province'],
  '2.5.4.9': ['STREET', 'Street'],
  '2.5.4.10': ['O', 'Organization'],
  '2.5.4.11': ['OU', 'Organizational unit'],
  '2.5.4.5': ['SERIALNUMBER', 'Serial number'],
  '2.5.4.15': ['businessCategory', 'Business category'],
  '2.5.4.17': ['postalCode', 'Postal code'],
  '1.2.840.113549.1.9.1': ['E', 'Email'],
  '0.9.2342.19200300.100.1.25': ['DC', 'Domain component'],
  '1.3.6.1.4.1.311.60.2.1.3': ['jurisdictionC', 'Jurisdiction country'],
};

const ALG_OIDS: Record<string, string> = {
  '1.2.840.113549.1.1.1': 'RSA',
  '1.2.840.113549.1.1.5': 'SHA-1 with RSA',
  '1.2.840.113549.1.1.10': 'RSASSA-PSS',
  '1.2.840.113549.1.1.11': 'SHA-256 with RSA',
  '1.2.840.113549.1.1.12': 'SHA-384 with RSA',
  '1.2.840.113549.1.1.13': 'SHA-512 with RSA',
  '1.2.840.10045.2.1': 'EC',
  '1.2.840.10045.4.3.2': 'ECDSA with SHA-256',
  '1.2.840.10045.4.3.3': 'ECDSA with SHA-384',
  '1.2.840.10045.4.3.4': 'ECDSA with SHA-512',
  '1.3.101.110': 'X25519',
  '1.3.101.112': 'Ed25519',
  '1.3.101.113': 'Ed448',
};

const CURVES: Record<string, [string, number]> = {
  '1.2.840.10045.3.1.7': ['P-256', 256],
  '1.3.132.0.34': ['P-384', 384],
  '1.3.132.0.35': ['P-521', 521],
  '1.3.132.0.10': ['secp256k1', 256],
};

const EXT_NAMES: Record<string, string> = {
  '2.5.29.14': 'Subject Key Identifier',
  '2.5.29.15': 'Key Usage',
  '2.5.29.17': 'Subject Alternative Name',
  '2.5.29.19': 'Basic Constraints',
  '2.5.29.31': 'CRL Distribution Points',
  '2.5.29.32': 'Certificate Policies',
  '2.5.29.35': 'Authority Key Identifier',
  '2.5.29.37': 'Extended Key Usage',
  '1.3.6.1.5.5.7.1.1': 'Authority Information Access',
  '1.3.6.1.4.1.11129.2.4.2': 'Certificate Transparency SCTs',
  '1.3.6.1.5.5.7.1.24': 'TLS Feature (OCSP Must-Staple)',
};

const EKU: Record<string, string> = {
  '1.3.6.1.5.5.7.3.1': 'TLS server auth',
  '1.3.6.1.5.5.7.3.2': 'TLS client auth',
  '1.3.6.1.5.5.7.3.3': 'Code signing',
  '1.3.6.1.5.5.7.3.4': 'Email protection',
  '1.3.6.1.5.5.7.3.8': 'Time stamping',
  '1.3.6.1.5.5.7.3.9': 'OCSP signing',
};

const KEY_USAGE = [
  'Digital signature',
  'Non-repudiation',
  'Key encipherment',
  'Data encipherment',
  'Key agreement',
  'Certificate signing',
  'CRL signing',
  'Encipher only',
  'Decipher only',
];

const POLICY_NAMES: Record<string, string> = {
  '2.23.140.1.2.1': 'Domain validated (DV)',
  '2.23.140.1.2.2': 'Organization validated (OV)',
  '2.23.140.1.2.3': 'Individual validated (IV)',
  '2.23.140.1.1': 'Extended validation (EV)',
};

export function pemBlocks(text: string): { type: string; der: Uint8Array | null }[] {
  return [...text.matchAll(/-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/g)].map((m) => {
    try {
      const bin = atob(m[2].replace(/[^A-Za-z0-9+/=]/g, ''));
      return { type: m[1].trim(), der: Uint8Array.from(bin, (c) => c.charCodeAt(0)) };
    } catch {
      return { type: m[1].trim(), der: null };
    }
  });
}

export function parseCertificate(der: Uint8Array): ParsedCertificate {
  const r = new Reader(der);
  const cert = r.read(0);
  expect(cert, 0x30, 'Certificate');
  const [tbs, sigAlg] = r.children(cert);
  expect(tbs, 0x30, 'TBSCertificate');

  const t = r.children(tbs);
  let i = 0;
  let version = 1;
  if (t[i].tag === 0xa0) {
    version = Number(r.intValue(r.children(t[i])[0])) + 1;
    i++;
  }
  const serial = t[i++];
  i++; // inner signature algorithm (duplicate of outer)
  const issuerNode = t[i++];
  const validity = t[i++];
  const subjectNode = t[i++];
  const spki = t[i++];
  const extsWrap = t.slice(i).find((n) => n.tag === 0xa3);

  const [nb, na] = r.children(validity);
  const issuer = r.name(issuerNode);
  const subject = r.name(subjectNode);

  const [keyAlgNode, keyBits] = r.children(spki);
  const [keyOidNode, keyParam] = r.children(keyAlgNode);
  const keyOid = r.oid(keyOidNode);
  let keySize: number | undefined;
  let curve: string | undefined;
  if (keyOid === '1.2.840.113549.1.1.1') {
    // BIT STRING → SEQUENCE { modulus, exponent }
    const inner = new Reader(der.subarray(keyBits.start + 1, keyBits.end));
    const [mod] = inner.children(inner.read(0));
    let bytes = der.subarray(keyBits.start + 1 + mod.start, keyBits.start + 1 + mod.end);
    while (bytes.length && bytes[0] === 0) bytes = bytes.subarray(1);
    keySize = bytes.length * 8 - Math.clz32(bytes[0] ?? 0) + 24;
  } else if (keyOid === '1.2.840.10045.2.1' && keyParam?.tag === 0x06) {
    const c = CURVES[r.oid(keyParam)];
    if (c) [curve, keySize] = c;
  } else if (keyOid === '1.3.101.112' || keyOid === '1.3.101.110') {
    keySize = 256;
  }

  const result: ParsedCertificate = {
    version,
    serialHex: hex(der.subarray(serial.start, serial.end)).replace(/^00(?=[89a-f])/, ''),
    signatureAlgorithm: algName(r.oid(r.children(sigAlg)[0])),
    subject,
    issuer,
    subjectString: nameString(subject),
    issuerString: nameString(issuer),
    notBefore: r.time(nb),
    notAfter: r.time(na),
    keyAlgorithm: algName(keyOid),
    keySize,
    curve,
    sans: [],
    isCA: false,
    selfSigned: false,
    keyUsage: [],
    extKeyUsage: [],
    extensions: [],
    der,
  };
  result.selfSigned = result.subjectString === result.issuerString;

  if (extsWrap) {
    for (const ext of r.children(r.children(extsWrap)[0])) {
      const parts = r.children(ext);
      const oid = r.oid(parts[0]);
      const critical = parts.length === 3 && der[parts[1].start] !== 0;
      const valueNode = parts[parts.length - 1];
      const inner = new Reader(der.subarray(valueNode.start, valueNode.end));
      let value = '';
      try {
        value = describeExtension(oid, inner, result);
      } catch {
        value = '(could not decode)';
      }
      result.extensions.push({ oid, name: EXT_NAMES[oid] ?? oid, critical, value });
    }
  }
  return result;
}

function describeExtension(oid: string, r: Reader, cert: ParsedCertificate): string {
  const root = r.read(0);
  switch (oid) {
    case '2.5.29.17': {
      for (const gn of r.children(root)) {
        const raw = r.bytes(gn);
        if (gn.tag === 0x82) cert.sans.push(ascii(raw));
        else if (gn.tag === 0x81) cert.sans.push(`email:${ascii(raw)}`);
        else if (gn.tag === 0x86) cert.sans.push(`uri:${ascii(raw)}`);
        else if (gn.tag === 0x87) cert.sans.push(`ip:${ipString(raw)}`);
      }
      return cert.sans.join(', ');
    }
    case '2.5.29.19': {
      const kids = r.children(root);
      cert.isCA = kids.length > 0 && kids[0].tag === 0x01 && r.bytes(kids[0])[0] !== 0;
      const pathLen = kids.find((k) => k.tag === 0x02);
      return `CA: ${cert.isCA ? 'yes' : 'no'}${pathLen ? `, path length ≤ ${r.intValue(pathLen)}` : ''}`;
    }
    case '2.5.29.15': {
      // b[0] = unused-bit count; bit 0 (digitalSignature) is the MSB of b[1]; decipherOnly is the MSB of b[2].
      const b = r.bytes(root);
      cert.keyUsage = KEY_USAGE.filter((_, i) => (i < 8 ? (b[1] ?? 0) & (0x80 >> i) : (b[2] ?? 0) & 0x80));
      return cert.keyUsage.join(', ');
    }
    case '2.5.29.37':
      cert.extKeyUsage = r.children(root).map((n) => EKU[r.oid(n)] ?? r.oid(n));
      return cert.extKeyUsage.join(', ');
    case '2.5.29.14':
      return colonHex(r.bytes(root));
    case '2.5.29.35': {
      const keyId = r.children(root).find((n) => n.tag === 0x80);
      return keyId ? colonHex(r.bytes(keyId)) : '';
    }
    case '2.5.29.32':
      return r
        .children(root)
        .map((p) => {
          const id = r.oid(r.children(p)[0]);
          return POLICY_NAMES[id] ?? id;
        })
        .join(', ');
    case '1.3.6.1.5.5.7.1.1':
      return r
        .children(root)
        .map((ad) => {
          const [method, loc] = r.children(ad);
          const label = r.oid(method) === '1.3.6.1.5.5.7.48.1' ? 'OCSP' : 'CA issuers';
          return `${label}: ${ascii(r.bytes(loc))}`;
        })
        .join(' · ');
    case '2.5.29.31': {
      const urls: string[] = [];
      const walk = (n: Node) => {
        if (n.tag === 0x86) urls.push(ascii(r.bytes(n)));
        else if (n.constructed) r.children(n).forEach(walk);
      };
      walk(root);
      return urls.join(', ');
    }
    case '1.3.6.1.4.1.11129.2.4.2':
      return 'Present (logged to public CT logs)';
    default:
      return `${r.bytes(root).length} bytes`;
  }
}

class Reader {
  constructor(private readonly buf: Uint8Array) {}

  read(offset: number): Node {
    const b = this.buf;
    if (offset + 2 > b.length) throw new Error('Truncated DER');
    const tag = b[offset];
    let len = b[offset + 1];
    let p = offset + 2;
    if (len & 0x80) {
      const n = len & 0x7f;
      if (n === 0 || n > 4) throw new Error('Unsupported DER length');
      len = 0;
      for (let i = 0; i < n; i++) len = len * 256 + b[p++];
    }
    if (p + len > b.length) throw new Error('Truncated DER');
    return { tag, start: p, end: p + len, offset, constructed: (tag & 0x20) !== 0 };
  }

  children(n: Node): Node[] {
    const out: Node[] = [];
    let p = n.start;
    while (p < n.end) {
      const c = this.read(p);
      out.push(c);
      p = c.end;
    }
    return out;
  }

  bytes(n: Node): Uint8Array {
    return this.buf.subarray(n.start, n.end);
  }

  oid(n: Node): string {
    const b = this.bytes(n);
    const parts: number[] = [];
    let v = 0;
    for (let i = 0; i < b.length; i++) {
      v = v * 128 + (b[i] & 0x7f);
      if (!(b[i] & 0x80)) {
        if (!parts.length) parts.push(v < 80 ? Math.floor(v / 40) : 2, v < 80 ? v % 40 : v - 80);
        else parts.push(v);
        v = 0;
      }
    }
    return parts.join('.');
  }

  intValue(n: Node): bigint {
    let v = 0n;
    for (const byte of this.bytes(n)) v = (v << 8n) | BigInt(byte);
    return v;
  }

  time(n: Node): Date {
    const s = ascii(this.bytes(n));
    const m =
      n.tag === 0x17
        ? s.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?Z$/)
        : s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?(?:\.\d+)?Z$/);
    if (!m) throw new Error(`Unsupported time format: ${s}`);
    let year = Number(m[1]);
    if (n.tag === 0x17) year += year < 50 ? 2000 : 1900;
    return new Date(Date.UTC(year, Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0)));
  }

  name(n: Node): NameAttr[] {
    const out: NameAttr[] = [];
    for (const rdn of this.children(n)) {
      for (const atv of this.children(rdn)) {
        const [typeNode, valueNode] = this.children(atv);
        const oid = this.oid(typeNode);
        const [key, label] = NAME_OIDS[oid] ?? [oid, oid];
        out.push({ key, label, value: decodeString(valueNode.tag, this.bytes(valueNode)) });
      }
    }
    return out;
  }
}

function expect(n: Node, tag: number, what: string): void {
  if (n.tag !== tag) throw new Error(`Not an X.509 certificate (bad ${what})`);
}

function decodeString(tag: number, b: Uint8Array): string {
  if (tag === 0x1e) {
    // BMPString (UTF-16BE)
    let s = '';
    for (let i = 0; i + 1 < b.length; i += 2) s += String.fromCharCode((b[i] << 8) | b[i + 1]);
    return s;
  }
  return new TextDecoder().decode(b);
}

function ascii(b: Uint8Array): string {
  return String.fromCharCode(...b);
}

function hex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

export function colonHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0').toUpperCase()).join(':');
}

function ipString(b: Uint8Array): string {
  if (b.length === 4) return Array.from(b).join('.');
  const groups: string[] = [];
  for (let i = 0; i + 1 < b.length; i += 2) groups.push(((b[i] << 8) | b[i + 1]).toString(16));
  return groups.join(':').replace(/(^|:)0(:0)+(:|$)/, '::');
}

function algName(oid: string): string {
  return ALG_OIDS[oid] ?? oid;
}

function nameString(attrs: NameAttr[]): string {
  return attrs.map((a) => `${a.key}=${a.value}`).join(', ');
}
