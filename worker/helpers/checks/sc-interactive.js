const { buildIssue, pause } = require('./shared');

async function checkInteractiveComponentScenarios(page, options) {
  const issues = [];
  issues.push(...await checkModalInteractionScenario(page, options));
  issues.push(...await checkMenuInteractionScenario(page, options));
  issues.push(...await checkTabsInteractionScenario(page, options));
  issues.push(...await checkDisclosureInteractionScenario(page, options));
  issues.push(...await checkCarouselInteractionScenario(page, options));
  issues.push(...await checkDragDropKeyboardAlternativeScenario(page, options));
  return issues;
}

async function checkModalInteractionScenario(page, options) {
  const maxChecks = Math.max(1, Number(options.maxComponentChecks) || 8);
  const candidates = await page.evaluate((limit) => {
    const isVisible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const buildSelector = (el) => {
      if (!el || !el.tagName) return null;
      if (el.id) return `#${CSS.escape(el.id)}`;
      const parts = [];
      let node = el;
      while (node && node.tagName && parts.length < 4) {
        let part = node.tagName.toLowerCase();
        if (node.classList && node.classList.length > 0) {
          const classes = Array.from(node.classList).slice(0, 2).map((c) => CSS.escape(c));
          if (classes.length) part += `.${classes.join('.')}`;
        }
        const parent = node.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter((s) => s.tagName === node.tagName);
          if (siblings.length > 1) {
            part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
          }
        }
        parts.unshift(part);
        node = node.parentElement;
      }
      return parts.join(' > ');
    };

    const nodes = Array.from(document.querySelectorAll(
      '[aria-haspopup="dialog"], [data-bs-toggle="modal"], [data-modal-target], [data-dialog-target], [aria-controls]'
    ));
    const dialogIds = new Set(
      Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog, [aria-modal="true"]'))
        .map((el) => el.id)
        .filter(Boolean)
    );
    const results = [];
    nodes.forEach((el) => {
      if (!isVisible(el)) return;
      const controls = (el.getAttribute('aria-controls') || '').trim();
      const hasDialogHint = el.getAttribute('aria-haspopup') === 'dialog'
        || el.hasAttribute('data-bs-toggle')
        || el.hasAttribute('data-modal-target')
        || el.hasAttribute('data-dialog-target')
        || (controls && dialogIds.has(controls));
      if (!hasDialogHint) return;
      results.push({
        selector: buildSelector(el) || el.tagName.toLowerCase(),
        controls: controls || null,
        html: el.outerHTML ? el.outerHTML.slice(0, 300) : null
      });
    });
    return results.slice(0, limit);
  }, maxChecks);

  if (!candidates.length) return [];

  const issues = [];
  for (const candidate of candidates) {
    try {
      const selector = candidate.selector;
      const pre = await page.evaluate((sel, controlledId) => {
        const trigger = sel ? document.querySelector(sel) : null;
        const allDialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog, [aria-modal="true"]'));
        const visibleDialogs = allDialogs.filter((el) => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        });
        const controlled = controlledId ? document.getElementById(controlledId) : null;
        return {
          hasTrigger: !!trigger,
          visibleDialogCount: visibleDialogs.length,
          controlledVisible: !!controlled && (() => {
            const style = window.getComputedStyle(controlled);
            const rect = controlled.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          })()
        };
      }, selector, candidate.controls);

      if (!pre.hasTrigger) continue;

      await page.focus(selector);
      await page.keyboard.press('Enter');
      await pause(120);

      let opened = await page.evaluate((controlledId, previousCount) => {
        const visibleDialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog, [aria-modal="true"]')).filter((el) => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        });
        const controlled = controlledId ? document.getElementById(controlledId) : null;
        const controlledVisible = !!controlled && (() => {
          const style = window.getComputedStyle(controlled);
          const rect = controlled.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        })();
        return controlledVisible || visibleDialogs.length > previousCount;
      }, candidate.controls, pre.visibleDialogCount);

      if (!opened) {
        await page.keyboard.press('Space');
        await pause(120);
        opened = await page.evaluate((controlledId, previousCount) => {
          const visibleDialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog, [aria-modal="true"]')).filter((el) => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          });
          const controlled = controlledId ? document.getElementById(controlledId) : null;
          const controlledVisible = !!controlled && (() => {
            const style = window.getComputedStyle(controlled);
            const rect = controlled.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          })();
          return controlledVisible || visibleDialogs.length > previousCount;
        }, candidate.controls, pre.visibleDialogCount);
      }

      if (!opened) continue;

      const focusState = await page.evaluate((sel, controlledId) => {
        const trigger = sel ? document.querySelector(sel) : null;
        const active = document.activeElement;
        const visibleDialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog, [aria-modal="true"]')).filter((el) => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        });
        const controlled = controlledId ? document.getElementById(controlledId) : null;
        const openDialog = (controlled && visibleDialogs.includes(controlled)) ? controlled : (visibleDialogs[0] || null);
        const focusInsideDialog = !!(openDialog && active && openDialog.contains(active));
        const buildSelector = (el) => {
          if (!el || !el.tagName) return null;
          if (el.id) return `#${CSS.escape(el.id)}`;
          return el.tagName.toLowerCase();
        };
        return {
          focusInsideDialog,
          activeSelector: buildSelector(active),
          activeHtml: active && active.outerHTML ? active.outerHTML.slice(0, 300) : null,
          triggerHtml: trigger && trigger.outerHTML ? trigger.outerHTML.slice(0, 300) : null
        };
      }, selector, candidate.controls);

      if (!focusState.focusInsideDialog) {
        issues.push(buildIssue({
          impact: 'serious',
          ruleId: 'wcag-2.4.3',
          message: 'Dialog opened but focus did not move into it',
          description: 'When a modal opens, keyboard focus should move into the dialog.',
          selector,
          html: candidate.html,
          tags: ['wcag2a', 'wcag243'],
          confidence: 0.8,
          needsReview: false,
          evidence: [`Active element after open: ${focusState.activeSelector || 'none'}`]
        }));
      }

      await page.keyboard.press('Escape');
      await pause(120);

      const closeState = await page.evaluate((sel, previousCount, controlledId) => {
        const trigger = sel ? document.querySelector(sel) : null;
        const active = document.activeElement;
        const visibleDialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog, [aria-modal="true"]')).filter((el) => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        });
        const controlled = controlledId ? document.getElementById(controlledId) : null;
        const controlledStillVisible = !!controlled && (() => {
          const style = window.getComputedStyle(controlled);
          const rect = controlled.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        })();
        return {
          dialogClosed: !controlledStillVisible && visibleDialogs.length <= previousCount,
          focusRestored: !!(trigger && active && (trigger === active || trigger.contains(active)))
        };
      }, selector, pre.visibleDialogCount, candidate.controls);

      if (!closeState.dialogClosed) {
        issues.push(buildIssue({
          impact: 'serious',
          ruleId: 'wcag-2.1.2',
          message: 'Dialog did not close on Escape',
          description: 'Keyboard users should be able to dismiss modal dialogs with Escape when supported by the UI pattern.',
          selector,
          html: candidate.html,
          tags: ['wcag2a', 'wcag212'],
          confidence: 0.7,
          needsReview: true
        }));
      }

      if (closeState.dialogClosed && !closeState.focusRestored) {
        issues.push(buildIssue({
          impact: 'moderate',
          ruleId: 'wcag-2.4.3',
          message: 'Focus was not restored to dialog trigger after close',
          description: 'After closing a dialog, focus should generally return to the trigger control.',
          selector,
          html: candidate.html,
          tags: ['wcag2a', 'wcag243'],
          confidence: 0.65,
          needsReview: true
        }));
      }
    } catch (err) {
      console.warn('[ablelytics-core] modal interaction scenario failed:', err && err.message ? err.message : err);
    }
  }

  return issues;
}

async function checkMenuInteractionScenario(page, options) {
  const maxChecks = Math.max(1, Number(options.maxComponentChecks) || 8);
  const candidates = await page.evaluate((limit) => {
    const isVisible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const buildSelector = (el) => {
      if (!el || !el.tagName) return null;
      if (el.id) return `#${CSS.escape(el.id)}`;
      const parts = [];
      let node = el;
      while (node && node.tagName && parts.length < 4) {
        let part = node.tagName.toLowerCase();
        if (node.classList && node.classList.length > 0) {
          const classes = Array.from(node.classList).slice(0, 2).map((c) => CSS.escape(c));
          if (classes.length) part += `.${classes.join('.')}`;
        }
        const parent = node.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter((s) => s.tagName === node.tagName);
          if (siblings.length > 1) {
            part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
          }
        }
        parts.unshift(part);
        node = node.parentElement;
      }
      return parts.join(' > ');
    };
    const nodes = Array.from(document.querySelectorAll('[aria-haspopup="menu"], [aria-controls][aria-expanded], button[aria-expanded], [role="button"][aria-expanded]'));
    const results = [];
    nodes.forEach((el) => {
      if (!isVisible(el)) return;
      results.push({
        selector: buildSelector(el) || el.tagName.toLowerCase(),
        controls: (el.getAttribute('aria-controls') || '').trim() || null,
        html: el.outerHTML ? el.outerHTML.slice(0, 300) : null
      });
    });
    return results.slice(0, limit);
  }, maxChecks);

  if (!candidates.length) return [];

  const issues = [];
  for (const candidate of candidates) {
    try {
      const selector = candidate.selector;
      await page.focus(selector);

      const pre = await page.evaluate((sel, controlledId) => {
        const trigger = sel ? document.querySelector(sel) : null;
        const controlled = controlledId ? document.getElementById(controlledId) : null;
        const expanded = trigger ? trigger.getAttribute('aria-expanded') : null;
        const menuVisible = !!controlled && (() => {
          const style = window.getComputedStyle(controlled);
          const rect = controlled.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        })();
        return {
          expanded,
          menuVisible,
          hasControlledMenuRole: !!(controlled && controlled.getAttribute('role') === 'menu')
        };
      }, selector, candidate.controls);

      await page.keyboard.press('Enter');
      await pause(100);

      let opened = await page.evaluate((sel, controlledId, preExpanded, preVisible) => {
        const trigger = sel ? document.querySelector(sel) : null;
        const controlled = controlledId ? document.getElementById(controlledId) : null;
        const expanded = trigger ? trigger.getAttribute('aria-expanded') : null;
        const menuVisible = !!controlled && (() => {
          const style = window.getComputedStyle(controlled);
          const rect = controlled.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        })();
        return expanded === 'true' || (menuVisible && !preVisible) || (preExpanded !== 'true' && expanded === 'true');
      }, selector, candidate.controls, pre.expanded, pre.menuVisible);

      if (!opened) {
        await page.keyboard.press('Space');
        await pause(100);
        opened = await page.evaluate((sel, controlledId) => {
          const trigger = sel ? document.querySelector(sel) : null;
          const controlled = controlledId ? document.getElementById(controlledId) : null;
          const expanded = trigger ? trigger.getAttribute('aria-expanded') : null;
          const menuVisible = !!controlled && (() => {
            const style = window.getComputedStyle(controlled);
            const rect = controlled.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          })();
          return expanded === 'true' || menuVisible;
        }, selector, candidate.controls);
      }

      if (!opened) continue;

      if (candidate.controls && !pre.hasControlledMenuRole) {
        issues.push(buildIssue({
          impact: 'moderate',
          ruleId: 'wcag-4.1.2',
          message: 'Menu trigger aria-controls does not reference a role="menu" element',
          description: 'Menu triggers should reference the controlled menu element with correct role/state semantics.',
          selector,
          html: candidate.html,
          tags: ['wcag2a', 'wcag412'],
          confidence: 0.7,
          needsReview: true
        }));
      }

      await page.keyboard.press('ArrowDown');
      await pause(80);
      const navState = await page.evaluate((sel, controlledId) => {
        const trigger = sel ? document.querySelector(sel) : null;
        const controlled = controlledId ? document.getElementById(controlledId) : null;
        const active = document.activeElement;
        const menuItemFocused = !!(active && (
          active.getAttribute('role') === 'menuitem'
          || active.getAttribute('role') === 'menuitemcheckbox'
          || active.getAttribute('role') === 'menuitemradio'
          || (controlled && controlled.contains(active) && active !== trigger)
        ));
        return { menuItemFocused };
      }, selector, candidate.controls);

      if (!navState.menuItemFocused) {
        issues.push(buildIssue({
          impact: 'moderate',
          ruleId: 'wcag-2.1.1',
          message: 'Menu opened but keyboard navigation did not move focus to an item',
          description: 'After opening a menu, keyboard navigation should allow moving to actionable menu items.',
          selector,
          html: candidate.html,
          tags: ['wcag2a', 'wcag211'],
          confidence: 0.6,
          needsReview: true
        }));
      }

      await page.keyboard.press('Escape');
      await pause(100);
      const closeState = await page.evaluate((sel, controlledId) => {
        const trigger = sel ? document.querySelector(sel) : null;
        const controlled = controlledId ? document.getElementById(controlledId) : null;
        const active = document.activeElement;
        const expanded = trigger ? trigger.getAttribute('aria-expanded') : null;
        const menuVisible = !!controlled && (() => {
          const style = window.getComputedStyle(controlled);
          const rect = controlled.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        })();
        return {
          collapsed: expanded !== 'true' && !menuVisible,
          expandedStateAfterClose: expanded,
          focusRestored: !!(trigger && active && (trigger === active || trigger.contains(active)))
        };
      }, selector, candidate.controls);

      if (!closeState.collapsed) {
        issues.push(buildIssue({
          impact: 'moderate',
          ruleId: 'wcag-2.1.1',
          message: 'Menu did not collapse on Escape',
          description: 'Keyboard users should be able to dismiss an open menu with Escape.',
          selector,
          html: candidate.html,
          tags: ['wcag2a', 'wcag211'],
          confidence: 0.65,
          needsReview: true
        }));
      }

      if (closeState.collapsed && !closeState.focusRestored) {
        issues.push(buildIssue({
          impact: 'moderate',
          ruleId: 'wcag-2.4.3',
          message: 'Focus was not restored to menu trigger after close',
          description: 'After closing a menu, focus should return to the control that opened it.',
          selector,
          html: candidate.html,
          tags: ['wcag2a', 'wcag243'],
          confidence: 0.6,
          needsReview: true
        }));
      }

      if (closeState.expandedStateAfterClose === 'true') {
        issues.push(buildIssue({
          impact: 'moderate',
          ruleId: 'wcag-4.1.2',
          message: 'Menu aria-expanded state did not synchronize after close',
          description: 'Menu trigger should set aria-expanded to false when menu is closed.',
          selector,
          html: candidate.html,
          tags: ['wcag2a', 'wcag412'],
          confidence: 0.75,
          needsReview: true
        }));
      }
    } catch (err) {
      console.warn('[ablelytics-core] menu interaction scenario failed:', err && err.message ? err.message : err);
    }
  }

  return issues;
}

async function checkTabsInteractionScenario(page, options) {
  const maxChecks = Math.max(1, Number(options.maxComponentChecks) || 8);
  const candidates = await page.evaluate((limit) => {
    const isVisible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const buildSelector = (el) => {
      if (!el || !el.tagName) return null;
      if (el.id) return `#${CSS.escape(el.id)}`;
      const parts = [];
      let node = el;
      while (node && node.tagName && parts.length < 4) {
        let part = node.tagName.toLowerCase();
        if (node.classList && node.classList.length > 0) {
          const classes = Array.from(node.classList).slice(0, 2).map((c) => CSS.escape(c));
          if (classes.length) part += `.${classes.join('.')}`;
        }
        parts.unshift(part);
        node = node.parentElement;
      }
      return parts.join(' > ');
    };
    const tablists = Array.from(document.querySelectorAll('[role="tablist"]'));
    return tablists.map((tablist) => {
      const tabs = Array.from(tablist.querySelectorAll('[role="tab"]')).filter(isVisible);
      if (tabs.length < 2) return null;
      return {
        tablistSelector: buildSelector(tablist) || '[role="tablist"]',
        firstTabSelector: buildSelector(tabs[0]) || '[role="tab"]',
        html: tablist.outerHTML ? tablist.outerHTML.slice(0, 300) : null
      };
    }).filter(Boolean).slice(0, limit);
  }, maxChecks);

  if (!candidates.length) return [];

  const issues = [];
  for (const candidate of candidates) {
    try {
      await page.focus(candidate.firstTabSelector);
      const before = await page.evaluate((tabSelector) => {
        const active = document.activeElement;
        const activeId = active && active.id ? active.id : null;
        const selectedTabs = Array.from(document.querySelectorAll('[role="tab"][aria-selected="true"]'));
        const selectedTab = selectedTabs[0] || null;
        return {
          activeId,
          selectedId: selectedTab && selectedTab.id ? selectedTab.id : null,
          selectedCount: selectedTabs.length
        };
      }, candidate.firstTabSelector);

      await page.keyboard.press('ArrowRight');
      await pause(100);

      const after = await page.evaluate(() => {
        const active = document.activeElement;
        const activeRole = active ? active.getAttribute('role') : null;
        const selectedTabs = Array.from(document.querySelectorAll('[role="tab"][aria-selected="true"]'));
        const selectedTab = selectedTabs[0] || null;
        const controls = selectedTab ? selectedTab.getAttribute('aria-controls') : null;
        const panel = controls ? document.getElementById(controls) : null;
        const panelVisible = !!panel && (() => {
          const style = window.getComputedStyle(panel);
          const rect = panel.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        })();
        return {
          activeId: active && active.id ? active.id : null,
          activeRole,
          selectedId: selectedTab && selectedTab.id ? selectedTab.id : null,
          selectedCount: selectedTabs.length,
          hasValidControls: !!(selectedTab && controls && panel),
          panelVisible
        };
      });

      const moved = (after.activeId && before.activeId && after.activeId !== before.activeId)
        || (after.selectedId && before.selectedId && after.selectedId !== before.selectedId)
        || after.activeRole === 'tab';

      if (!moved) {
        issues.push(buildIssue({
          impact: 'moderate',
          ruleId: 'wcag-2.1.1',
          message: 'Tabs may not support keyboard arrow navigation',
          description: 'Tab interfaces should allow keyboard users to move between tabs with arrow keys.',
          selector: candidate.tablistSelector,
          html: candidate.html,
          tags: ['wcag2a', 'wcag211'],
          confidence: 0.65,
          needsReview: true
        }));
      }

      if (moved && !after.panelVisible) {
        issues.push(buildIssue({
          impact: 'moderate',
          ruleId: 'wcag-4.1.2',
          message: 'Selected tab did not expose a visible tab panel',
          description: 'Tab selection should update and reveal the associated tab panel.',
          selector: candidate.tablistSelector,
          html: candidate.html,
          tags: ['wcag2a', 'wcag412'],
          confidence: 0.55,
          needsReview: true
        }));
      }

      if (after.selectedCount !== 1 || !after.hasValidControls) {
        issues.push(buildIssue({
          impact: 'moderate',
          ruleId: 'wcag-4.1.2',
          message: 'Tab role/state relationship appears inconsistent',
          description: 'Exactly one tab should be aria-selected=true and it should reference a valid panel via aria-controls.',
          selector: candidate.tablistSelector,
          html: candidate.html,
          tags: ['wcag2a', 'wcag412'],
          confidence: 0.75,
          needsReview: true
        }));
      }
    } catch (err) {
      console.warn('[ablelytics-core] tabs interaction scenario failed:', err && err.message ? err.message : err);
    }
  }

  return issues;
}

async function checkDisclosureInteractionScenario(page, options) {
  const maxChecks = Math.max(1, Number(options.maxComponentChecks) || 8);
  const candidates = await page.evaluate((limit) => {
    const isVisible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const buildSelector = (el) => {
      if (!el || !el.tagName) return null;
      if (el.id) return `#${CSS.escape(el.id)}`;
      const parts = [];
      let node = el;
      while (node && node.tagName && parts.length < 4) {
        let part = node.tagName.toLowerCase();
        if (node.classList && node.classList.length > 0) {
          const classes = Array.from(node.classList).slice(0, 2).map((c) => CSS.escape(c));
          if (classes.length) part += `.${classes.join('.')}`;
        }
        parts.unshift(part);
        node = node.parentElement;
      }
      return parts.join(' > ');
    };
    const triggers = Array.from(document.querySelectorAll('button[aria-expanded], [role="button"][aria-expanded]'))
      .filter((el) => isVisible(el) && !!el.getAttribute('aria-controls'));
    return triggers.slice(0, limit).map((el) => ({
      selector: buildSelector(el) || 'button[aria-expanded]',
      controls: el.getAttribute('aria-controls'),
      html: el.outerHTML ? el.outerHTML.slice(0, 300) : null
    }));
  }, maxChecks);

  if (!candidates.length) return [];

  const issues = [];
  for (const candidate of candidates) {
    try {
      await page.focus(candidate.selector);
      const before = await page.evaluate((sel, controlledId) => {
        const trigger = sel ? document.querySelector(sel) : null;
        const panel = controlledId ? document.getElementById(controlledId) : null;
        const expanded = trigger ? trigger.getAttribute('aria-expanded') : null;
        const panelVisible = !!panel && (() => {
          const style = window.getComputedStyle(panel);
          const rect = panel.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        })();
        return { expanded, panelVisible };
      }, candidate.selector, candidate.controls);

      await page.keyboard.press('Enter');
      await pause(90);

      const afterEnter = await page.evaluate((sel, controlledId) => {
        const trigger = sel ? document.querySelector(sel) : null;
        const panel = controlledId ? document.getElementById(controlledId) : null;
        const expanded = trigger ? trigger.getAttribute('aria-expanded') : null;
        const panelVisible = !!panel && (() => {
          const style = window.getComputedStyle(panel);
          const rect = panel.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        })();
        return { expanded, panelVisible };
      }, candidate.selector, candidate.controls);

      const toggled = before.expanded !== afterEnter.expanded || before.panelVisible !== afterEnter.panelVisible;
      if (!toggled) {
        await page.keyboard.press('Space');
        await pause(90);
      }

      const afterSpace = await page.evaluate((sel, controlledId) => {
        const trigger = sel ? document.querySelector(sel) : null;
        const panel = controlledId ? document.getElementById(controlledId) : null;
        const expanded = trigger ? trigger.getAttribute('aria-expanded') : null;
        const panelVisible = !!panel && (() => {
          const style = window.getComputedStyle(panel);
          const rect = panel.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        })();
        return { expanded, panelVisible };
      }, candidate.selector, candidate.controls);

      const finallyToggled = toggled || before.expanded !== afterSpace.expanded || before.panelVisible !== afterSpace.panelVisible;
      if (!finallyToggled) {
        issues.push(buildIssue({
          impact: 'moderate',
          ruleId: 'wcag-2.1.1',
          message: 'Disclosure/accordion control may not be keyboard operable',
          description: 'Controls using aria-expanded should toggle state via keyboard (Enter/Space).',
          selector: candidate.selector,
          html: candidate.html,
          tags: ['wcag2a', 'wcag211'],
          confidence: 0.7,
          needsReview: true
        }));
      }
    } catch (err) {
      console.warn('[ablelytics-core] disclosure interaction scenario failed:', err && err.message ? err.message : err);
    }
  }

  return issues;
}

async function checkCarouselInteractionScenario(page, options) {
  const maxChecks = Math.max(1, Number(options.maxComponentChecks) || 8);
  const candidates = await page.evaluate((limit) => {
    const isVisible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const buildSelector = (el) => {
      if (!el || !el.tagName) return null;
      if (el.id) return `#${CSS.escape(el.id)}`;
      const parts = [];
      let node = el;
      while (node && node.tagName && parts.length < 4) {
        let part = node.tagName.toLowerCase();
        if (node.classList && node.classList.length > 0) {
          const classes = Array.from(node.classList).slice(0, 2).map((c) => CSS.escape(c));
          if (classes.length) part += `.${classes.join('.')}`;
        }
        parts.unshift(part);
        node = node.parentElement;
      }
      return parts.join(' > ');
    };

    const roots = Array.from(document.querySelectorAll('[aria-roledescription*="carousel" i], [data-carousel], .carousel'));
    const results = [];
    roots.forEach((root) => {
      if (!isVisible(root)) return;
      const nextButton = root.querySelector(
        '[aria-label*="next" i], [title*="next" i], [data-slide="next"], [data-carousel-next], .next, .carousel-control-next'
      );
      if (!nextButton || !isVisible(nextButton)) return;
      const slides = Array.from(root.querySelectorAll(
        '[role="group"], [aria-roledescription*="slide" i], .slide, .carousel-item'
      )).filter(isVisible);
      if (slides.length < 2) return;
      results.push({
        rootSelector: buildSelector(root) || '.carousel',
        nextSelector: buildSelector(nextButton) || 'button',
        html: root.outerHTML ? root.outerHTML.slice(0, 300) : null
      });
    });
    return results.slice(0, limit);
  }, maxChecks);

  if (!candidates.length) return [];

  const issues = [];
  for (const candidate of candidates) {
    try {
      const getSnapshot = async () => page.evaluate((rootSel) => {
        const root = rootSel ? document.querySelector(rootSel) : null;
        if (!root) return { activeIndex: -1, activeMarker: null };
        const items = Array.from(root.querySelectorAll('[role="group"], [aria-roledescription*="slide" i], .slide, .carousel-item'));
        if (!items.length) return { activeIndex: -1, activeMarker: null };
        const indexFromPredicate = (predicate) => items.findIndex(predicate);
        const activeByCurrent = indexFromPredicate((el) => el.getAttribute('aria-current') === 'true');
        const activeByClass = indexFromPredicate((el) => el.classList.contains('active') || el.classList.contains('is-active'));
        const activeByHidden = indexFromPredicate((el) => el.getAttribute('aria-hidden') === 'false');
        const activeIndex = activeByCurrent >= 0 ? activeByCurrent : (activeByClass >= 0 ? activeByClass : activeByHidden);
        const activeMarker = activeIndex >= 0 ? (items[activeIndex].id || items[activeIndex].textContent || '').slice(0, 80) : null;
        return { activeIndex, activeMarker };
      }, candidate.rootSelector);

      const before = await getSnapshot();
      await page.focus(candidate.nextSelector);
      await page.keyboard.press('Enter');
      await pause(120);
      const afterEnter = await getSnapshot();
      let changed = (before.activeIndex >= 0 && afterEnter.activeIndex >= 0 && before.activeIndex !== afterEnter.activeIndex)
        || (before.activeMarker && afterEnter.activeMarker && before.activeMarker !== afterEnter.activeMarker);

      if (!changed) {
        await page.keyboard.press('Space');
        await pause(120);
        const afterSpace = await getSnapshot();
        changed = (before.activeIndex >= 0 && afterSpace.activeIndex >= 0 && before.activeIndex !== afterSpace.activeIndex)
          || (before.activeMarker && afterSpace.activeMarker && before.activeMarker !== afterSpace.activeMarker);
      }

      if (!changed) {
        issues.push(buildIssue({
          impact: 'moderate',
          ruleId: 'wcag-2.1.1',
          message: 'Carousel next control may not be keyboard operable',
          description: 'Using Enter/Space on the carousel next control did not change slide state.',
          selector: candidate.nextSelector,
          html: candidate.html,
          tags: ['wcag2a', 'wcag211'],
          confidence: 0.6,
          needsReview: true
        }));
      }
    } catch (err) {
      console.warn('[ablelytics-core] carousel interaction scenario failed:', err && err.message ? err.message : err);
    }
  }

  return issues;
}

async function checkDragDropKeyboardAlternativeScenario(page, options) {
  const maxChecks = Math.max(1, Number(options.maxComponentChecks) || 8);
  const findings = await page.evaluate((limit) => {
    const isVisible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const buildSelector = (el) => {
      if (!el || !el.tagName) return null;
      if (el.id) return `#${CSS.escape(el.id)}`;
      const parts = [];
      let node = el;
      while (node && node.tagName && parts.length < 4) {
        let part = node.tagName.toLowerCase();
        if (node.classList && node.classList.length > 0) {
          const classes = Array.from(node.classList).slice(0, 2).map((c) => CSS.escape(c));
          if (classes.length) part += `.${classes.join('.')}`;
        }
        parts.unshift(part);
        node = node.parentElement;
      }
      return parts.join(' > ');
    };
    const draggableItems = Array.from(document.querySelectorAll('[draggable="true"]')).filter(isVisible).slice(0, limit);
    const results = [];
    draggableItems.forEach((el) => {
      const region = el.closest('[role="list"], [role="listbox"], [role="grid"], [role="tree"], [data-sortable], [class*="drag"], [class*="sortable"]') || el.parentElement;
      const text = ((region && region.textContent) || '').toLowerCase();
      const hasMoveButtons = !!(region && region.querySelector(
        'button[aria-label*="move" i], button[title*="move" i], button[aria-label*="up" i], button[aria-label*="down" i], [data-action*="move"]'
      ));
      const hasKeyboardHint = /\b(use keyboard|press (arrow|space|enter)|move up|move down)\b/i.test(text);
      const hasFocusable = el.tabIndex >= 0 || el.matches('button, a[href], input, select, textarea, [role="button"]');
      results.push({
        selector: buildSelector(el) || '[draggable="true"]',
        html: el.outerHTML ? el.outerHTML.slice(0, 300) : null,
        hasMoveButtons,
        hasKeyboardHint,
        hasFocusable,
        regionSelector: region ? buildSelector(region) : null
      });
    });
    return results;
  }, maxChecks);

  if (!findings.length) return [];

  const issues = [];
  for (const item of findings) {
    let keyboardInteractionChangedState = false;
    try {
      await page.focus(item.selector);
      const before = await page.evaluate((sel, regionSel) => {
        const el = sel ? document.querySelector(sel) : null;
        const region = regionSel ? document.querySelector(regionSel) : (el ? el.parentElement : null);
        if (!el || !region) return { idx: -1, ariaGrabbed: null, liveText: '' };
        const items = Array.from(region.querySelectorAll('[draggable="true"]'));
        const idx = items.indexOf(el);
        const live = region.querySelector('[aria-live]');
        return {
          idx,
          ariaGrabbed: el.getAttribute('aria-grabbed'),
          liveText: live ? (live.textContent || '').trim().slice(0, 120) : ''
        };
      }, item.selector, item.regionSelector);

      await page.keyboard.press('Space');
      await pause(80);
      await page.keyboard.press('ArrowDown');
      await pause(80);
      await page.keyboard.press('ArrowUp');
      await pause(80);
      await page.keyboard.press('Space');
      await pause(80);

      const after = await page.evaluate((sel, regionSel) => {
        const el = sel ? document.querySelector(sel) : null;
        const region = regionSel ? document.querySelector(regionSel) : (el ? el.parentElement : null);
        if (!el || !region) return { idx: -1, ariaGrabbed: null, liveText: '' };
        const items = Array.from(region.querySelectorAll('[draggable="true"]'));
        const idx = items.indexOf(el);
        const live = region.querySelector('[aria-live]');
        return {
          idx,
          ariaGrabbed: el.getAttribute('aria-grabbed'),
          liveText: live ? (live.textContent || '').trim().slice(0, 120) : ''
        };
      }, item.selector, item.regionSelector);

      keyboardInteractionChangedState = (
        (before.idx >= 0 && after.idx >= 0 && before.idx !== after.idx)
        || before.ariaGrabbed !== after.ariaGrabbed
        || before.liveText !== after.liveText
      );
    } catch (err) {
      keyboardInteractionChangedState = false;
    }

    const hasAlternative = item.hasMoveButtons || item.hasKeyboardHint;
    if (!item.hasFocusable && !hasAlternative && !keyboardInteractionChangedState) {
      issues.push(buildIssue({
        impact: 'serious',
        ruleId: 'wcag-2.5.7',
        message: 'Drag interaction detected without obvious keyboard alternative',
        description: 'Draggable item is not keyboard focusable and no keyboard move controls/hints were detected.',
        selector: item.selector,
        html: item.html,
        tags: ['wcag2aa', 'wcag257'],
        confidence: 0.75,
        needsReview: true
      }));
      continue;
    }
    if (!hasAlternative && !keyboardInteractionChangedState) {
      issues.push(buildIssue({
        impact: 'moderate',
        ruleId: 'wcag-2.5.7',
        message: 'Drag interaction may lack keyboard alternative controls',
        description: 'Draggable item found, but explicit keyboard move controls or instructions were not detected.',
        selector: item.selector,
        html: item.html,
        tags: ['wcag2aa', 'wcag257'],
        confidence: 0.5,
        needsReview: true
      }));
    }
  }

  return issues;
}

module.exports = {
  checkInteractiveComponentScenarios,
  checkModalInteractionScenario,
  checkMenuInteractionScenario,
  checkTabsInteractionScenario,
  checkDisclosureInteractionScenario,
  checkCarouselInteractionScenario,
  checkDragDropKeyboardAlternativeScenario
};
