"use client";

import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";

interface TagProps {
  text: string;
  maxLength?: number; // default: 7
}

const Tag = ({ text, maxLength = 7 }: TagProps) => {
  const isTruncated = text.length > maxLength;
  const displayText = isTruncated
    ? text.slice(0, maxLength - 1) + "…"
    : text;

  return (
    <Tooltip title={isTruncated ? text : ""} arrow>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          height: 24,
          px: 1,
          borderRadius: "16px",
          fontSize: "13px",
          fontWeight: 500,
          lineHeight: 1,
          backgroundColor: (theme) => theme.palette.action.selected,
          color: (theme) => theme.palette.text.primary,
        }}
      >
        {displayText}
      </Box>
    </Tooltip>
  );
};

export default Tag;
