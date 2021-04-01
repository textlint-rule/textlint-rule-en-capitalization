// MIT © 2017 azu
"use strict";
const TextLintTester = require("textlint-tester");
const rule = require("../src/textlint-rule-en-capitalization");
const tester = new TextLintTester();
tester.run("capitalization", rule, {
    valid: [
        // Ignore non [a-zA-Z] started word,
        // number-started text https://github.com/textlint-rule/textlint-rule-en-capitalization/issues/7
        "1st line.",
        "In text, follow the standard capitalization rules for American English. Additionally:",
        "First, sentence should be capital. Second, sentence should be capital.",
        "`Code`, this is ok.",
        "This is **good**. But that it not good.",
        "# Capitalization in titles and headings",
        "## Capitalization and colons\n" +
            "Use a lowercase letter to begin the first word of the text immediately following a colon, unless the text is one of the following:",
        `
- A proper noun.
- A quotation.
- An item in a bulleted, numbered, or definition list.
- Text that follows a label, such as a Caution or Note.
- A subheading on the same line as a heading.
`,
        {
            text: "![image](http://exmaple.com) is not capital.",
            options: {
                allowFigures: false,
            },
        },
        {
            text: "textlint is allowed.",
            options: {
                allowWords: ["textlint"],
            },
        },
        // https://github.com/textlint-rule/textlint-rule-en-capitalization/issues/2
        `# Anatomy of a Package

A minimal npm package should contain metadata in a _package.json_ file and an associated source file (usually _index.js_). In practice, packages contain more than that and you will have at least a license file and the source in various formats.`,
        // need space after .
        "This is pass.it's style is bad...",
        // List > CodeBlock bug
        // https://github.com/textlint-rule/textlint-rule-en-capitalization/issues/4
        "1. First text.\n" +
            "\n" +
            "    ```bash\n" +
            "    ssh -i <key>\n" +
            "        -L <path>\n" +
            "        location@ip\n" +
            "    ```\n" +
            "\n",
        // https://github.com/textlint-rule/textlint-rule-en-capitalization/issues/10
        "This is a sentence: <https://google.com//search?q=something>",
    ],
    invalid: [
        {
            text: "in text, follow the standard capitalization rules for American English",
            output: "In text, follow the standard capitalization rules for American English",
            errors: [
                {
                    index: 0,
                    message:
                        "Paragraph: Follow the standard capitalization rules for American English.\n" +
                        "See https://owl.english.purdue.edu/owl/resource/592/01/",
                },
            ],
        },
        {
            text: "first, sentence should be capital. second, sentence should be capital.",
            output: "First, sentence should be capital. Second, sentence should be capital.",
            errors: [
                {
                    index: 0,
                },
                {
                    index: 35,
                },
            ],
        },
        {
            text: "# capitalization in titles and headings",
            output: "# Capitalization in titles and headings",
            errors: [
                {
                    index: 2,
                },
            ],
        },
        {
            text: `
- a proper noun.
- a quotation.
- an item in a bulleted, numbered, or definition list.
- text that follows a label, such as a Caution or Note.
- a subheading on the same line as a heading.
`,
            output: `
- A proper noun.
- A quotation.
- An item in a bulleted, numbered, or definition list.
- Text that follows a label, such as a Caution or Note.
- A subheading on the same line as a heading.
`,
            errors: [{}, {}, {}, {}, {}],
        },
        {
            text: "This is **good**. but that it not good.",
            errors: [
                {
                    index: 18,
                },
            ],
        },
        {
            text: "![image](http://exmaple.com) is not capital.",
            errors: [
                {
                    index: 0,
                    message: `Image alt: Follow the standard capitalization rules for American English
See https://owl.english.purdue.edu/owl/resource/592/01/`,
                },
            ],
        },
    ],
});
