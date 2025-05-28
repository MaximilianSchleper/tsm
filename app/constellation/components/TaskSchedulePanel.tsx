import React from 'react';
import { useDraggableResizable } from '../../../hooks/useDraggableResizable';

const TaskSchedulePanel = () => {
  const {
    position,
    size,
    handleMouseDownDrag,
    handleMouseDownResize,
    isResizable,
  } = useDraggableResizable({
    initialPosition: { top: 70, left: 20 },
    initialSize: { width: 300, height: 450 }, // Adjusted initial height
    minWidth: 280, // Slightly adjusted min width
    minHeight: 300, // Adjusted minHeight to accommodate two sections better
  });

  return (
    <div
      className="draggable-window"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
    >
      <div className="window-header" onMouseDown={handleMouseDownDrag}>
        Target Definition
      </div>
      <div className="window-content task-schedule-panel-content">
        <div className="placeholder-box target-definition-placeholder">
          Target Definition Form Placeholder
        </div>
        <h3 className="content-main-header-style">
          Task Schedule
        </h3>
        <div className="placeholder-box task-list-placeholder">
          Task List Placeholder
        </div>
      </div>
      {isResizable && <div className="resize-handle" onMouseDown={handleMouseDownResize}></div>}
    </div>
  );
};

export default TaskSchedulePanel; 