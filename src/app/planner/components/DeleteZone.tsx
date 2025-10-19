"use client";
import { useDroppable } from "@dnd-kit/core";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DeleteIcon from '@mui/icons-material/Delete';

const DeleteZone = () => {
  const { setNodeRef, isOver } = useDroppable({
    id: "delete-zone",
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: 64,
        color: "primary.contrastText",
        backgroundColor: isOver ? "error.main" : "error.dark",
        borderWidth: '2px',
        borderStyle: 'dotted',
        borderColor: 'error.light',
        display: "flex",
        gap: 2,
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        fontSize: "18px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        zIndex: 2000,
        userSelect: "none",
        pointerEvents: "auto",
        transition: "background-color 0.2s ease",
      }}
    >
      <DeleteIcon />
      <Typography>Drop here to remove a module</Typography>
    </Box>
  );
};

export default DeleteZone;
