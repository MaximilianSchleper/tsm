"use client";

import { useEffect } from 'react';
import * as Cesium from "cesium";
import { useCesium } from "resium";
import ReactDOM from 'react-dom';

interface GlobeEventHandlerProps {
  setSelectedSatellite?: (satellite: Cesium.Entity | null) => void;
}

const GlobeEventHandler: React.FC<GlobeEventHandlerProps> = ({ setSelectedSatellite }) => {
  const { viewer } = useCesium();

  useEffect(() => {
    if (viewer && setSelectedSatellite) {
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const pickedObject = viewer.scene.pick(movement.position);
        
        if (pickedObject && typeof pickedObject === 'object' && 'id' in pickedObject) {
          const pickedId = (pickedObject as { id: unknown }).id;

          if (pickedId instanceof Cesium.Entity) {
            const entity = pickedId;
            if (entity.id === 'test-satellite-iss') {
              ReactDOM.flushSync(() => {
                setSelectedSatellite(entity);
              });
            } else {
              ReactDOM.flushSync(() => {
                setSelectedSatellite(null);
              });
            }
          } else {
            ReactDOM.flushSync(() => {
              setSelectedSatellite(null);
            });
          }
        } else {
          ReactDOM.flushSync(() => {
            setSelectedSatellite(null);
          });
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      return () => {
        handler.destroy();
      };
    }
  }, [viewer, setSelectedSatellite]);

  return null; // This component does not render anything itself
};

export default GlobeEventHandler; 