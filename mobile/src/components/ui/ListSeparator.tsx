import { StyleSheet, View } from "react-native";

import { spacing } from "@/lib/theme/tokens";

/**
 * Vertical spacing between FlashList rows.
 *
 * A `gap` in `contentContainerStyle` looks like it works and does not. FlashList
 * 2 absolutely positions every cell (`position: "absolute"` at a computed
 * `top`), so the content container's flex children are the header, the single
 * view-holder collection and the footer — not the rows. A `gap` there spaces
 * those three, and `gap` never applies to absolutely positioned children, so
 * the rows end up flush against each other with no error to hint at it.
 *
 * This renders inside the cell, which the layout manager does measure, so the
 * space becomes part of the row's height. Declared at module scope to keep the
 * reference stable — FlashList memoises cells against it.
 */
export function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  separator: {
    height: spacing.md,
  },
});