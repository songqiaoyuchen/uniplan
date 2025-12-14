import { useDraggable } from "@dnd-kit/core";
import { useModuleState } from "../../hooks";
import { memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleTooltip from "./ModuleTooltip";
import { moduleSelected } from "@/store/timetableSlice";
import { useDispatch } from "react-redux";
import ModuleTooltipPlaceholder from "@/components/placeholders/ModuleTooltipPlaceholder";

interface SidebarModuleProps {
  moduleCode: string;
};

const SidebarModule: React.FC<SidebarModuleProps> = ({ moduleCode }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { module, isPlanned, isLoading, isError } = useModuleState(moduleCode);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: moduleCode + '-sidebar',
    disabled: isPlanned,
    data: {
      type: 'module',
      dragActivationConstraint: {
        distance: 5,
      },
    },
  });

  const handleClick = useCallback(() => {
    router.push(`?module=${moduleCode}`, { scroll: false });
    dispatch(moduleSelected(moduleCode))
  }, [moduleCode]);

  if (isLoading) {
    return <ModuleTooltipPlaceholder />
  }
  if (isError || !module) {
    return 
  }
  
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      style={{ touchAction: "none" }}
    >
      <ModuleTooltip 
        module={module}
        isPlanned={isPlanned}
      />
    </div>
  )
}

export default memo(SidebarModule)
