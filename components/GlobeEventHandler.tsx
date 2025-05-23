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
          
          // Check if this is any satellite (test satellite or demo constellation satellite)
          if (pickedEntity.id === 'test-satellite-iss' || 
              (typeof pickedEntity.id === 'string' && pickedEntity.id.startsWith('demo-satellite-'))) {
            console.log('[GlobeEventHandler] Satellite clicked:', pickedEntity.name, 'ID:', pickedEntity.id);
            entityToSet = pickedEntity;
          } else {
            // Not a satellite - clear selection
            entityToSet = null;
          }
        } else {
          // No valid entity picked - clear selection
          entityToSet = null;
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