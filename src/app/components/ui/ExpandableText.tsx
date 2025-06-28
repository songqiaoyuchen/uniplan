import { useState, useEffect } from 'react';
import { Typography, Link } from '@mui/material';

const ExpandableText = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  const limit = 100;

  useEffect(() => {
    setExpanded(false); // Reset when a new text is received
  }, [text]);

  const shouldTruncate = text.length > limit;
  const visibleText = expanded || !shouldTruncate
    ? text
    : text.slice(0, limit).trimEnd();

  return (
    <Typography variant="body2" color="text.secondary">
      {visibleText}
      {shouldTruncate && (
        <>
          {!expanded && '... '}
          <Link
            component="button"
            onClick={() => setExpanded((prev) => !prev)}
            variant="body2"
            underline="none"
            sx={{ ml: 0.5 }}
          >
            {expanded ? 'Show less' : 'Show more'}
          </Link>
        </>
      )}
    </Typography>
  );
};

export default ExpandableText;
