import { useState, useCallback, useMemo } from 'react';
import { SVG_WIDTH, SVG_HEIGHT } from '../utils/metro';

export function useZoomPan() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.min(Math.max(0.5, z + delta), 4));
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.button === 0 && (e.ctrlKey || e.metaKey || zoom > 1)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan, zoom]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => setZoom(z => Math.min(z + 0.25, 4)), []);
  const zoomOut = useCallback(() => setZoom(z => Math.max(z - 0.25, 0.5)), []);

  const centerOnStation = useCallback((station, containerRef) => {
    if (station && containerRef.current) {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      const scaleX = containerRect.width / SVG_WIDTH;
      const scaleY = containerRect.height / SVG_HEIGHT;
      const scale = Math.min(scaleX, scaleY);
      
      const stationScreenX = station.x * scale * zoom;
      const stationScreenY = station.y * scale * zoom;
      
      setPan({
        x: containerRect.width / 2 - stationScreenX,
        y: containerRect.height / 2 - stationScreenY
      });
    }
  }, [zoom]);

  const handlers = useMemo(() => ({
    onWheel: handleWheel,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp
  }), [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  const controls = useMemo(() => ({
    zoomIn,
    zoomOut,
    resetZoom,
    centerOnStation
  }), [zoomIn, zoomOut, resetZoom, centerOnStation]);

  return {
    zoom,
    pan,
    isPanning,
    handlers,
    controls
  };
}
