/**
 * UI and structural tests for CreateForm and EditForm:
 * 1. Absence guard on `shouldAutoFill` (AC-03)
 * 2. Presence of familyName and youthName inputs in CreateForm and EditForm
 * 3. Presence of S6 closing prayer copy Checkbox in CreateForm and EditForm
 * 4. buildFieldsPayload and fieldsFromParsed roundtrip for familyName and youthName
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const { buildFieldsPayload, fieldsFromParsed } = await import(
  pathToFileURL(path.join(ROOT, 'src', 'lib', 'worship-form-fields.ts')).href
);

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

export function scanShouldAutoFill(source, rel) {
  const findings = [];
  const clean = stripComments(source);
  const lines = clean.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    if (/\bshouldAutoFill\b/.test(line)) {
      findings.push({
        rel,
        lineNo,
        kind: 'shouldAutoFill-reference',
        line: line.trim(),
      });
    }
  }
  return findings;
}

test('AC-03: CreateForm and EditForm have zero references to shouldAutoFill', () => {
  const files = [
    'src/operator/CreateForm.tsx',
    'src/operator/EditForm.tsx',
  ];

  const findings = files.flatMap((rel) => {
    const abs = path.join(ROOT, rel);
    const content = readFileSync(abs, 'utf8');
    return scanShouldAutoFill(content, rel);
  });

  assert.deepEqual(
    findings,
    [],
    findings.length
      ? `Found shouldAutoFill references in forms:\n${findings
          .map((f) => `  ${f.rel}:${f.lineNo} [${f.kind}] ${f.line}`)
          .join('\n')}`
      : undefined
  );
});

test('guard proof: scanShouldAutoFill reports shouldAutoFill references', () => {
  const dummy = `
    const shouldAutoFill = !closing.trim() || closing.trim() === prevSpeaker.trim();
    if (shouldAutoFill) {
      setField('closingPrayerPerson', nextSpeaker);
    }
  `;
  const findings = scanShouldAutoFill(dummy, 'probe.tsx');
  assert.equal(findings.length, 2);
  assert.equal(findings[0].kind, 'shouldAutoFill-reference');
});

test('CreateForm and EditForm contain familyName and youthName inputs', () => {
  const files = [
    'src/operator/CreateForm.tsx',
    'src/operator/EditForm.tsx',
  ];

  for (const rel of files) {
    const content = readFileSync(path.join(ROOT, rel), 'utf8');
    assert.ok(
      content.includes("setField('familyName'"),
      `${rel} must wire familyName input`
    );
    assert.ok(
      content.includes("setField('youthName'"),
      `${rel} must wire youthName input`
    );
    assert.ok(
      content.includes('form.familyName') || content.includes('form.familyNamePlaceholder'),
      `${rel} must use familyName i18n label/placeholder`
    );
    assert.ok(
      content.includes('form.youthName') || content.includes('form.youthNamePlaceholder'),
      `${rel} must use youthName i18n label/placeholder`
    );
  }
});

test('CreateForm and EditForm contain S6 closing prayer copy Checkbox', () => {
  const files = [
    'src/operator/CreateForm.tsx',
    'src/operator/EditForm.tsx',
  ];

  for (const rel of files) {
    const content = readFileSync(path.join(ROOT, rel), 'utf8');
    assert.ok(
      content.includes('<Checkbox'),
      `${rel} must render a Checkbox`
    );
    assert.ok(
      content.includes('closingPrayerSameAsSpeaker') || content.includes('form.closingPrayerSameAsSpeaker'),
      `${rel} must display closingPrayerSameAsSpeaker label`
    );
  }
});

test('buildFieldsPayload and fieldsFromParsed roundtrip for familyName and youthName', () => {
  const fields = {
    songSets: {},
    verseReference: '',
    verseText: '',
    verseTranslation: '',
    sermonSpeaker: '',
    specialSong: '',
    closingPrayerPerson: '',
    familyPrayerRequest: 'Prayer for family',
    youthPrayerRequest: 'Prayer for youth',
    familyName: '  The Smiths  ',
    youthName: '  John Smith  ',
  };

  const payload = buildFieldsPayload(fields);
  assert.equal(payload.familyName, 'The Smiths');
  assert.equal(payload.youthName, 'John Smith');

  const emptyFields = {
    ...fields,
    familyName: '   ',
    youthName: '',
  };
  const emptyPayload = buildFieldsPayload(emptyFields);
  assert.equal(emptyPayload.familyName, null);
  assert.equal(emptyPayload.youthName, null);
});
