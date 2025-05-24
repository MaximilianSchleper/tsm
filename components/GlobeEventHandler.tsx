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
        const pickedObject: unknown = viewer.scene.pick(movement.position);
        
        let entityToSet: Cesium.Entity | null = null;

        if (
          pickedObject &&
          typeof pickedObject === 'object' &&
          'id' in pickedObject &&
          pickedObject.id instanceof Cesium.Entity
        ) {
          const pickedEntity = pickedObject.id; // TypeScript now knows pickedEntity is Cesium.Entity
          
          // Handle coverage zone clicks - show satellite details for the zone's owner
          if (typeof pickedEntity.id === 'string' && pickedEntity.id.startsWith('coverage-')) {
            // Extract satellite ID from coverage zone ID (format: "coverage-demo-satellite-50001")
            const satelliteId = pickedEntity.id.replace('coverage-', '');
            
            // Find the corresponding satellite entity
            const satelliteEntity = viewer.entities.getById(satelliteId);
            if (satelliteEntity) {
              entityToSet = satelliteEntity;
            } else {
              entityToSet = null;
            }
          }
          // Check if this is a satellite (demo or custom constellation)
          else if (typeof pickedEntity.id === 'string' && 
                   (pickedEntity.id.startsWith('demo-satellite-') || pickedEntity.id.startsWith('custom-satellite-'))) {
            entityToSet = pickedEntity;
          } else {
            // Not a satellite or coverage zone - clear selection
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