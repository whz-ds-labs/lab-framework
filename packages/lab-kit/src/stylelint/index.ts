import stylelint from 'stylelint'
import type { PostcssResult, Rule } from 'stylelint'
import type { ChildNode, Comment, Declaration, Root, Rule as PostcssRule } from 'postcss'

const { utils } = stylelint

const SEPARATOR = 'ds-labs/no-separator-lines'
const COLOR_TOKENS = 'ds-labs/color-tokens-only'

const separatorMessages = utils.ruleMessages(SEPARATOR, {
  rejectedBorder: (prop: string) =>
    `Unexpected "${prop}" with a visible line: structure comes from surfaces and spacing, not separators`,
  rejectedHr: 'Unexpected "hr" selector: no line separators in the design',
  missingReason: 'ds-labs-allow needs a reason',
})

const colorMessages = utils.ruleMessages(COLOR_TOKENS, {
  rejectedColor: (value: string) => `Unexpected color "${value}": use a --ds-* token via var()`,
  missingReason: 'ds-labs-allow needs a reason',
})

type Allow = { kind: 'none' } | { kind: 'reason' } | { kind: 'empty'; comment: Comment }

/** Looks at the node directly before `node` for a `ds-labs-allow: <reason>` comment. */
function allowFor(node: ChildNode): Allow {
  const prev = node.prev()
  if (!prev || prev.type !== 'comment') return { kind: 'none' }
  const m = /^\s*ds-labs-allow:(.*)$/s.exec(prev.text)
  if (!m) return { kind: 'none' }
  return m[1]!.trim() === '' ? { kind: 'empty', comment: prev } : { kind: 'reason' }
}

/** A valid allow comment suppresses the violation; an empty one reports the missing reason instead. Returns true when handled. */
function handleAllow(allow: Allow, ruleName: string, message: string, result: PostcssResult): boolean {
  if (allow.kind === 'reason') return true
  if (allow.kind === 'empty') {
    utils.report({ ruleName, result, message, node: allow.comment })
    return true
  }
  return false
}

const BORDER_PROP = /^(border(-(top|right|bottom|left|block|inline)(-(start|end))?)?|border-width|border-style)$/i

function isNoLine(value: string): boolean {
  const v = value.trim().toLowerCase()
  return v === 'none' || v === '0' || v === 'hidden' || v.startsWith('0 ') || v.startsWith('none')
}

/** Blanks strings and url(...) so their content cannot match. */
function stripOpaque(text: string): string {
  return text.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""').replace(/url\([^)]*\)/gi, 'url()')
}

const HR_SELECTOR = /(?:^|[\s>+~,(])hr(?![\w-])/i

const separatorRule: Rule = Object.assign(
  (primary: unknown) => (root: Root, result: PostcssResult) => {
    if (!utils.validateOptions(result, SEPARATOR, { actual: primary, possible: [true] })) return

    root.walkDecls((decl: Declaration) => {
      if (!BORDER_PROP.test(decl.prop) || isNoLine(decl.value)) return
      if (handleAllow(allowFor(decl), SEPARATOR, separatorMessages.missingReason, result)) return
      utils.report({
        ruleName: SEPARATOR,
        result,
        message: separatorMessages.rejectedBorder(decl.prop),
        node: decl,
        word: decl.prop,
      })
    })

    root.walkRules((rule: PostcssRule) => {
      const selector = stripOpaque(rule.selector.replace(/\[[^\]]*\]/g, '[]'))
      if (!HR_SELECTOR.test(selector)) return
      if (handleAllow(allowFor(rule), SEPARATOR, separatorMessages.missingReason, result)) return
      utils.report({ ruleName: SEPARATOR, result, message: separatorMessages.rejectedHr, node: rule })
    })
  },
  { ruleName: SEPARATOR, messages: separatorMessages },
)

const HEX_COLOR = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/i
const COLOR_FUNCTION = /(?<![\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i

// Properties whose value may hold a color keyword (custom properties are handled separately).
const COLOR_PROP =
  /^(color|background|background-color|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|outline|outline-color|fill|stroke|box-shadow|text-shadow|text-decoration-color|caret-color|accent-color|column-rule-color)$/i

const NAMED_COLORS = [
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black', 'blanchedalmond', 'blue',
  'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk',
  'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki',
  'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen',
  'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue',
  'dimgray', 'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro',
  'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred',
  'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral',
  'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon',
  'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime',
  'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple',
  'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue',
  'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange',
  'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff',
  'peru', 'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple', 'red', 'rosybrown', 'royalblue', 'saddlebrown',
  'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray',
  'slategrey', 'snow', 'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet',
  'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen',
]
// A name only counts as a whole word: "--red" or "red-pulse" are not colors.
const NAMED_COLOR = new RegExp(`(?<![\\w-])(?:${NAMED_COLORS.join('|')})(?![\\w-])`, 'i')

const colorRule: Rule = Object.assign(
  (primary: unknown) => (root: Root, result: PostcssResult) => {
    if (!utils.validateOptions(result, COLOR_TOKENS, { actual: primary, possible: [true] })) return

    root.walkDecls((decl: Declaration) => {
      const value = stripOpaque(decl.value)
      const found =
        HEX_COLOR.exec(value) ??
        COLOR_FUNCTION.exec(value) ??
        (decl.prop.startsWith('--') || COLOR_PROP.test(decl.prop) ? NAMED_COLOR.exec(value) : null)
      if (!found) return
      if (handleAllow(allowFor(decl), COLOR_TOKENS, colorMessages.missingReason, result)) return
      utils.report({
        ruleName: COLOR_TOKENS,
        result,
        message: colorMessages.rejectedColor(found[0].replace(/\($/, '')),
        node: decl,
        word: found[0],
      })
    })
  },
  { ruleName: COLOR_TOKENS, messages: colorMessages },
)

export default [
  { ruleName: SEPARATOR, rule: separatorRule },
  { ruleName: COLOR_TOKENS, rule: colorRule },
]
