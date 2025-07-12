import { useDraggable } from "@dnd-kit/core";
import { useModuleState } from "../../hooks";
import MiniModuleCard from "./MiniModuleCard";
import { memo, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SidebarModuleProps {
  moduleCode: string;
};

const SidebarModule: React.FC<SidebarModuleProps> = ({ moduleCode }) => {
  const router = useRouter();
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
  }, [moduleCode]);

  if (isLoading) {
    return <div ref={setNodeRef}>Loading…</div>;
  }
  if (isError || !module) {
    return <div ref={setNodeRef}>Error loading module</div>;
  }
  
  return (
    <>
      { isDragging && <div
          ref={setNodeRef}
        />}
      <div {...listeners} {...attributes} onClick={handleClick}>
        <MiniModuleCard moduleCode={module.code} moduleTitle={module.title} isPlanned={isPlanned} />
      </div>
    </>
  )
}

export default memo(SidebarModule)
