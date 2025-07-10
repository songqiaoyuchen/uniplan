"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem, treeItemClasses } from "@mui/x-tree-view/TreeItem";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import type { PrereqTree } from "@/types/plannerTypes";
import MinModuleCard from "./MinModuleCard";
import { styled } from "@mui/material/styles";

interface PrereqTreeViewProps {
  prereqTree: PrereqTree;
}

// Helper function to get all parent node IDs for default expansion
const getAllParentIds = (node: PrereqTree, prefix = "0"): string[] => {
  if (node.type === "module") {
    return [];
  }
  const childIds = node.children.flatMap((child, index) =>
    getAllParentIds(child, `${prefix}-${index}`),
  );
  return [prefix, ...childIds];
};

const PrereqTreeView: React.FC<PrereqTreeViewProps> = ({ prereqTree }) => {
  const allParentIds = React.useMemo(
    () => getAllParentIds(prereqTree),
    [prereqTree],
  );
  const [expandedItems, setExpandedItems] =
    React.useState<string[]>(allParentIds);

  // Ensure we update expandedItems when prereqTree changes
  React.useEffect(() => {
    setExpandedItems(allParentIds);
  }, [allParentIds]);

  const renderTree = (node: PrereqTree, idPath = "0"): React.ReactNode => {
    if (node.type === "module") {
      return (
        <StyledTreeItem
          key={idPath}
          itemId={idPath}
          label={
            <MinModuleCard
              moduleCode={node.moduleCode}
            />
          }
        />
      );
    }

    const title =
      node.type === "AND"
        ? "All of the following:"
        : node.type === "OR"
          ? "At least 1 of:"
          : `At least ${node.n} of:`;

    return (
      <TreeItem
        key={idPath}
        itemId={idPath}
        label={
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            {title}
          </Typography>
        }
      >
        {node.children.map((child, i) => renderTree(child, `${idPath}-${i}`))}
      </TreeItem>
    );
  };

  return (
    <Box sx={{ flexGrow: 1, maxWidth: 400 }}>
      <SimpleTreeView
        aria-label="Prerequisite modules"
        expandedItems={expandedItems}
        onExpandedItemsChange={(_, ids) => setExpandedItems(ids)}
        slots={{
          collapseIcon: ExpandMoreIcon,
          expandIcon: ChevronRightIcon,
        }}
        sx={{
          "& .MuiTreeItem-groupTransition": {
            marginLeft: "12px",
            paddingLeft: "14px",
            borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
          },
          "& .MuiTreeItem-content": {
            paddingY: "4px",
            paddingX: "8px",
          },
        }}
      >
        {renderTree(prereqTree)}
      </SimpleTreeView>
    </Box>
  );
};

const StyledTreeItem = styled(TreeItem)(({ theme }) => ({
  // Remove all interactive visual cues
  [`& .${treeItemClasses.content}`]: {
    backgroundColor: "transparent",
    padding: 0,
    cursor: "default", // disables pointer cursor
    "&:hover": {
      backgroundColor: "transparent",
    },
    "&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused": {
      backgroundColor: "transparent",
    },
  },

  // Remove icon space
  [`& .${treeItemClasses.iconContainer}`]: {
    display: "none",
  },

  // Optional: reduce extra margin/padding around group
  [`& .${treeItemClasses.label}`]: {
    marginLeft: 0,
  },
}));

export default PrereqTreeView;
