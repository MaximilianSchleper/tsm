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
      // console.log("[GlobeEventHandler] ScreenSpaceEventHandler created.");
      handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const pickedObject: unknown = viewer.scene.pick(movement.position);
        // console.log("[GlobeEventHandler] Clicked. pickedObject:", pickedObject);
        
        let entityToSet: Cesium.Entity | null = null;

        if (
          pickedObject &&
          typeof pickedObject === 'object' &&
          'id' in pickedObject &&
          pickedObject.id instanceof Cesium.Entity
        ) {
          const pickedEntity = pickedObject.id; // TypeScript now knows pickedEntity is Cesium.Entity
          
          if (pickedEntity.id === 'test-satellite-iss') {
            // console.log('[GlobeEventHandler] Test satellite clicked:', pickedEntity);
            entityToSet = pickedEntity;
            // console.log("[GlobeEventHandler] Called setSelectedSatellite (via flushSync) with entity:", pickedEntity);
          } else {
            // console.log("[GlobeEventHandler] Called setSelectedSatellite (via flushSync) with null (other entity clicked).");
            // entityToSet remains null, handled by the final flushSync
          }
        } else {
          // console.log("[GlobeEventHandler] Called setSelectedSatellite (via flushSync) with null (no valid entity id or picked object).");
          // entityToSet remains null, handled by the final flushSync
        }

        ReactDOM.flushSync(() => {
          if (setSelectedSatellite) { // Check if setSelectedSatellite is defined before calling
            setSelectedSatellite(entityToSet);
          }
        });

      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      return () => {
        handler.destroy();
      };
    }
  }, [viewer, setSelectedSatellite]);

  return null; // This component does not render anything itself
};

export default GlobeEventHandler; 