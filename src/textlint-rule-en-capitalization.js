// MIT © 2017 azu
"use strict";
const { RuleHelper } = require("textlint-rule-helper");
const StringSource = require("textlint-util-to-string");
const { split, Syntax: SentenceSyntax } = require("sentence-splitter");
import { getPosFromSingleWord, isCapitalized, upperFirstCharacter } from "./captalize";

const shouldNotCapitalized = (string, allowWords) => {
    // allow words
    const shouldAllowed = allowWords.some(allowWord => {
        return allowWord === string;
    });
    if (shouldAllowed) {
        return true;
    }
    // A quotation
    if (!/^\w/.test(string)) {
        return true;
    }
    // proper word
    const pos = getPosFromSingleWord(string);
    if (/^NNP/.test(pos)) {
        return true;
    }
    return false;
};

/**
 * get node at index
 * @param node
 * @param index
 * @returns {undefined|*}
 */
const getNodeAtIndex = (node, index) => {
    if (!node || !node.children) {
        return undefined;
    }
    for (let i = 0; i < node.children.length; i++) {
        const childNode = node.children[i];
        if (childNode.range[0] <= index && index <= childNode.range[1]) {
            return childNode;
        }
    }
    return undefined;
};
/**
 * @param node
 * @param Syntax
 * @param {function} getSource
 * @param report
 * @param RuleError
 * @param fixer
 * @param {boolean} allowFigures enable figures check
 * @param {string[]} allowWords allow lower-case words
 */
const checkNode = ({ node, Syntax, getSource, report, RuleError, fixer, allowFigures, allowWords }) => {
    const source = new StringSource(node);
    const sourceText = source.toString();
    const sentences = split(sourceText);
    sentences.filter(sentence => sentence.type === SentenceSyntax.Sentence).forEach(sentence => {
        const originalIndex = source.originalIndexFromIndex(sentence.range[0]);
        let targetNode;
        if (node.type === Syntax.ListItem) {
            targetNode = getNodeAtIndex(node.children[0], node.range[0] + originalIndex);
        } else {
            targetNode = getNodeAtIndex(node, originalIndex);
        }
        if (!targetNode) {
            return;
        }
        const DocumentURL = "https://owl.english.purdue.edu/owl/resource/592/01/";
        // check
        if (targetNode.type === Syntax.Str) {
            const text = sentence.value;
            const firstWord = text.split(" ")[0];
            if (isCapitalized(firstWord) || shouldNotCapitalized(firstWord, allowWords)) {
                return;
            }
            const index = originalIndex;
            return report(
                node,
                new RuleError(
                    `Heading: Follow the standard capitalization rules for American English.
See ${DocumentURL}`,
                    {
                        index: index,
                        fix: fixer.replaceTextRange([index, index + firstWord.length], upperFirstCharacter(firstWord))
                    }
                )
            );
        } else if (allowFigures && targetNode.type === Syntax.Image && typeof targetNode.alt === "string") {
            const text = targetNode.alt;
            if (isCapitalized(text) || shouldNotCapitalized(text, allowWords)) {
                return;
            }
            return report(
                targetNode,
                new RuleError(
                    `Image alt: Follow the standard capitalization rules for American English
See ${DocumentURL}`
                )
            );
        }
    });
};

const DefaultOptions = {
    // allow lower-case words in Header
    allowHeading: true,
    // allow lower-case words in Image alt
    allowFigures: true,
    // allow lower-case words in ListItem
    allowLists: true,
    // allow lower-case words in anywhere
    allowWords: []
};
const report = (context, options = {}) => {
    const { Syntax, RuleError, getSource, fixer, report } = context;
    const allowHeading = options.allowHeading !== undefined ? options.allowHeading : DefaultOptions.allowHeading;
    const allowLists = options.allowLists !== undefined ? options.allowLists : DefaultOptions.allowLists;
    const allowFigures = options.allowFigures !== undefined ? options.allowFigures : DefaultOptions.allowFigures;
    const allowWords = Array.isArray(options.allowWords) ? options.allowWords : DefaultOptions.allowWords;
    const helper = new RuleHelper(context);
    return {
        [Syntax.Header](node) {
            // options
            if (!allowHeading) {
                return;
            }
            checkNode({ node, Syntax, getSource, report, RuleError, fixer, allowFigures, allowWords });
        },
        [Syntax.Paragraph](node) {
            if (helper.isChildNode(node, [Syntax.Link, Syntax.Image, Syntax.BlockQuote, Syntax.Emphasis])) {
                return;
            }
            if (helper.isChildNode(node, [Syntax.ListItem])) {
                return;
            }
            checkNode({ node, Syntax, getSource, report, RuleError, fixer, allowFigures, allowWords });
        },
        [Syntax.ListItem](node) {
            if (!allowLists) {
                return;
            }
            checkNode({ node, Syntax, getSource, report, RuleError, fixer, allowFigures, allowWords });
        }
    };
};
module.exports = {
    linter: report,
    fixer: report
};
