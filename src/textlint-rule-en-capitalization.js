// MIT © 2017 azu
"use strict";
const { RuleHelper } = require("textlint-rule-helper");
const StringSource = require("textlint-util-to-string");
const { split, Syntax: SentenceSyntax } = require("sentence-splitter");
import { getPosFromSingleWord, isCapitalized, upperFirstCharacter } from "./captalize";

const shouldNotCapitalized = string => {
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
 * @param {boolean} figures enable figures check
 */
const checkNode = ({ node, Syntax, getSource, report, RuleError, fixer, figures }) => {
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
            if (isCapitalized(firstWord) || shouldNotCapitalized(firstWord)) {
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
        } else if (figures && targetNode.type === Syntax.Image && typeof targetNode.alt === "string") {
            const text = targetNode.alt;
            if (isCapitalized(text) || shouldNotCapitalized(text)) {
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
    heading: true,
    figures: true,
    lists: true
};
const report = (context, options = {}) => {
    const { Syntax, RuleError, getSource, fixer, report } = context;
    const heading = options.heading !== undefined ? options.heading : DefaultOptions.heading;
    const figures = options.figures !== undefined ? options.figures : DefaultOptions.figures;
    const lists = options.lists !== undefined ? options.lists : DefaultOptions.lists;
    const helper = new RuleHelper(context);
    return {
        [Syntax.Header](node) {
            // options
            if (!heading) {
                return;
            }
            checkNode({ node, Syntax, getSource, report, RuleError, fixer, figures });
        },
        [Syntax.Paragraph](node) {
            if (helper.isChildNode(node, [Syntax.Link, Syntax.Image, Syntax.BlockQuote, Syntax.Emphasis])) {
                return;
            }
            if (helper.isChildNode(node, [Syntax.ListItem])) {
                return;
            }
            checkNode({ node, Syntax, getSource, report, RuleError, fixer, figures });
        },
        [Syntax.ListItem](node) {
            if (!lists) {
                return;
            }
            checkNode({ node, Syntax, getSource, report, RuleError, fixer, figures });
        }
    };
};
module.exports = {
    linter: report,
    fixer: report
};
