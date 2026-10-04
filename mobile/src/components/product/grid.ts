import { StyleSheet } from "react-native";

import { spacing } from "@/lib/theme/tokens";

/**
 * Grid geometry for the two-up catalogue.
 *
 * FlashList owns the column width: `GridLayoutManager` divides the measured
 * content width by `numColumns` and adds no gutter of its own. So the gutter has
 * to come from the cell's own padding, and the list's horizontal padding has to
 * be pulled in by half a gutter to compensate. Doing it any other way (a `gap`,
 * or percentage widths) resolves against the *cell* width rather than the
 * screen, which silently shrinks every card to half a column.
 */
export const GRID_GUTTER = spacing.md;

/** Horizontal padding for the list itself: page margin minus half a gutter. */
export const gridListPadding = spacing.lg - GRID_GUTTER / 2;

export const gridCell = StyleSheet.create({
  cell: {
    paddingHorizontal: GRID_GUTTER / 2,
    paddingBottom: GRID_GUTTER,
  },
  /** Standalone wrap row, used for the loading skeletons. */
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});

export const GRID_COLUMNS = 2;
