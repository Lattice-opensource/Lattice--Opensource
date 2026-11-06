// Minimal multipart/form-data parser (no external deps).

export interface MultipartPart {
  name: string;
  filename?: string;
  contentType: string;
  data: Buffer;
}

export function parseMultipart(buffer: Buffer, contentType: string): MultipartPart[] {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) throw new Error('Missing boundary');
  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const delim = Buffer.from('--' + boundary);
  const parts: MultipartPart[] = [];

  // Split by boundary
  let pos = 0;
  const chunks: Buffer[] = [];
  // find all boundary positions
  const indices: number[] = [];
  let searchFrom = 0;
  while (true) {
    const idx = buffer.indexOf(delim, searchFrom);
    if (idx === -1) break;
    indices.push(idx);
    searchFrom = idx + delim.length;
  }

  for (let i = 0; i < indices.length - 1; i++) {
    const start = (indices[i] as number) + delim.length;
    // skip CRLF after boundary
    let bodyStart = start;
    if (buffer[bodyStart] === 0x0d && buffer[bodyStart + 1] === 0x0a) bodyStart += 2;
    const end = indices[i + 1];
    // body is between bodyStart and end, trim trailing CRLF
    let bodyEnd = end as number;
    if (bodyEnd > 1 && buffer[bodyEnd - 2] === 0x0d && buffer[bodyEnd - 1] === 0x0a) bodyEnd -= 2;
    const partBuf = buffer.subarray(bodyStart, bodyEnd);
    // split headers/body
    const headerEnd = partBuf.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd === -1) continue;
    const headerStr = partBuf.subarray(0, headerEnd).toString('utf8');
    const data = partBuf.subarray(headerEnd + 4);
    // parse headers
    let name = '';
    let filename: string | undefined;
    let contentType = 'application/octet-stream';
    for (const line of headerStr.split('\r\n')) {
      const m = line.match(/^Content-Disposition:\s*form-data;\s*(.*)$/i);
      if (m && m[1]) {
        const rest = m[1];
        const nm = rest.match(/name="([^"]*)"/);
        if (nm && nm[1] !== undefined) name = nm[1];
        const fn = rest.match(/filename="([^"]*)"/);
        if (fn && fn[1] !== undefined) filename = fn[1];
      }
      const ct = line.match(/^Content-Type:\s*(.+)$/i);
      if (ct && ct[1]) contentType = ct[1].trim();
    }
    if (name) parts.push({ name, filename, contentType, data });
  }
  return parts;
}
