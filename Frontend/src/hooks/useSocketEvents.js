import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Subscribe to one or more socket events and run callbacks.
 * Auto-cleans up listeners on unmount.
 *
 * @param {Object} eventMap - { eventName: callbackFn, ... }
 *
 * Usage:
 *   useSocketEvents({
 *     'task:updated': (data) => refetchTasks(),
 *     'alert:new': (data) => toast.info('New alert!'),
 *   });
 */
const useSocketEvents = (eventMap) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !eventMap) return;

    const entries = Object.entries(eventMap);

    entries.forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      entries.forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket, eventMap]);
};

export default useSocketEvents;
