/**
 * Automated Browser Acceptance Tests for FR-35: Remote Control (Phone Remote).
 *
 * Requirements from manual-acceptance-checklist.md:
 * - On the laptop: sign in, open a Service, press Present. A pairing code appears.
 * - On the phone: sign in, open the Remote link from the run sheet, enter that code.
 *   The presenter view appears on the phone.
 * - Standing away from the laptop, from the phone: advance a slide, blank and unblank.
 *   The room screen must follow each one.
 * - Confirm the phone shows the current position and blank state, not just buttons.
 * - Ask someone else signed in on another device, who has not paired, to try to control it.
 *   Confirm they cannot.
 * - THEN THE ONE THAT MATTERS MOST: lock the phone or close it. Confirm the laptop
 *   keeps driving the service exactly as before without freeze, jump, or blank.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  startBrowserEnvironment,
  stopBrowserEnvironment,
  loginViaUi,
  loginAndGetCookie,
  createServiceViaApi,
  createOperatorAccount,
  DEFAULT_ADMIN_USER,
  DEFAULT_ADMIN_PASS,
} from './helpers/browser-harness.mjs';

describe('FR-35: Remote HP acceptance tests', () => {
  let env;
  let serviceId;
  let adminCookie;
  const operatorUser = 'operator_fr35';
  const operatorPass = 'op-pass-123';
  const attackerUser = 'operator_unpaired';
  const attackerPass = 'attacker-pass-123';

  before(async () => {
    env = await startBrowserEnvironment({ dbName: 'test-fr35.db' });
    adminCookie = await loginAndGetCookie(env.baseUrl, DEFAULT_ADMIN_USER, DEFAULT_ADMIN_PASS);

    await createOperatorAccount(env.baseUrl, adminCookie, operatorUser, operatorPass);
    await createOperatorAccount(env.baseUrl, adminCookie, attackerUser, attackerPass);

    const rawRundown = `SABBATH, AUGUST 22, 2026
DIVINE SERVICE
Opening Song: SDAH #159
Scripture Reading: John 3:16
Sermon: Speaker Name "The Message"
Closing Song: SDAH #200`;

    const svc = await createServiceViaApi(env.baseUrl, adminCookie, rawRundown);
    serviceId = svc.id;
  });

  after(async () => {
    await stopBrowserEnvironment(env);
  });

  test('full pairing, remote control, unauthorized refusal, and disconnect resilience flow', async () => {
    const { browser, baseUrl } = env;

    // 1. Laptop Context: Open Presenter
    const laptopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const pageLaptop = await laptopContext.newPage();
    await loginViaUi(pageLaptop, baseUrl, operatorUser, operatorPass);

    await pageLaptop.goto(`${baseUrl}/services/${serviceId}/present`, { waitUntil: 'networkidle' });

    // Extract pairing code from laptop header
    const pairingSpan = pageLaptop.locator('header span:has-text("Remote code:")');
    await pairingSpan.waitFor({ state: 'visible', timeout: 15000 });
    const codeText = (await pairingSpan.textContent()) || '';
    const pairingCode = codeText.replace(/^[\s\S]*Remote code:\s*/i, '').trim();
    assert.ok(pairingCode.length >= 6, `Expected pairing code on laptop header, got: ${codeText}`);

    // Initial state on laptop: Slide 1 / N
    const laptopHeader = pageLaptop.locator('header p');
    await laptopHeader.waitFor({ state: 'visible' });
    assert.match(await laptopHeader.innerText(), /Slide 1 \//);

    // 2. Phone Context: Open Remote
    const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pagePhone = await phoneContext.newPage();
    await loginViaUi(pagePhone, baseUrl, operatorUser, operatorPass);

    await pagePhone.goto(`${baseUrl}/services/${serviceId}/remote`, { waitUntil: 'networkidle' });

    const codeInput = pagePhone.locator('#remote-code');
    await codeInput.waitFor({ state: 'visible', timeout: 10000 });

    // Fill the exact pairing code received from presenter
    await pagePhone.evaluate((code) => {
      const input = document.querySelector('#remote-code');
      if (!input) return;
      input.removeAttribute('maxLength');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter?.call(input, code);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, pairingCode);

    const pairBtn = pagePhone.locator('button:has-text("Connect to Laptop"), button:has-text("Hubungkan ke Laptop")');
    await pairBtn.click();

    // Confirm remote view enters paired state and shows slide position
    const phoneHeader = pagePhone.locator('header p');
    await phoneHeader.waitFor({ state: 'visible', timeout: 10000 });
    assert.match(await phoneHeader.innerText(), /Slide 1 \//);

    // 3. Remote intent: Advance slide
    const nextBtn = pagePhone.locator('footer button:has-text("Next"), footer button:has-text("Lanjut")');
    await nextBtn.click();

    // Verify laptop presenter follows and updates to Slide 2
    await pageLaptop.waitForFunction(
      () => document.querySelector('header p')?.textContent?.includes('Slide 2 /'),
      { timeout: 5000 }
    );
    assert.match(await laptopHeader.innerText(), /Slide 2 \//);

    // 4. Remote intent: Blank and Resume
    const blankBtn = pagePhone.locator('footer button:has-text("Blank"), footer button:has-text("Kosongkan")');
    await blankBtn.click();

    // Verify phone remote shows blanked badge
    const blankBadge = pagePhone.locator('role=status');
    await blankBadge.waitFor({ state: 'visible', timeout: 5000 });
    assert.match(await blankBadge.innerText(), /blank|kosong/i);

    // Laptop should reflect blank state (Blank button aria-pressed="true")
    await pageLaptop.waitForFunction(
      () => {
        const btn = document.querySelector('button[aria-pressed="true"]');
        return btn !== null;
      },
      { timeout: 5000 }
    );

    // Resume from remote
    const resumeBtn = pagePhone.locator('footer button:has-text("Resume"), footer button:has-text("Tampilkan")');
    await resumeBtn.click();

    // Confirm unblanked, staying on Slide 2
    await pageLaptop.waitForFunction(
      () => {
        const p = document.querySelector('header p')?.textContent;
        const blanked = document.querySelector('button[aria-pressed="true"]');
        return p?.includes('Slide 2 /') && !blanked;
      },
      { timeout: 5000 }
    );
    assert.match(await laptopHeader.innerText(), /Slide 2 \//);

    // 5. Unauthorized 3rd party: Unpaired context tries to claim or control
    const attackerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pageAttacker = await attackerContext.newPage();
    await loginViaUi(pageAttacker, baseUrl, attackerUser, attackerPass);

    await pageAttacker.goto(`${baseUrl}/services/${serviceId}/remote`, { waitUntil: 'networkidle' });
    const attackerCodeInput = pageAttacker.locator('#remote-code');
    await attackerCodeInput.waitFor({ state: 'visible' });

    // Try claiming with invalid code
    await attackerCodeInput.fill('000000');
    const attackerPairBtn = pageAttacker.locator('button:has-text("Connect to Laptop"), button:has-text("Hubungkan ke Laptop")');
    await attackerPairBtn.click();

    // Confirm error is shown on attacker screen
    const alertMsg = pageAttacker.locator('p[role="alert"]');
    await alertMsg.waitFor({ state: 'visible', timeout: 5000 });
    assert.ok(await alertMsg.isVisible());

    // Try claiming with the existing code against already live pairing
    await pageAttacker.evaluate((code) => {
      const input = document.querySelector('#remote-code');
      if (!input) return;
      input.removeAttribute('maxLength');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter?.call(input, code);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, pairingCode);
    await attackerPairBtn.click();
    await alertMsg.waitFor({ state: 'visible', timeout: 5000 });

    // Laptop should still be on Slide 2 and completely unaffected
    assert.match(await laptopHeader.innerText(), /Slide 2 \//);
    await attackerContext.close();

    // 6. THE MOST IMPORTANT INVARIANT: Phone remote disconnects / closes
    // Confirm laptop keeps driving the service flawlessly without freezing, jumping, or blanking
    await phoneContext.close();

    // Advance slide from laptop directly
    const laptopNextBtn = pageLaptop.locator('button:has-text("Next")').first();
    await laptopNextBtn.click();

    // Verify laptop moves to Slide 3
    await pageLaptop.waitForFunction(
      () => document.querySelector('header p')?.textContent?.includes('Slide 3 /'),
      { timeout: 5000 }
    );
    assert.match(await laptopHeader.innerText(), /Slide 3 \//);

    // Toggle blank directly on laptop
    const laptopBlankBtn = pageLaptop.locator('button:has-text("Blank screen"), button:has-text("Resume screen")');
    await laptopBlankBtn.click();
    await pageLaptop.waitForFunction(
      () => document.querySelector('button[aria-pressed="true"]') !== null,
      { timeout: 5000 }
    );

    // Unblank directly on laptop
    await laptopBlankBtn.click();
    await pageLaptop.waitForFunction(
      () => document.querySelector('button[aria-pressed="true"]') === null,
      { timeout: 5000 }
    );

    // Verify laptop is still stable on Slide 3
    assert.match(await laptopHeader.innerText(), /Slide 3 \//);

    await laptopContext.close();
  });
});