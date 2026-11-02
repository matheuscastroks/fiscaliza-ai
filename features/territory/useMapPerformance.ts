import { useEffect, useState } from 'react';
import { beginMapTrace, endMapTrace, mapTraceId, mapPerformanceEvent } from './mapPerformance';

export function useMapPerformance(isFocused: boolean, isListView: boolean) {
  const [mapVisited, setMapVisited] = useState(!isListView);
  const [visitTrace, setVisitTrace] = useState(mapTraceId);
  useEffect(() => {
    if (!isFocused || isListView) return;
    if (!mapTraceId()) beginMapTrace('focus-only');
    const trace = mapTraceId();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisitTrace(trace);
    mapPerformanceEvent('focus');
    return () => endMapTrace(trace);
  }, [isFocused, isListView]);
  useEffect(() => {
    if (isFocused) mapPerformanceEvent('commit');
  });
  useEffect(() => {
    // Remember an opened map without initializing it for a list-only visit.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isListView && !mapVisited) setMapVisited(true);
  }, [isListView, mapVisited]);
  const [interactionsComplete, setInteractionsComplete] = useState(false);
  useEffect(() => {
    if (!isFocused) return;
    let cancelled = false;
    const scheduleIdle =
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 50);
    const cancelIdle =
      typeof cancelIdleCallback !== 'undefined'
        ? cancelIdleCallback
        : (id: any) => clearTimeout(id);

    const handle = scheduleIdle(() => {
      if (!cancelled) setInteractionsComplete(true);
    });

    return () => {
      cancelled = true;
      cancelIdle(handle);
      setInteractionsComplete(false);
    };
  }, [isFocused]);

  // A list→map click starts a new trace without changing screen focus.
  const trace = mapTraceId();
  return { mapVisited, interactionsComplete, visitTrace: trace ?? visitTrace };
}
