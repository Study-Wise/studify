import propertyOrder from './src/styles/property-order.json' with { type: 'json' };

/** @type {import('stylelint').Config} */
export default {
    extends: "stylelint-config-standard-scss",
    plugins: ['stylelint-order'],
    rules: {
        "keyframes-name-pattern": ["^--[a-z][a-z0-9]*(-[a-z0-9]+)*$", {
            message: "Expected keyframe name \"%s\" to be kebab-case and prefixed with \"--\" to match the rule for all user-defined things in css."
        }],
        "layer-name-pattern": ["^--[a-z][a-z0-9]*(-[a-z0-9]+)*$", {
            message: "Expected layer name \"%s\" to be kebab-case and prefixed with \"--\" to match the rule for all user-defined things in css."
        }],
        "container-name-pattern": ["^--[a-z][a-z0-9]*(-[a-z0-9]+)*$", {
            message: "Expected container name \"%s\" to be kebab-case and prefixed with \"--\" to match the rule for all user-defined things in css."
        }],
        "declaration-property-value-allowed-list": [{
            "/^counter-(reset|increment|set)$/": ["/^(none|--[a-z][a-z0-9]*(-[a-z0-9]+)*(\\s+-?\\d+)?(\\s+--[a-z][a-z0-9]*(-[a-z0-9]+)*(\\s+-?\\d+)?)*)$/"],
            "view-transition-name": ["/^(none|root|match-element|--[a-z][a-z0-9]*(-[a-z0-9]+)*)$/"]
        }, {
            message: "Unexpected \"%s: %s\": counter and view transition names must be kebab-case and prefixed with \"--\" to match the rule for all user-defined things in css."
        }],
        "property-no-vendor-prefix": [true, {
            ignoreProperties: ["-webkit-backdrop-filter"]
        }],
        "declaration-block-no-redundant-longhand-properties": [true, {
            "ignoreShorthands": ["flex-flow"]
        }],
        "scss/operator-no-unspaced": null,
        'font-family-name-quotes': null,
        'declaration-property-value-disallowed-list': {
            flex: ['row', 'column', 'row-reverse', 'column-reverse'],
        },
        'order/properties-order': Object.values(propertyOrder).flat().filter(p => !p.startsWith('//') && !p.startsWith('@')),
        'order/order': ['declarations', { type: 'at-rule', name: propertyOrder.Includes[0].slice(1) }, 'rules'],
    },
    overrides: [
        {
            files: ["src/styles/variables/tokens.scss"],
            rules: {
                "scss/dollar-variable-colon-space-before": null,
                "scss/dollar-variable-colon-space-after": null
            }
        }
    ]
};
