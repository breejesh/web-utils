import { ToolContent } from '../models/tool.model';

const PRIVATE_FAQ = {
  q: 'Is my data uploaded anywhere?',
  a: 'No. Everything runs as JavaScript inside this browser tab. The site’s Content-Security-Policy blocks network requests to any other origin, so your input has nowhere to go. It also works offline once loaded.',
};

/** Visible how-to + FAQ copy per tool. Also emitted as FAQPage structured data. */
export const TOOL_CONTENT: Record<string, ToolContent> = {
  'base64-encode-decode': {
    steps: [
      'Paste Base64 to decode it, or plain text to encode it. Live mode updates the output as you type.',
      'Pick a character set (UTF-8 by default) and switch on URL-safe mode for Base64URL strings such as JWT segments.',
      'Use Encode file / Decode file for binary data, then copy the result or download it.',
    ],
    faqs: [
      {
        q: 'What is Base64 encoding?',
        a: 'Base64 represents binary data using 64 printable ASCII characters (A–Z, a–z, 0–9, + and /). It lets you carry bytes through text-only channels such as JSON, email, HTML data URLs and HTTP headers. Output is about 33% larger than the input.',
      },
      {
        q: 'Is Base64 encryption?',
        a: 'No. Base64 is a reversible encoding, not encryption. Anyone can decode it, so never use it to protect secrets.',
      },
      {
        q: 'What is the difference between Base64 and Base64URL?',
        a: 'Base64URL replaces “+” with “-” and “/” with “_”, and usually drops the “=” padding, so the value is safe to put in URLs and filenames. JWTs use Base64URL.',
      },
      PRIVATE_FAQ,
    ],
  },
  'url-encode-decode': {
    steps: [
      'Paste a URL, query string or encoded value into the input.',
      'Choose encodeURIComponent for single query or path values, or encodeURI for a whole URL.',
      'Press Encode or Decode, then copy the output. Swap moves the output back into the input.',
    ],
    faqs: [
      {
        q: 'When should I use encodeURIComponent vs encodeURI?',
        a: 'Use encodeURIComponent for a single value going into a query parameter or path segment: it escapes reserved characters such as &, =, ? and /. Use encodeURI for a full URL whose structure you want to keep.',
      },
      {
        q: 'Why does a space become %20 or +?',
        a: 'Percent-encoding turns a space into %20. HTML form encoding (application/x-www-form-urlencoded) uses + instead. Both decode back to a space in most servers.',
      },
      PRIVATE_FAQ,
    ],
  },
  'json-formatter': {
    steps: [
      'Paste JSON, or upload a .json file.',
      'Click Format to beautify with your chosen indent, Minify to compact it, or Validate to find the exact error position.',
      'Explore nested data in the tree view, try Auto-fix for trailing commas or single quotes, then copy or download.',
    ],
    faqs: [
      {
        q: 'How do I find the error in invalid JSON?',
        a: 'Validate reports the parser message with the line and column where parsing failed. Common causes are trailing commas, single-quoted strings, unquoted keys and comments, and Auto-fix repairs most of them.',
      },
      {
        q: 'Can I format very large JSON files?',
        a: 'Yes. Formatting runs locally, so the limit is your device’s memory rather than an upload cap. Files of tens of megabytes work in modern browsers.',
      },
      {
        q: 'Is it safe to paste API responses containing tokens?',
        a: 'Yes. Nothing is sent to a server. You can also clear this tool’s local history at any time.',
      },
    ],
  },
  'jwt-debugger': {
    steps: [
      'Paste a JSON Web Token (the three dot-separated segments).',
      'The header and payload decode instantly. Time claims such as exp, iat and nbf are shown as readable dates.',
      'Copy the decoded JSON. The signature is shown but never sent anywhere for verification.',
    ],
    faqs: [
      {
        q: 'Is it safe to paste a production JWT here?',
        a: 'Decoding happens entirely in your browser, and history is off by default for this tool, so the token is not saved either. Still treat live tokens as secrets and rotate any that leak.',
      },
      {
        q: 'Does decoding a JWT verify it?',
        a: 'No. Anyone can decode the header and payload because they are only Base64URL-encoded JSON. Verification needs the signing secret or public key and must happen on your server.',
      },
      {
        q: 'What do exp, iat and nbf mean?',
        a: 'They are Unix timestamps in seconds: exp is when the token expires, iat is when it was issued, and nbf is the time before which it must not be accepted.',
      },
    ],
  },
  'uuid-generator': {
    steps: [
      'Choose UUID v4 (random), UUID v7 (time-ordered) or a compact Nano-style ID.',
      'Set how many to generate and whether to use uppercase.',
      'Click Generate and copy the whole list in one click.',
    ],
    faqs: [
      {
        q: 'What is the difference between UUID v4 and v7?',
        a: 'v4 is 122 bits of randomness. v7 starts with a millisecond timestamp, so IDs sort by creation time, which keeps database indexes compact. Prefer v7 for primary keys.',
      },
      {
        q: 'Can two UUIDs collide?',
        a: 'In practice, no. You would need to generate billions of v4 UUIDs per second for decades before a collision becomes likely. IDs here come from the browser’s cryptographic random generator.',
      },
      PRIVATE_FAQ,
    ],
  },
  'hash-generator': {
    steps: [
      'Type or paste text, or drop a file to hash its bytes.',
      'MD5, SHA-1, SHA-256, SHA-384 and SHA-512 digests are computed together as you type.',
      'Copy any digest, or paste an expected checksum to compare it against all algorithms.',
    ],
    faqs: [
      {
        q: 'Which hash should I use?',
        a: 'Use SHA-256 or SHA-512 for integrity checks and signatures. MD5 and SHA-1 are broken for security purposes but are still used for legacy checksums.',
      },
      {
        q: 'Can I hash passwords with this?',
        a: 'Do not store passwords as plain SHA or MD5 hashes. Use a slow, salted algorithm such as Argon2, bcrypt or scrypt on your server.',
      },
      {
        q: 'How do I verify a downloaded file’s checksum?',
        a: 'Drop the file onto the tool, paste the published checksum into the compare box, and the matching algorithm will be highlighted. The file is read locally and never uploaded.',
      },
    ],
  },
  'text-diff': {
    steps: [
      'Paste the original text on the left and the changed text on the right.',
      'Additions and removals are highlighted line by line as you type.',
      'Turn on Ignore whitespace to hide indentation-only changes.',
    ],
    faqs: [
      {
        q: 'Can I compare code or config files?',
        a: 'Yes. The diff is line-based like git diff, which works well for source code, JSON, YAML, .env files and logs.',
      },
      PRIVATE_FAQ,
    ],
  },
  'timestamp-converter': {
    steps: [
      'Paste a Unix timestamp. Seconds, milliseconds, microseconds and nanoseconds are detected automatically.',
      'Read the result in UTC, your local time zone and as a relative time, or convert a date back to epoch.',
      'Use the start/end of day, month and year helpers, and copy code snippets for your language.',
    ],
    faqs: [
      {
        q: 'What is a Unix timestamp?',
        a: 'It is the number of seconds since 00:00:00 UTC on 1 January 1970 (the Unix epoch), ignoring leap seconds. JavaScript and Java often use milliseconds instead.',
      },
      {
        q: 'How can I tell if a timestamp is in seconds or milliseconds?',
        a: 'For current dates, 10 digits means seconds, 13 means milliseconds, 16 means microseconds and 19 means nanoseconds. The converter detects this for you.',
      },
      {
        q: 'What is the Year 2038 problem?',
        a: 'Signed 32-bit integers overflow at 2,147,483,647 seconds, which is 03:14:07 UTC on 19 January 2038. Systems that store time in 32 bits will wrap around at that point.',
      },
    ],
  },
  'regex-tester': {
    steps: [
      'Enter a pattern and flags (g, i, m, s, u, y) in the expression bar.',
      'Paste test text. Matches are highlighted live and capture groups are listed for each match.',
      'Use the substitution panel to preview replace() output, and check the token explanation to understand the pattern.',
    ],
    faqs: [
      {
        q: 'Which regex flavor is used?',
        a: 'JavaScript (ECMAScript) regular expressions, as implemented by your browser, including named groups, lookbehind and Unicode property escapes.',
      },
      {
        q: 'Why does my pattern only match once?',
        a: 'Add the g (global) flag to find every match. Without it, JavaScript stops at the first match.',
      },
      PRIVATE_FAQ,
    ],
  },
  'color-converter': {
    steps: [
      'Enter a HEX, RGB or HSL color, or pick one with the color picker.',
      'The other formats update instantly with a live swatch.',
      'Check the WCAG contrast ratio against white and black text before you ship.',
    ],
    faqs: [
      {
        q: 'What contrast ratio do I need for accessibility?',
        a: 'WCAG AA requires 4.5:1 for normal text and 3:1 for large text (24px, or 19px bold). AAA requires 7:1 and 4.5:1 respectively.',
      },
      {
        q: 'What is the difference between HSL and RGB?',
        a: 'RGB mixes red, green and blue light channels. HSL describes hue, saturation and lightness, which is easier to adjust by hand, for example to make a color 10% lighter.',
      },
    ],
  },
  'unit-converter': {
    steps: [
      'Pick a category: length, mass, temperature, data size and more.',
      'Choose the from and to units and enter a value.',
      'The result updates instantly. Swap reverses the direction.',
    ],
    faqs: [
      {
        q: 'Is 1 GB 1000 MB or 1024 MB?',
        a: 'Both are in use. SI units (kB, MB, GB) are powers of 1000, and binary units (KiB, MiB, GiB) are powers of 1024. Drive makers use SI, while many operating systems report binary.',
      },
    ],
  },
  'percentage-calculator': {
    steps: [
      'Pick the calculation you need: X% of Y, X is what % of Y, percent change, or discount.',
      'Type your numbers. Results update as you type.',
    ],
    faqs: [
      {
        q: 'How do I calculate percentage change?',
        a: 'Subtract the old value from the new value, divide by the old value, and multiply by 100. Going from 80 to 100 is a 25% increase.',
      },
      {
        q: 'How do I work out a discount?',
        a: 'Multiply the price by the discount percentage divided by 100 to get the saving, then subtract it from the price. 10% off 100 is a saving of 10, leaving 90.',
      },
    ],
  },
  'word-counter': {
    steps: [
      'Paste or type your text.',
      'Words, characters (with and without spaces), sentences, paragraphs and reading time update live.',
    ],
    faqs: [
      {
        q: 'How is reading time calculated?',
        a: 'It assumes an average adult reading speed of about 200 words per minute.',
      },
      {
        q: 'Does it work for essays and documents I don’t want to share?',
        a: 'Yes. Counting happens locally and nothing is uploaded, which makes it safe for drafts, manuscripts and confidential documents.',
      },
    ],
  },
  'case-converter': {
    steps: [
      'Type or paste text, such as a variable name or a sentence.',
      'Every case is generated at once: camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, Title Case and more.',
      'Click Copy next to the format you need.',
    ],
    faqs: [
      {
        q: 'Which case should I use for code?',
        a: 'Conventions vary: JavaScript uses camelCase for variables and PascalCase for classes, Python uses snake_case, CSS and URLs use kebab-case, and constants are usually CONSTANT_CASE.',
      },
    ],
  },
  'lorem-ipsum': {
    steps: [
      'Choose paragraphs, sentences or words, and set the count.',
      'Copy the placeholder text into your design or mockup.',
    ],
    faqs: [
      {
        q: 'What does lorem ipsum mean?',
        a: 'It is scrambled Latin from Cicero’s “De finibus bonorum et malorum” (45 BC). Typesetters have used it as filler since the 1500s because it looks like natural text without distracting the reader.',
      },
    ],
  },
  'qr-code-generator': {
    steps: [
      'Enter a URL or any text.',
      'Adjust the size and quiet-zone margin. The preview updates instantly.',
      'Download a PNG, ready to print or share.',
    ],
    faqs: [
      {
        q: 'Do these QR codes expire?',
        a: 'No. They are static codes with the content encoded directly in the pattern. There is no redirect service in between, so they work forever and nobody tracks scans.',
      },
      {
        q: 'How much data can a QR code hold?',
        a: 'Up to about 2,900 bytes. Shorter content gives a less dense code that scans more reliably, so keep URLs short.',
      },
    ],
  },
  'image-tools': {
    steps: [
      'Choose an image from your device.',
      'Set a maximum width, output format (JPEG, PNG, WebP) and quality.',
      'Download the resized, compressed image or copy it as a Base64 data URL.',
    ],
    faqs: [
      {
        q: 'Are my photos uploaded to compress them?',
        a: 'No. Resizing and compression use the browser’s Canvas API on your device, so your images never leave it.',
      },
      {
        q: 'Which format gives the smallest files?',
        a: 'WebP is usually the smallest at similar quality. JPEG works best for photos, and PNG suits screenshots and images that need transparency.',
      },
    ],
  },
  'csv-json': {
    steps: [
      'Paste CSV (with or without a header row) or a JSON array.',
      'Choose a delimiter (comma, semicolon or tab) and convert in either direction.',
      'Copy the result. Quoted fields and embedded newlines are handled correctly.',
    ],
    faqs: [
      {
        q: 'How are nested JSON objects converted to CSV?',
        a: 'Every key found across all records becomes a column. Nested objects are written as JSON strings inside their cell, so no data is lost.',
      },
      PRIVATE_FAQ,
    ],
  },
  'password-generator': {
    steps: [
      'Choose a length and which character sets to include.',
      'Every option change generates a new password from your browser’s cryptographic random generator.',
      'Check the entropy estimate, then copy the password.',
    ],
    faqs: [
      {
        q: 'Are generated passwords truly random?',
        a: 'Yes. They use crypto.getRandomValues with rejection sampling, so every character is equally likely. Nothing is generated on, or sent to, a server, and passwords are never saved to history.',
      },
      {
        q: 'How long should a password be?',
        a: 'Aim for at least 16 characters, or about 80+ bits of entropy, for important accounts. Store it in a password manager.',
      },
    ],
  },
  'date-calculator': {
    steps: [
      'Calculate an exact age from a birth date.',
      'Count the days between two dates.',
      'Add or subtract days from a date to find a deadline.',
    ],
    faqs: [
      {
        q: 'Does the day count include the end date?',
        a: 'No. The difference counts full days between the two dates, like most spreadsheet functions. Add one if you need to include both ends.',
      },
    ],
  },
  'markdown-preview': {
    steps: [
      'Write or paste GitHub-flavored Markdown on the left.',
      'See the rendered preview live on the right.',
      'Copy the generated HTML when you are done.',
    ],
    faqs: [
      {
        q: 'Which Markdown features are supported?',
        a: 'GitHub-flavored Markdown: tables, fenced code blocks, task lists, strikethrough and autolinks. Raw HTML is sanitized before rendering.',
      },
    ],
  },
  'svg-optimizer': {
    steps: [
      'Paste SVG markup exported from Figma, Illustrator or Inkscape.',
      'Choose what to strip: comments, editor metadata and whitespace.',
      'Copy the minified SVG and check the size saving.',
    ],
    faqs: [
      {
        q: 'Will optimizing change how my SVG looks?',
        a: 'No. Only comments, editor metadata and insignificant whitespace are removed, while paths and attributes stay the same. Compare the before and after previews to check.',
      },
    ],
  },
  'cron-explainer': {
    steps: [
      'Enter a cron expression such as */5 * * * *.',
      'Read the plain-English schedule.',
      'Start from a preset for common schedules.',
    ],
    faqs: [
      {
        q: 'What are the five cron fields?',
        a: 'Minute (0–59), hour (0–23), day of month (1–31), month (1–12) and day of week (0–6, Sunday = 0). Some schedulers add a seconds field at the start.',
      },
      {
        q: 'What does */15 mean?',
        a: '“Every 15 units”. In the minute field, */15 runs at minutes 0, 15, 30 and 45.',
      },
    ],
  },
  'sql-formatter': {
    steps: [
      'Paste a SQL query.',
      'Choose a dialect: Standard SQL, MySQL, PostgreSQL, T-SQL or SQLite.',
      'Format to get consistent indentation and uppercase keywords, then copy.',
    ],
    faqs: [
      {
        q: 'Does formatting change what my query does?',
        a: 'No. Only whitespace and keyword case change, so the query runs exactly the same.',
      },
      PRIVATE_FAQ,
    ],
  },
  'yaml-json': {
    steps: [
      'Paste YAML (Kubernetes manifests, CI configs, docker-compose) or JSON.',
      'Convert in either direction. Errors show the exact line.',
      'Copy the result.',
    ],
    faqs: [
      {
        q: 'Is YAML a superset of JSON?',
        a: 'Mostly. YAML 1.2 accepts nearly all JSON, so any JSON converts to YAML. Some YAML features, such as anchors, comments and multiple documents, have no JSON equivalent and are flattened or dropped.',
      },
    ],
  },
  'certificate-inspector': {
    steps: [
      'Paste a PEM certificate (-----BEGIN CERTIFICATE-----). Full chains work too.',
      'Read the decoded subject, issuer, validity period, SANs, key type and fingerprints.',
      'Check the expiry countdown and copy the SHA-256 fingerprint.',
    ],
    faqs: [
      {
        q: 'How do I get a site’s certificate in PEM format?',
        a: 'Run: openssl s_client -connect example.com:443 -showcerts </dev/null. Or open the padlock in your browser, view the certificate, and export it as PEM (.crt or .pem).',
      },
      {
        q: 'Is it safe to paste certificates here?',
        a: 'Certificates are public, but this tool parses them locally anyway. Never paste private keys (-----BEGIN PRIVATE KEY-----) into any website.',
      },
    ],
  },
  'exif-viewer': {
    steps: [
      'Choose a photo from your device.',
      'Review every metadata tag, including camera, lens, timestamps and GPS location.',
      'Download a clean copy with all metadata removed before sharing it publicly.',
    ],
    faqs: [
      {
        q: 'Can photos reveal my location?',
        a: 'Yes. Phones often embed exact GPS coordinates in EXIF data. Strip metadata before posting photos publicly or sending them to strangers.',
      },
      {
        q: 'Is my photo uploaded to read its metadata?',
        a: 'No. Metadata is parsed locally with JavaScript, and nothing is uploaded.',
      },
    ],
  },
  'evtx-viewer': {
    steps: [
      'Open a Windows .evtx file, for example Security.evtx from C:\\Windows\\System32\\winevt\\Logs.',
      'Filter events by Event ID or free text across every field.',
      'Inspect event details and export the filtered set to JSON or CSV.',
    ],
    faqs: [
      {
        q: 'Can I open EVTX files on a Mac or Linux?',
        a: 'Yes. This viewer runs in any modern browser, so you don’t need Windows Event Viewer to read .evtx files.',
      },
      {
        q: 'Is it safe for incident response evidence?',
        a: 'Logs are parsed in memory in your browser and never uploaded, which helps preserve confidentiality during investigations.',
      },
    ],
  },
};
