/**
 * @file index.js — Re-exports all SC check functions
 */

const { checkAudioControl } = require('./sc-1.4.2');
const { checkKeyboardAccessible } = require('./sc-2.1.1');
const { checkNoKeyboardTrap } = require('./sc-2.1.2');
const { checkPauseStopHide } = require('./sc-2.2.2');
const { checkBypassBlocks } = require('./sc-2.4.1');
const { checkFocusOrder } = require('./sc-2.4.3');
const { checkFocusVisible, getFocusVisualDiffScore } = require('./sc-2.4.7');
const { checkFocusObscuredCombined } = require('./sc-2.4.11');
const { checkPointerGestures, checkPointerCancellation, checkMotionActuation, checkConcurrentInputMechanisms } = require('./sc-2.5.x');
const { checkConsistentNavigation, checkConsistentIdentification, checkConsistentHelp } = require('./sc-3.2.x');
const { checkAccessibilityTreeNameRoleValue, checkFrameworkAdapterScenarios } = require('./sc-4.1.2');
const {
  checkInteractiveComponentScenarios,
  checkModalInteractionScenario,
  checkMenuInteractionScenario,
  checkTabsInteractionScenario,
  checkDisclosureInteractionScenario,
  checkCarouselInteractionScenario,
  checkDragDropKeyboardAlternativeScenario
} = require('./sc-interactive');

module.exports = {
  // SC 1.4.2
  checkAudioControl,
  // SC 2.1.1
  checkKeyboardAccessible,
  // SC 2.1.2
  checkNoKeyboardTrap,
  // SC 2.2.2
  checkPauseStopHide,
  // SC 2.4.1
  checkBypassBlocks,
  // SC 2.4.3
  checkFocusOrder,
  // SC 2.4.7
  checkFocusVisible,
  getFocusVisualDiffScore,
  // SC 2.4.11 + 2.4.12
  checkFocusObscuredCombined,
  // SC 2.5.x
  checkPointerGestures,
  checkPointerCancellation,
  checkMotionActuation,
  checkConcurrentInputMechanisms,
  // SC 3.2.x
  checkConsistentNavigation,
  checkConsistentIdentification,
  checkConsistentHelp,
  // SC 4.1.2
  checkAccessibilityTreeNameRoleValue,
  checkFrameworkAdapterScenarios,
  // Interactive components (mixed SCs)
  checkInteractiveComponentScenarios,
  checkModalInteractionScenario,
  checkMenuInteractionScenario,
  checkTabsInteractionScenario,
  checkDisclosureInteractionScenario,
  checkCarouselInteractionScenario,
  checkDragDropKeyboardAlternativeScenario
};
