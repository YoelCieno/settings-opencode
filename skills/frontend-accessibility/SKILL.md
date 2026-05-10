---
name: frontend-accessibility
description: Framework-agnostic accessibility audit and fix for common issues in frontend templates and components. Use when implementing accessibility features, fixing a11y issues, or after any development that changes UI structure.
---

# Frontend Accessibility (a11y)

## When To Activate

- After any development touching frontend templates/components, including a new feature, bug fix, or refactor
- After updating UI component libraries (Angular Material, Ant Design, Vuetify, etc.) markup, control structure, labels, dialogs, tables, forms, or navigation UI
- Fixing Lighthouse, axe, or ESLint accessibility findings
- Auditing frontend templates or component screens
- Debugging keyboard navigation, focus order, or screen reader output
- Refactoring interactive UI in frontend templates/components

## Default Post-Development Trigger

Run this skill as a final verification step whenever the implementation modified frontend templates or materially changed rendered UI structure, even if the original task did not mention accessibility.

Typical triggers:
- New feature that introduces or changes template markup
- Bug fix that changes form controls, buttons, tables, dialogs, drawers, or navigation
- Refactor that restructures conditionals, loops, landmarks, headings, or interactive elements
- UI component library replacement or reconfiguration affecting labels, focus, or keyboard behavior

## Hard Rules (Framework-Agnostic)

- Prefer semantic HTML first: native `<button>`, `<a>`, `<label>`, `<main>`, `<table>`, and `<th>` before ARIA workarounds
- Prefer visible labels before ARIA labels or labelledby
- Use ARIA to fill missing semantics, not to replace native semantics
- For native elements, bind ARIA with `[attr.aria-*]` or framework-equivalent syntax
- Do not add redundant roles to native controls (`role="button"` on `<button>`, `role="checkbox"` on `<input type="checkbox">`, etc.)
- All user-facing accessible text must be translated/i18n. Never hard-code text in templates
- After each fix, verify keyboard and focus behavior, not just lint output

## Audit Workflow

1. Run the accessibility check appropriate for your framework:
   - Angular: `npx eslint "src/app/**/*.html"`
   - React: `npm test --axe` or appropriate axe integration
   - Vue: `npm run test:unit --axe` or appropriate axe integration
   - Generic: Use axe DevTools or equivalent browser extension

2. Run an automated audit on the affected screen:
   - Lighthouse
   - axe DevTools or equivalent
   - Framework-specific accessibility testing tools

3. Perform a keyboard-only smoke test:
   - `Tab` / `Shift+Tab` reaches all interactive controls in a logical order
   - `Enter` / `Space` activates buttons, toggles, and checkboxes
   - `Escape` closes dialogs, menus, or drawers where applicable
   - Focus remains visible throughout the flow

4. Spot-check the changed flow with a screen reader (NVDA, JAWS, VoiceOver, etc.)

5. Fix issues systematically using the patterns below

6. Re-run lint and the automated audit on the affected screen

## Common Issues & Fixes (Adapt Syntax to Framework)

### 1. Icon-only buttons - missing accessible name

Any button/icon-only element whose only content is an icon has no accessible name.

**Framework-Agnostic Fix**: add an accessible name and mark the icon as decorative.

#### Angular (using Angular Material)
```html
<!-- ❌ Before -->
<button type="button" (click)="onClose()">
  <mat-icon>close</mat-icon>
</button>

<!-- ✅ After -->
<button
  type="button"
  [attr.aria-label]="'CLOSE_BUTTON_ARIA' | transloco"
  (click)="onClose()"
>
  <mat-icon aria-hidden="true">close</mat-icon>
</button>
```

#### React
```jsx
// ❌ Before
<button onClick={onClose}>
  <CloseIcon />
</button>

// ✅ After
<button
  onClick={onClose}
  aria-label={t('closeButtonAria')}
>
  <CloseIcon aria-hidden="true" />
</button>
```

#### Vue
```vue
<!-- ❌ Before -->
<button @click="onClose">
  <CloseIcon />
</button>

<!-- ✅ After -->
<button
  @click="onClose"
  :aria-label="$t('closeButtonAria')"
>
  <CloseIcon aria-hidden="true" />
</button>
```

### 2. Form controls - missing programmatic label

Prefer a visible label first. Use `aria-label` only when a visible label or `aria-labelledby` is not practical.

**Framework-Agnostic Fix**: Use framework-appropriate label association.

#### Angular
```html
<!-- ✅ Preferred in a regular form -->
<mat-form-field>
  <mat-label>{{ 'AMOUNT_LABEL' | transloco }}</mat-label>
  <input matInput id="amount" type="number" />
</mat-form-field>
```

#### React with plain HTML
```html
<label htmlFor="amount">{t('amountLabel')}</label>
<input id="amount" type="number" />
```

#### React with Material-UI
```jsx
<TextField
  label={t('amountLabel')}
  inputProps={{ id: 'amount' }}
  type="number"
/>
```

#### Vue
```vue
<label for="amount">{{ t('amountLabel') }}</label>
<input id="amount" type="number" />
```

### 3. Checkboxes without labels

Empty checkbox components with no projected text need an accessible name.

**Framework-Agnostic Fix**: Add aria-label or aria-labelledby.

#### Angular
```html
<!-- ✅ After - header (select-all) -->
<mat-checkbox
  [aria-label]="'SELECT_ALL_ARIA' | transloco"
  [checked]="allSelected()"
  (change)="onToggleAll($event.checked)"
/>
```

#### React
```jsx
<Checkbox
  checked={allSelected}
  onChange={handleToggleAll}
  aria-label={t('selectAllAria')}
/>
```

#### Vue
```vue
<checkbox
  v-model="allSelected"
  @change="onToggleAll"
  :aria-label="t('selectAllAria')"
/>
```

### 4. Non-semantic interactive elements

Clickable `<div>` and `<span>` elements break keyboard and assistive technology behavior.

**Framework-Agnostic Fix**: Replace them with native interactive elements.

```html
<!-- ❌ Before -->
<div class="close-action" @click="onClose">
  <icon-close />
</div>

<!-- ✅ After -->
<button
  class="close-action"
  [aria-label]="t('closeButtonAria')"
  @click="onClose"
>
  <icon-close aria-hidden="true" />
</button>
```

Use `<a>` for navigation and `<button>` for in-page actions.

### 5. Viewport blocks zoom

`maximum-scale` or `user-scalable=no` in the viewport meta tag prevents low-vision users from magnifying the page.

**Framework-Agnostic Fix** (in index.html): keep only `width=device-width, initial-scale=1.0`.

```html
<!-- ❌ Before -->
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
/>

<!-- ✅ After -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

### 6. Missing `<main>` landmark

Screen readers use landmarks to jump between page regions. A page must have exactly one `<main>` element.

**Framework-Agnostic Fix**: Ensure layout components use `<main>`.

```html
<!-- ✅ Mobile layout -->
<main class="main-container">
  <app-sub-header />
  <router-outlet />
</main>

<!-- ✅ Desktop layout -->
<main class="desktop-page-content">
  <router-outlet />
</main>
```

### 7. Spinners and loading states

Framework spinner components often follow ARIA patterns but may need accessible names.

**Framework-Agnostic Fix**:
- Keep the component's default semantics
- Add an accessible name if the spinner would otherwise be ambiguous
- Use a nearby `aria-live="polite"` message only when the loading state itself must be announced

#### Angular (MatSpinner)
```html
<!-- ✅ Spinner keeps its default progressbar semantics -->
<mat-progress-spinner
  [attr.aria-label]="'LOADING_ARIA' | transloco"
  mode="indeterminate"
  diameter="32"
/>
```

#### React
```jsx
{isLoading && (
  <div role="status" aria-label={t('loadingAria')}>
    <Spinner />
  </div>
)}
```

#### Vue
```vue
<transition name="fade">
  <div
    v-if="isLoading"
    role="status"
    :aria-label="t('loadingAria')"
  >
    <Spinner />
  </div>
</transition>
```

### 8. Dialogs, drawers, and disclosure controls

Interactive overlays and expandable sections must expose state and preserve focus behavior.

**Framework-Agnostic Verify**:
- The trigger has an accessible name
- Expandable controls expose `aria-expanded` when they show or hide related content
- Dialogs have a visible title and, when needed, a description
- Focus moves into the dialog when opened and returns to the trigger when closed

#### Framework-Agnostic Pattern
```html
<button
  type="button"
  aria-controls="filters-panel"
  [aria-expanded]="isFiltersOpen()"
  (click)="toggleFilters()"
>
  {{ t('filtersLabel') }}
</button>

<!-- Conditional rendering of panel based on framework -->
<div id="filters-panel" [hidden]="!isFiltersOpen()">
  <!-- Panel content -->
</div>
```

## Translation Convention (Framework Adaptation)

All accessible names and descriptions must use translated strings. Never hard-code text directly in templates.

- **Angular**: Use Transloco service (`{{ 'key' | transloco }}`) or framework i18n
- **React**: Use i18next, react-i18next, or similar (`t('key')`)
- **Vue**: Use vue-i18n or built-in i18n (`$t('key')`)
- **Plain JS/HTML**: Use appropriate i18n library or data attributes

**Key naming convention**: append `-aria` to accessible-name keys and `-description` when the text is used for extra context

**Example JSON additions** (adapt to your i18n format):
```json
{
  "table": {
    "select-all-aria": "Select all items",
    "select-row-aria": "Select item {{itemNumber}}",
    "discount-amount-aria": "Discount amount for invoice {{invoiceNumber}}"
  },
  "pagination": {
    "previous-aria": "Previous page",
    "next-aria": "Next page"
  },
  "selection-detail": {
    "close-btn-aria": "Close details panel"
  }
}
```

## Validation Checklist (Framework Adaptation)

After fixing, verify framework-appropriately:

- [ ] Viewport meta tag has no `maximum-scale` or `user-scalable=no`
- [ ] Page has exactly one `<main>` landmark
- [ ] All icon-only buttons have an accessible name
- [ ] Decorative icons inside labelled controls use `aria-hidden="true"`
- [ ] Form controls have a visible label, `aria-labelledby`, or `aria-label` as appropriate
- [ ] Empty checkbox components have `[aria-label]` or `[aria-labelledby]`
- [ ] Clickable `div` and `span` elements were replaced with semantic controls
- [ ] Expand/collapse controls expose `aria-expanded` when applicable
- [ ] Dialogs and drawers keep correct focus entry and focus return behavior
- [ ] Loading indicators keep correct semantics and use a live region only when announcement is needed
- [ ] Informative images have meaningful `alt`; decorative images use empty `alt=""`
- [ ] Keyboard-only navigation works end-to-end and focus stays visible
- [ ] All accessible text uses translated/i18n strings
- [ ] Accessibility checks pass: appropriate framework/linter tools
- [ ] Automated audit was re-run on the affected screen

## Known Limits

- This skill covers common template and component-level accessibility issues, not full WCAG certification
- Color contrast, timing, motion, content wording, and design-system token changes may require separate design or product decisions
- Complex screen reader behavior should be validated on the real user flow, not assumed from lint output alone
- Framework-specific accessibility patterns should be respected while maintaining framework-agnostic principles